import pool from '../src/config/db.js';

/**
 * Servicio de gestión del ciclo de vida de temporadas.
 *
 * Responsable de:
 * 1. Desactivar temporadas cuya `end_date` ya pasó.
 * 2. Marcar productos de temporadas expiradas como 'legacy' para incentivar su venta.
 *
 * Se puede invocar al iniciar el servidor o programar con un cron job.
 */

/**
 * Expira temporadas cuya fecha de fin ya pasó y actualiza el estado
 * de sus productos asociados a 'legacy'.
 * @returns {{ expiredCount: number, updatedProducts: number }}
 */
export async function expireSeasons() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener temporadas activas que ya expiraron
    const expiredRes = await client.query(`
      SELECT id, name, end_date
      FROM seasons
      WHERE is_active = true
        AND end_date IS NOT NULL
        AND end_date < NOW()
    `);

    const expired = expiredRes.rows;

    if (expired.length === 0) {
      await client.query('COMMIT');
      return { expiredCount: 0, updatedProducts: 0 };
    }

    // 2. Desactivar cada temporada expirada
    const expiredIds = expired.map(s => s.id);
    await client.query(
      `UPDATE seasons SET is_active = false, updated_at = NOW() WHERE id = ANY($1::uuid[])`,
      [expiredIds]
    );

    // 3. Marcar los productos asociados como 'legacy'
    // Solo si aún están en estado 'published' para no sobreescribir
    // otros estados intencionales (archived, draft, etc.)
    const productsRes = await client.query(
      `UPDATE products
       SET lifecycle_status = 'legacy', updated_at = NOW()
       WHERE season_id = ANY($1::uuid[])
         AND (lifecycle_status = 'published' OR lifecycle_status IS NULL)
       RETURNING id`,
      [expiredIds]
    );

    await client.query('COMMIT');

    const result = {
      expiredCount: expired.length,
      updatedProducts: productsRes.rowCount,
      expiredSeasons: expired.map(s => s.name),
    };

    console.log(`[SeasonService] ✅ ${result.expiredCount} temporada(s) expirada(s). ${result.updatedProducts} producto(s) marcados como 'legacy'.`);
    console.log(`[SeasonService] Temporadas: ${result.expiredSeasons.join(', ')}`);

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SeasonService] ❌ Error en expireSeasons:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Obtiene estadísticas del estado actual de las temporadas.
 */
export async function getSeasonStats() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_active = true) AS active_count,
        COUNT(*) FILTER (WHERE is_active = false) AS inactive_count,
        COUNT(*) FILTER (WHERE end_date < NOW() AND is_active = true) AS expiring_soon
      FROM seasons
    `);
    return result.rows[0];
  } catch (error) {
    console.error('[SeasonService] Error en getSeasonStats:', error);
    throw error;
  }
}
