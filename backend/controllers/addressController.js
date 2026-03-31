import pool from '../src/config/db.js';

export const getAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shipping_addresses WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const createAddress = async (req, res) => {
  const { full_name, address_line, city, province, postal_code, country } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO shipping_addresses (user_id, full_name, address_line, city, province, postal_code, country) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.id, full_name, address_line, city, province, postal_code, country || 'Panama']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { full_name, address_line, city, province, postal_code, country } = req.body;
  try {
    const check = await pool.query('SELECT user_id FROM shipping_addresses WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Dirección no encontrada' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'No tienes permiso para modificar esta dirección' });
    const result = await pool.query(
      'UPDATE shipping_addresses SET full_name=$1, address_line=$2, city=$3, province=$4, postal_code=$5, country=$6 WHERE id=$7 RETURNING *',
      [full_name, address_line, city, province, postal_code, country, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT user_id FROM shipping_addresses WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Dirección no encontrada' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'No tienes permiso para modificar esta dirección' });
    await pool.query('DELETE FROM shipping_addresses WHERE id = $1', [id]);
    res.json({ message: 'Dirección eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
