/**
 * @file eventService.js
 * @description Servicio de gestión del ciclo de vida de campañas/temporadas y automatización de estados.
 */
import pool from '../src/config/db.js';

/**
 * Servicio de gestión del ciclo de vida de eventos (campañas y temporadas).
 *
 * Responsable de:
 * 1. Desactivar eventos cuya `end_date` ya pasó.
 * 2. Marcar productos de eventos expirados como 'Legacy' para incentivar su venta.
 */

/**
 * Expira eventos cuya fecha de fin ya pasó y actualiza el estado
 * de sus productos asociados a 'Legacy'.
 * @returns {{ expiredCount: number, updatedProducts: number }}
 */
export async function expireEvents() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener campañas/temporadas activas que ya expiraron
    const expiredRes = await client.query(`
      SELECT id, name, end_date
      FROM campaigns
      WHERE is_active = true
        AND end_date IS NOT NULL
        AND end_date < NOW()
    `);

    const expired = expiredRes.rows;

    if (expired.length === 0) {
      await client.query('COMMIT');
      return { expiredCount: 0, updatedProducts: 0 };
    }

    // 2. Desactivar cada evento expirado
    const expiredIds = expired.map(s => s.id);
    await client.query(
      `UPDATE campaigns SET is_active = false, updated_at = NOW() WHERE id = ANY($1::uuid[])`,
      [expiredIds]
    );

    // 3. Marcar los productos asociados como 'Legacy'
    // Solo si aún están en estado 'Published' para no sobreescribir
    // otros estados intencionales (Archived, Draft, etc.)
    const productsRes = await client.query(
      `UPDATE products
       SET lifecycle_state = 'Legacy'
       WHERE campaign_id = ANY($1::uuid[])
         AND (lifecycle_state = 'Published' OR lifecycle_state IS NULL)
       RETURNING id`,
      [expiredIds]
    );

    await client.query('COMMIT');

    const result = {
      expiredCount: expired.length,
      updatedProducts: productsRes.rowCount,
      expiredEvents: expired.map(s => s.name),
    };

    console.log(`[EventService] ✅ ${result.expiredCount} evento(s) expirado(s). ${result.updatedProducts} producto(s) marcados como 'Legacy'.`);
    console.log(`[EventService] Eventos: ${result.expiredEvents.join(', ')}`);

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[EventService] ❌ Error en expireEvents:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Obtiene estadísticas del estado actual de los eventos.
 */
export async function getEventStats() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_active = true) AS active_count,
        COUNT(*) FILTER (WHERE is_active = false) AS inactive_count,
        COUNT(*) FILTER (WHERE end_date < NOW() AND is_active = true) AS expiring_soon
      FROM campaigns
    `);
    return result.rows[0];
  } catch (error) {
    console.error('[EventService] Error en getEventStats:', error);
    throw error;
  }
}
