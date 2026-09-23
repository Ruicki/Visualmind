import express from 'express';
import { createOrder, getMyOrders, getAllOrders, getPricing, updateOrderStatus } from '../controllers/orderController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/pricing', getPricing);
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/all', protect, checkRole('admin'), getAllOrders);
router.put('/:id/status', protect, checkRole('admin'), updateOrderStatus);

export default router;
