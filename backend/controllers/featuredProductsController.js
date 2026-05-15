/**
 * @file featuredProductsController.js
 * @description Controlador para la gestión de productos destacados en la home.
 * Soporta slots configurables con fallback automático a productos por prioridad.
 */

import pool from '../src/config/db.js';

/**
 * @function getFeaturedProducts
 * @description Obtiene los productos destacados para mostrar en la home.
 * Primero intenta obtener los slots configurados con productos válidos.
 * Si no hay slots configurados, hace fallback a los productos con mayor priority.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con el array de productos destacados.
 */
export const getFeaturedProducts = async (req, res) => {
    const { campaign_id } = req.query;
    try {
        const slotsResult = await pool.query(`
            SELECT fps.slot_order, fps.rotation, fps.product_id,
                   p.id, p.title, p.price, p.image_url, p.hover_image_url,
                   p.discount, p.stock, p.lifecycle_state
            FROM featured_product_slots fps
            LEFT JOIN products p ON fps.product_id = p.id
                AND p.stock > 0
                AND COALESCE(p.lifecycle_state, 'Published') = 'Published'
            WHERE ($1::uuid IS NOT NULL AND fps.campaign_id = $1::uuid)
               OR ($1::uuid IS NULL AND fps.campaign_id IS NULL)
            ORDER BY fps.slot_order ASC
        `, [campaign_id || null]);

        const validSlots = slotsResult.rows.filter(r => r.id !== null);

        if (validSlots.length > 0) {
            return res.json(validSlots);
        }

        const limit = campaign_id ? 5 : 8;
        const fallback = await pool.query(`
            SELECT id, title, price, image_url, hover_image_url, discount, stock, priority
            FROM products
            WHERE stock > 0 AND COALESCE(lifecycle_state, 'Published') = 'Published'
            ORDER BY priority DESC, created_at DESC
            LIMIT $1
        `, [limit]);
        res.json(fallback.rows);
    } catch (error) {
        console.error('Error en getFeaturedProducts:', error.message);
        res.status(500).json({ error: 'Error al obtener productos destacados' });
    }
};

/**
 * @function updateFeaturedSlots
 * @description Actualiza (upsert) los slots de productos destacados.
 * Requiere autenticación de administrador.
 *
 * @param {Object} req - Express request object. Body: { slots: Array, rotation: string }
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con mensaje de confirmación.
 */
export const updateFeaturedSlots = async (req, res) => {
    const { slots, rotation, campaign_id } = req.body;
    if (!Array.isArray(slots)) {
        return res.status(400).json({ error: 'slots debe ser un array' });
    }
    try {
        // Limpiar slots existentes para esta campaña (o globales)
        if (campaign_id) {
            await pool.query('DELETE FROM featured_product_slots WHERE campaign_id = $1', [campaign_id]);
        } else {
            await pool.query('DELETE FROM featured_product_slots WHERE campaign_id IS NULL');
        }

        // Insertar cada slot
        for (const slot of slots) {
            if (!slot.product_id) continue;
            await pool.query(`
                INSERT INTO featured_product_slots (slot_order, product_id, rotation, campaign_id, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [slot.slot_order, slot.product_id, rotation || 'weekly', campaign_id || null]);
        }
        res.json({ message: 'Slots actualizados correctamente' });
    } catch (error) {
        console.error('Error en updateFeaturedSlots:', error.message);
        res.status(500).json({ error: 'Error al actualizar slots', details: error.message });
    }
};
