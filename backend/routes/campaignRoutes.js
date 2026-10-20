import express from 'express';
import { 
    getAllCampaigns, getPublicCampaigns, getActiveCampaign, getActiveAllCampaigns, getUpcomingCampaigns,
    createCampaign, updateCampaign, deleteCampaign, expireCampaigns
} from '../controllers/campaignController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Rutas públicas
router.get('/', getPublicCampaigns);
router.get('/admin', protect, checkRole('admin'), getAllCampaigns);
router.get('/active', getActiveCampaign);
router.get('/active-all', getActiveAllCampaigns);
router.get('/upcoming', getUpcomingCampaigns);

// Rutas protegidas (Admin)
router.post('/expire', protect, checkRole('admin'), expireCampaigns);
router.post('/', protect, checkRole('admin'), upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'secondary_image_0', maxCount: 1 },
    { name: 'secondary_image_1', maxCount: 1 },
    { name: 'secondary_image_2', maxCount: 1 },
]), createCampaign);
router.put('/:id', protect, checkRole('admin'), upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'secondary_image_0', maxCount: 1 },
    { name: 'secondary_image_1', maxCount: 1 },
    { name: 'secondary_image_2', maxCount: 1 },
]), updateCampaign);
router.delete('/:id', protect, checkRole('admin'), deleteCampaign);

export default router;
