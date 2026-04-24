import express from 'express';
import { 
    getAllCampaigns, getActiveCampaign, createCampaign, 
    updateCampaign, deleteCampaign 
} from '../controllers/campaignController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllCampaigns);
router.get('/active', getActiveCampaign);

// Rutas protegidas (Admin)
router.post('/', protect, checkRole('admin'), upload.single('image'), createCampaign);
router.put('/:id', protect, checkRole('admin'), upload.single('image'), updateCampaign);
router.delete('/:id', protect, checkRole('admin'), deleteCampaign);

export default router;
