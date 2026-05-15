import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, checkRole('admin'), getDashboardStats);

export default router;
