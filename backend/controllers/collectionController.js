import pool from '../src/config/db.js';

/**
 * @function getAllCollections
 * @description Obtiene el listado de todas las colecciones disponibles.
 * Utilizado para la navegación y filtros por colección en el frontend.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con el listado de colecciones.
 */
export const getAllCollections = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM collections ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener colecciones:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * @function createCollection
 * @description Crea una nueva colección temática de productos.
 * Soporta la carga de una imagen representativa para la colección.
 * 
 * @param {Object} req - Express request object (req.body, req.files para imagen).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con la colección creada.
 */
export const createCollection = async (req, res) => {
  if (!req.body) {
    console.error('ERROR: req.body is undefined in createCollection');
    return res.status(400).json({ error: 'No se recibieron datos en la petición.' });
  }

  const { name, slug, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nombre de la colección es obligatorio.' });
  }

  // Normalización de tipos para el booleano is_active (FormData envía strings)
  const is_active = req.body.is_active === 'true' || req.body.is_active === true;
  
  // Gestión de ruta de imagen: prioriza archivo subido sobre URL manual
  const image_url = req.files?.['image'] ? `/uploads/collections/${req.files['image'][0].filename}` : req.body.image_url;

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

/**
 * @function updateCollection
 * @description Modifica una colección existente.
 * Permite actualizar el nombre, slug, descripción, imagen y estado de activación.
 * 
 * @param {Object} req - Express request object (req.params.id, req.body).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con la colección actualizada.
 */
export const updateCollection = async (req, res) => {
  const { id } = req.params;
  
  if (!req.body) {
    return res.status(400).json({ error: 'No se recibieron datos para actualizar.' });
  }

  const { name, slug, description } = req.body;
  const is_active = req.body.is_active === 'true' || req.body.is_active === true;
  const image_url = req.files?.['image'] ? `/uploads/collections/${req.files['image'][0].filename}` : req.body.image_url;

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

/**
 * @function deleteCollection
 * @description Elimina una colección por su ID.
 * 
 * @param {Object} req - Express request object (req.params.id).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Mensaje de confirmación.
 */
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
