import pool from '../src/config/db.js';

// Obtener todas las temporadas
export const getAllSeasons = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seasons ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener temporadas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Obtener temporada activa
export const getActiveSeason = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seasons WHERE is_active = true LIMIT 1');
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error al obtener temporada activa:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Crear temporada
export const createSeason = async (req, res) => {
  const { name, slug, description, start_date, end_date, is_active } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO seasons (name, slug, description, start_date, end_date, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, slug, description, start_date, end_date, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear temporada:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Actualizar temporada
export const updateSeason = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, start_date, end_date, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE seasons SET name = $1, slug = $2, description = $3, start_date = $4, end_date = $5, is_active = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [name, slug, description, start_date, end_date, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar temporada:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Eliminar temporada
export const deleteSeason = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM seasons WHERE id = $1', [id]);
    res.json({ message: 'Temporada eliminada' });
  } catch (error) {
    console.error('Error al eliminar temporada:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
