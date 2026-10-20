import express from 'express';
import { getDashboardStats, exportSalesCsv, exportNewsletterCsv } from '../controllers/adminController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, checkRole('admin'), getDashboardStats);
router.get('/reports/sales.csv', protect, checkRole('admin'), exportSalesCsv);
router.get('/reports/newsletter.csv', protect, checkRole('admin'), exportNewsletterCsv);

export default router;
