import pool from '../src/config/db.js';

/**
 * @function getAddresses
 * @description Recupera todas las direcciones de envío asociadas al usuario autenticado.
 * Filtra los resultados por el user_id obtenido del token JWT decodificado en req.user.
 * 
 * @param {Object} req - Express request object (con req.user inyectado por el middleware de auth).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con el listado de direcciones del usuario.
 */
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

/**
 * @function createAddress
 * @description Registra una nueva dirección de envío para el usuario actual.
 * Establece 'Panama' como país por defecto si no se proporciona uno.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con la dirección creada.
 */
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

/**
 * @function updateAddress
 * @description Actualiza una dirección específica.
 * Incluye una validación de seguridad crítica: Verifica que la dirección pertenezca al usuario autenticado antes de proceder.
 * 
 * @param {Object} req - Express request object (req.params.id, req.user.id).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con la dirección actualizada.
 */
export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { full_name, address_line, city, province, postal_code, country } = req.body;
  try {
    // 1. Verificación de existencia y propiedad
    const check = await pool.query('SELECT user_id FROM shipping_addresses WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Dirección no encontrada' });
    
    // Seguridad: Prevenir manipulación de datos de otros usuarios (IDOR protection)
    if (check.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta dirección' });
    }

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

/**
 * @function deleteAddress
 * @description Elimina una dirección de envío.
 * Valida que la dirección pertenezca al usuario que solicita la eliminación.
 * 
 * @param {Object} req - Express request object (req.params.id, req.user.id).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Mensaje de éxito.
 */
export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT user_id FROM shipping_addresses WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Dirección no encontrada' });
    
    // Seguridad: Prevenir eliminación de datos ajenos
    if (check.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta dirección' });
    }

    await pool.query('DELETE FROM shipping_addresses WHERE id = $1', [id]);
    res.json({ message: 'Dirección eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
