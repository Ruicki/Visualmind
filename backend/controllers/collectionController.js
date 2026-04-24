import pool from '../src/config/db.js';

// Obtener todas las colecciones
export const getAllCollections = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM collections ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener colecciones:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear colección
export const createCollection = async (req, res) => {
  const { name, slug, description, image_url, is_active } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO collections (name, slug, description, image_url, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, slug, description, image_url, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear colección:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Actualizar colección
export const updateCollection = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, image_url, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE collections SET name = $1, slug = $2, description = $3, image_url = $4, is_active = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [name, slug, description, image_url, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar colección:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Eliminar colección
export const deleteCollection = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM collections WHERE id = $1', [id]);
    res.json({ message: 'Colección eliminada' });
  } catch (error) {
    console.error('Error al eliminar colección:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
