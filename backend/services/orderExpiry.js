/**
 * @file orderExpiry.js
 * @description Manejo del stock ligado a pedidos: devolución al cancelar y vencimiento
 * automático de pedidos que nunca se pagaron (Yappy/transferencia).
 *
 * Configurable por variables de entorno:
 * - PENDING_ORDER_HOURS (por defecto 48): horas que un pedido puede quedar "pendiente de
 *   pago" antes de cancelarse solo. Los pedidos contra entrega no vencen: se cobran al entregar.
 */

import pool from '../src/config/db.js';

export const DEFAULT_PENDING_ORDER_HOURS = 48;

export function getPendingOrderHours() {
  const hours = parseFloat(process.env.PENDING_ORDER_HOURS);
  return Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_PENDING_ORDER_HOURS;
}

/**
 * Recalcula products.stock como la suma de sus variantes (si tiene variantes).
 * Así el stock general nunca se desincroniza del stock por talla.
 */
export async function syncProductStock(client, productId) {
  await client.query(
    `UPDATE products p
     SET stock = v.total, updated_at = NOW()
     FROM (SELECT COALESCE(SUM(stock), 0) AS total, COUNT(*) AS n
           FROM product_variants WHERE product_id = $1) v
     WHERE p.id = $1 AND v.n > 0`,
    [productId]
  );
}

/**
 * Devuelve al inventario las unidades de un pedido. Debe llamarse dentro de una transacción.
 * @param {object} client - Cliente de pg con transacción abierta
 * @param {Array|string} rawItems - Columna orders.items (JSONB o string en pedidos antiguos)
 */
export async function restockOrderItems(client, rawItems) {
  const items = typeof rawItems === 'string' ? JSON.parse(rawItems) : (rawItems || []);
  const touched = new Set();
  for (const item of items) {
    const qty = parseInt(item.quantity) || 0;
    if (!qty || !item.product_id) continue;
    let restockedVariant = false;
    if (item.variant_id) {
      const res = await client.query('UPDATE product_variants SET stock = stock + $1 WHERE id = $2', [qty, item.variant_id]);
      restockedVariant = res.rowCount > 0;
    }
    if (!restockedVariant && item.size) {
      // La variante pudo recrearse al editar el producto: se busca por talla/color
      const res = await client.query(
        `UPDATE product_variants SET stock = stock + $1
         WHERE id = (SELECT id FROM product_variants
                     WHERE product_id = $2 AND LOWER(TRIM(size)) = LOWER(TRIM($3))
                       AND ($4::text IS NULL OR LOWER(TRIM(COALESCE(color, ''))) = LOWER(TRIM($4)) OR color IS NULL)
                     ORDER BY stock DESC LIMIT 1)`,
        [qty, item.product_id, String(item.size), item.color || null]
      );
      restockedVariant = res.rowCount > 0;
    }
    if (!restockedVariant) {
      await client.query('UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2', [qty, item.product_id]);
    }
    touched.add(item.product_id);
  }
  for (const productId of touched) await syncProductStock(client, productId);
}

/**
 * Cancela los pedidos pendientes de pago más antiguos que PENDING_ORDER_HOURS y libera su stock.
 * @returns {Promise<number>} cantidad de pedidos cancelados
 */
export async function expireStalePendingOrders(hours = getPendingOrderHours()) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT id, items FROM orders
       WHERE status = 'pending'
         AND payment_method IS NOT NULL
         AND payment_method <> 'cash_on_delivery'
         AND created_at < NOW() - make_interval(secs => $1 * 3600)
       FOR UPDATE SKIP LOCKED`,
      [hours]
    );
    for (const order of rows) {
      await restockOrderItems(client, order.items);
      await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.id]);
      await client.query(
        `INSERT INTO order_events (order_id, from_status, to_status, note)
         VALUES ($1, 'pending', 'cancelled', $2)`,
        [order.id, `Vencido automáticamente tras ${hours} h sin pago`]
      );
    }
    await client.query('COMMIT');
    return rows.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
