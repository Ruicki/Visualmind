import pool from '../src/config/db.js';
import { expireEvents } from '../services/eventService.js';

const parseSecondaryImages = (secondary_images) => {
    if (!secondary_images) return [];
    try {
        return typeof secondary_images === 'string'
            ? (secondary_images.trim() === '' ? [] : JSON.parse(secondary_images))
            : secondary_images;
    } catch { return []; }
};

const extractFilePaths = (req) => {
    const bannerFile = req.files?.image?.[0];
    const bannerPath = bannerFile
        ? `uploads/campaigns/${bannerFile.filename}`
        : req.body.banner_url;

    const uploadedSecondary = [];
    for (let i = 0; i < 3; i++) {
        const f = req.files?.[`secondary_image_${i}`]?.[0];
        if (f) uploadedSecondary[i] = `uploads/campaigns/${f.filename}`;
    }
    return { bannerPath, uploadedSecondary };
};

const buildSecondaryImages = (existing, uploaded) => {
    const base = existing.map((url, i) => uploaded[i] || url);
    const extra = uploaded.slice(existing.length).filter(Boolean);
    return [...base, ...extra];
};

export const getAllCampaigns = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *, COALESCE(type, 'campaign') as type,
                   COALESCE(secondary_images, '[]'::jsonb) as secondary_images
            FROM campaigns
            ORDER BY COALESCE(start_date, '1970-01-01') DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ ERROR en getAllCampaigns:', error.message);
        res.status(500).json({ error: 'Error al obtener eventos del servidor', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
};

export const getActiveCampaign = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *, COALESCE(type, 'campaign') as type,
                   COALESCE(secondary_images, '[]'::jsonb) as secondary_images
            FROM campaigns
            WHERE is_active = true
              AND (start_date IS NULL OR start_date <= NOW())
              AND (end_date IS NULL OR end_date >= NOW())
            ORDER BY start_date DESC
            LIMIT 1
        `);
        res.json(result.rows[0] || null);
    } catch (error) {
        console.error('❌ ERROR en getActiveCampaign:', error.message);
        res.status(500).json({ error: 'Error al obtener campaña activa' });
    }
};

export const getActiveAllCampaigns = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *, COALESCE(type, 'campaign') as type,
                   COALESCE(secondary_images, '[]'::jsonb) as secondary_images,
                   CASE
                       WHEN end_date < NOW() THEN 'expired'
                       WHEN start_date > NOW() THEN 'upcoming'
                       ELSE 'active'
                   END as phase
            FROM campaigns
            WHERE is_active = true
              AND (end_date IS NULL OR end_date >= NOW())
            ORDER BY CASE
                       WHEN start_date > NOW() THEN 0
                       WHEN COALESCE(type,'campaign') = 'campaign' THEN 1
                       ELSE 2
                     END,
                     start_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en getActiveAllCampaigns:', error.message);
        res.status(500).json({ error: 'Error al obtener eventos activos' });
    }
};

export const getUpcomingCampaigns = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *, COALESCE(type, 'campaign') as type,
                   COALESCE(secondary_images, '[]'::jsonb) as secondary_images
            FROM campaigns
            WHERE start_date > NOW()
            ORDER BY start_date ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en getUpcomingCampaigns:', error.message);
        res.status(500).json({ error: 'Error al obtener eventos próximos' });
    }
};

export const createCampaign = async (req, res) => {
    if (!req.body) return res.status(400).json({ error: 'No se recibieron datos en la petición.' });

    const { name, slug, description, banner_url, accent_color, template_type, start_date, end_date, is_active, countdown_enabled, type, button_text, button_link, secondary_images } = req.body;
    const { bannerPath, uploadedSecondary } = extractFilePaths(req);
    const parsedExisting = parseSecondaryImages(secondary_images);
    const nSecondaryImages = buildSecondaryImages(parsedExisting, uploadedSecondary);

    const nStartDate = (!start_date || start_date === '' || start_date === 'null') ? null : start_date;
    const nEndDate = (!end_date || end_date === '' || end_date === 'null') ? null : end_date;
    const nType = type && type !== '' ? type : 'campaign';
    const isActiveBool = is_active === 'true' || is_active === true;
    const countdownBool = countdown_enabled === 'true' || countdown_enabled === true;

    try {
        const result = await pool.query(
            `INSERT INTO campaigns (name, slug, description, banner_url, accent_color, template_type, start_date, end_date, is_active, countdown_enabled, type, button_text, button_link, secondary_images)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
            [name, slug, description, bannerPath, accent_color, template_type, nStartDate, nEndDate, isActiveBool, countdownBool, nType, button_text, button_link, JSON.stringify(nSecondaryImages)]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear campaña:', error);
        if (error.code === '23505') return res.status(400).json({ error: 'Ya existe un evento con ese nombre o URL.' });
        res.status(500).json({ error: 'Error al crear la campaña', details: error.message });
    }
};

export const updateCampaign = async (req, res) => {
    const { id } = req.params;
    if (!req.body) return res.status(400).json({ error: 'No se recibieron datos para actualizar.' });

    const { name, slug, description, banner_url, accent_color, template_type, start_date, end_date, is_active, countdown_enabled, type, button_text, button_link, secondary_images } = req.body;

    let { bannerPath, uploadedSecondary } = extractFilePaths(req);
    // Normalize legacy paths missing the campaigns subfolder
    if (bannerPath && bannerPath.startsWith('uploads/image-')) {
        bannerPath = bannerPath.replace('uploads/', 'uploads/campaigns/');
    }

    const parsedExisting = parseSecondaryImages(secondary_images);
    const nSecondaryImages = buildSecondaryImages(parsedExisting, uploadedSecondary);

    const nStartDate = (!start_date || start_date === '' || start_date === 'null') ? null : start_date;
    const nEndDate = (!end_date || end_date === '' || end_date === 'null') ? null : end_date;
    const nType = type && type !== '' ? type : 'campaign';
    const isActiveBool = is_active === 'true' || is_active === true;
    const countdownBool = countdown_enabled === 'true' || countdown_enabled === true;

    try {
        const result = await pool.query(
            `UPDATE campaigns
             SET name=$1, slug=$2, description=$3, banner_url=$4, accent_color=$5,
                 template_type=$6, start_date=$7, end_date=$8, is_active=$9,
                 countdown_enabled=$10, type=$11, button_text=$12, button_link=$13,
                 secondary_images=$14, updated_at=NOW()
             WHERE id=$15 RETURNING *`,
            [name, slug, description, bannerPath, accent_color, template_type, nStartDate, nEndDate, isActiveBool, countdownBool, nType, button_text, button_link, JSON.stringify(nSecondaryImages), id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar campaña:', error);
        res.status(500).json({ error: 'Error al actualizar la campaña', details: error.message });
    }
};

export const deleteCampaign = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM campaigns WHERE id = $1', [id]);
        res.json({ message: 'Campaña eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar campaña:', error);
        res.status(500).json({ error: 'Error al eliminar la campaña', details: error.message });
    }
};

export const expireCampaigns = async (req, res) => {
    try {
        const result = await expireEvents();
        res.json(result);
    } catch (error) {
        console.error('Error al expirar campañas:', error);
        res.status(500).json({ error: 'Error al ejecutar la expiración' });
    }
};
