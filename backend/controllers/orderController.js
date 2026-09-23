/**
 * @file orderController.js
 * @description Controlador para la gestión de pedidos y transacciones de compra.
 * Maneja la creación de órdenes, seguimiento de historial y actualización de estados.
 */

import pool from '../src/config/db.js';
import {
  PAYMENT_METHODS, computeTotals, findVariant, getPricingConfig, normalizeCartItems, unitPrice
} from '../services/orderPricing.js';

/**
 * getPricing
 * @description (Público) Configuración de envío e impuestos para que el carrito y el
 * checkout muestren exactamente lo que el servidor cobrará.
 */
export const getPricing = (req, res) => {
  res.json(getPricingConfig());
};

/**
 * createOrder
 * @description Registra una nueva orden de compra.
 * El servidor es la fuente de verdad: precios, envío, impuestos y stock se calculan
 * aquí (nunca se confía en el total enviado por el cliente). Todo ocurre en una
 * transacción con bloqueo de filas para evitar vender más unidades de las que hay.
 */
export const createOrder = async (req, res) => {
  const { items, shippingDetails, paymentMethod } = req.body || {};
  const userId = req.user.id;

  let lines;
  try {
    lines = normalizeCartItems(items);
  } catch (err) {
    return res.status(err.status || 400).json({ message: err.message });
  }

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Selecciona un método de pago válido' });
  }

  const shipping = shippingDetails || {};
  const requiredShipping = ['name', 'phone', 'address', 'city'];
  const missing = requiredShipping.filter(k => !String(shipping[k] || '').trim());
  if (missing.length > 0) {
    return res.status(400).json({ message: `Faltan datos de envío: ${missing.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderItems = [];
    let subtotal = 0;

    for (const line of lines) {
      const productRes = await client.query(
        `SELECT id, title, price, stock, image_url, lifecycle_state
         FROM products WHERE id::text = $1 FOR UPDATE`,
        [line.product_id]
      );
      const product = productRes.rows[0];
      if (!product || !['Published', 'Legacy'].includes(product.lifecycle_state)) {
        throw Object.assign(new Error('Uno de los productos ya no está disponible'), { status: 409 });
      }

      const variantsRes = await client.query(
        'SELECT id, size, color, stock FROM product_variants WHERE product_id = $1 FOR UPDATE',
        [product.id]
      );
      const variant = findVariant(variantsRes.rows, line.size, line.color);
      const available = variant ? (parseInt(variant.stock) || 0) : (parseInt(product.stock) || 0);

      if (available < line.quantity) {
        const label = [product.title, line.size, line.color].filter(Boolean).join(' / ');
        throw Object.assign(
          new Error(available > 0
            ? `Solo quedan ${available} unidades de "${label}"`
            : `"${label}" está agotado`),
          { status: 409 }
        );
      }

      if (variant) {
        await client.query('UPDATE product_variants SET stock = stock - $1 WHERE id = $2', [line.quantity, variant.id]);
      }
      await client.query('UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [line.quantity, product.id]);

      const price = unitPrice(product);
      subtotal += price * line.quantity;
      orderItems.push({
        product_id: product.id,
        variant_id: variant?.id || null,
        title: product.title,
        image_url: product.image_url,
        size: line.size,
        color: line.color,
        quantity: line.quantity,
        price
      });
    }

    const totals = computeTotals(subtotal);
    const shippingDetailsClean = {
      name: String(shipping.name).trim(),
      email: String(shipping.email || req.user.email || '').trim(),
      phone: String(shipping.phone).trim(),
      address: String(shipping.address).trim(),
      city: String(shipping.city).trim(),
      zip: String(shipping.zip || '').trim(),
      notes: String(shipping.notes || '').trim()
    };

    const newOrder = await client.query(
      `INSERT INTO orders (user_id, items, subtotal, shipping_cost, tax, total, status, payment_method, shipping_details)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8) RETURNING *`,
      [userId, JSON.stringify(orderItems), totals.subtotal, totals.shipping, totals.tax, totals.total,
       paymentMethod, JSON.stringify(shippingDetailsClean)]
    );
    const order = newOrder.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.variant_id, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Error al crear orden:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};

/**
 * getMyOrders
 * @description Recupera el historial de pedidos del usuario autenticado.
 */
export const getMyOrders = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'No autorizado, falta ID de usuario' });
  }

  try {
    const orders = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(orders.rows);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ message: 'Error en el servidor', detail: error.message });
  }
};

/**
 * getAllOrders
 * @description (Admin Only) Obtiene todas las órdenes del sistema con información del cliente.
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await pool.query(
      'SELECT o.*, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
    );
    res.json(orders.rows);
  } catch (error) {
    console.error('Error al obtener todas las órdenes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * updateOrderStatus
 * @description (Admin Only) Actualiza el estado de una orden.
 * Flujo: pending (esperando pago) → paid → shipped → delivered, o cancelled.
 * Al cancelar se devuelve el stock (una sola vez); una orden cancelada no se reabre.
 */
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query('SELECT status, items, payment_method FROM orders WHERE id::text = $1 FOR UPDATE', [id]);
    if (orderResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    const current = orderResult.rows[0];

    if (current.status === 'cancelled' && status !== 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Una orden cancelada no se puede reabrir. Crea un pedido nuevo.' });
    }

    // Restauración de stock solo en la transición a 'cancelled' y solo para pedidos del
    // flujo actual (payment_method != null). Los pedidos antiguos nunca descontaron stock.
    if (status === 'cancelled' && current.status !== 'cancelled' && current.payment_method) {
      // pg devuelve JSONB ya parseado; órdenes antiguas podrían traerlo como string
      const items = typeof current.items === 'string' ? JSON.parse(current.items) : (current.items || []);
      for (const item of items) {
        const qty = parseInt(item.quantity) || 0;
        if (!qty || !item.product_id) continue;
        if (item.variant_id) {
          await client.query('UPDATE product_variants SET stock = stock + $1 WHERE id = $2', [qty, item.variant_id]);
        }
        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [qty, item.product_id]);
      }
    }

    const updatedOrder = await client.query(
      'UPDATE orders SET status = $1 WHERE id::text = $2 RETURNING *',
      [status, id]
    );

    await client.query('COMMIT');
    res.json(updatedOrder.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};
