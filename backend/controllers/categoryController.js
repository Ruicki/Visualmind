import pool from '../src/config/db.js';

/**
 * @file categoryController.js
 * @description Controlador para la gestión de categorías de productos.
 */

/**
 * Obtiene todas las categorías de la base de datos.
 */
export const getAllCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * Crea una nueva categoría.
 */
export const createCategory = async (req, res) => {
    const { name, slug, icon, description } = req.body;
    
    if (!name || !slug) {
        return res.status(400).json({ error: 'El nombre y el slug son obligatorios.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO categories (name, slug, icon, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, slug, icon || '🏷️', description || '']
        );
        res.status(210).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El slug ya está en uso.' });
        }
        console.error('Error al crear categoría:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * Actualiza una categoría existente.
 */
export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, slug, icon, description } = req.body;

    try {
        const result = await pool.query(
            'UPDATE categories SET name = $1, slug = $2, icon = $3, description = $4 WHERE id = $5 RETURNING *',
            [name, slug, icon, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El slug ya está en uso.' });
        }
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * Elimina una categoría.
 */
export const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si hay productos usando esta categoría
        const catCheck = await pool.query('SELECT slug FROM categories WHERE id = $1', [id]);
        if (catCheck.rows.length > 0) {
            const slug = catCheck.rows[0].slug;
            const productCheck = await pool.query('SELECT id FROM products WHERE category = $1 LIMIT 1', [slug]);
            if (productCheck.rows.length > 0) {
                return res.status(400).json({ error: 'No se puede eliminar una categoría que tiene productos asociados.' });
            }
        }

        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }

        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};
