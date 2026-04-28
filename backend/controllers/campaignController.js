import pool from '../src/config/db.js';

/**
 * @function getAllCampaigns
 * @description Obtiene todas las campañas registradas en la base de datos.
 * Las campañas se devuelven ordenadas cronológicamente por fecha de inicio (más recientes primero).
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con el array de todas las campañas.
 */
export const getAllCampaigns = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM campaigns ORDER BY start_date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener campañas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * @function getActiveCampaign
 * @description Recupera la campaña actualmente activa para mostrarla en el frontend (Home/Header).
 * Una campaña se considera activa si:
 * 1. is_active es true.
 * 2. La fecha actual está dentro del rango [start_date, end_date] (o son nulas).
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con el objeto de la campaña activa o null.
 */
export const getActiveCampaign = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM campaigns WHERE is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()) ORDER BY created_at DESC LIMIT 1'
        );
        res.json(result.rows[0] || null);
    } catch (error) {
        console.error('Error al obtener campaña activa:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * @function createCampaign
 * @description Crea una nueva campaña publicitaria/estacional.
 * Maneja la subida de imagen de banner mediante Multer si se proporciona un archivo.
 * 
 * @param {Object} req - Express request object (contiene req.body y opcionalmente req.file).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con la campaña creada.
 */
export const createCampaign = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: 'No se recibieron datos en la petición.' });
    }

    const { 
        name, slug, description, banner_url, accent_color, 
        template_type, start_date, end_date, is_active, countdown_enabled 
    } = req.body;
    
    // Prioriza el archivo subido sobre la URL de banner manual
    const bannerPath = req.file ? `uploads/${req.file.filename}` : banner_url;
    
    try {
        const result = await pool.query(
            `INSERT INTO campaigns 
            (name, slug, description, banner_url, accent_color, template_type, start_date, end_date, is_active, countdown_enabled) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`,
            [name, slug, description, bannerPath, accent_color, template_type, start_date, end_date, is_active, countdown_enabled]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear campaña:', error);
        res.status(500).json({ error: 'Error al crear la campaña' });
    }
};

/**
 * @function updateCampaign
 * @description Actualiza los datos de una campaña existente por su ID.
 * Permite actualizar el banner (archivo nuevo) y el estado de activación.
 * 
 * @param {Object} req - Express request object (req.params.id).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON con la campaña actualizada.
 */
export const updateCampaign = async (req, res) => {
    const { id } = req.params;

    if (!req.body) {
        return res.status(400).json({ error: 'No se recibieron datos para actualizar.' });
    }

    const { 
        name, slug, description, banner_url, accent_color, 
        template_type, start_date, end_date, is_active, countdown_enabled 
    } = req.body;
    
    const bannerPath = req.file ? `uploads/${req.file.filename}` : banner_url;
    
    try {
        const result = await pool.query(
            `UPDATE campaigns 
            SET name = $1, slug = $2, description = $3, banner_url = $4, accent_color = $5, 
                template_type = $6, start_date = $7, end_date = $8, is_active = $9, 
                countdown_enabled = $10, updated_at = NOW() 
            WHERE id = $11 
            RETURNING *`,
            [name, slug, description, bannerPath, accent_color, template_type, start_date, end_date, is_active, countdown_enabled, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar campaña:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * @function deleteCampaign
 * @description Elimina físicamente una campaña de la base de datos.
 * Nota: No elimina automáticamente el archivo del banner del servidor (pendiente de optimización).
 * 
 * @param {Object} req - Express request object (req.params.id).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Mensaje de confirmación.
 */
export const deleteCampaign = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM campaigns WHERE id = $1', [id]);
        res.json({ message: 'Campaña eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar campaña:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};
