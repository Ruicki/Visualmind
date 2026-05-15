import express from 'express';
import { getFeaturedProducts, updateFeaturedSlots } from '../controllers/featuredProductsController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getFeaturedProducts);
router.put('/slots', protect, checkRole('admin'), updateFeaturedSlots);

export default router;
