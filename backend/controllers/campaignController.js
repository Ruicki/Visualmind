import pool from '../src/config/db.js';

export const getAllCampaigns = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM campaigns ORDER BY start_date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener campañas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

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

export const createCampaign = async (req, res) => {
    const { 
        name, slug, description, banner_url, accent_color, 
        template_type, start_date, end_date, is_active, countdown_enabled 
    } = req.body;
    
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

export const updateCampaign = async (req, res) => {
    const { id } = req.params;
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
