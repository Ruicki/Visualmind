import express from 'express';
import { createOrder, getMyOrders, getAllOrders, getPricing, updateOrderStatus, getOrderEvents } from '../controllers/orderController.js';
import rateLimit from 'express-rate-limit';
import { protect, optionalAuth, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/pricing', getPricing);
// Compra como invitado: límite por IP (los clientes con sesión tienen su propio tope de pendientes)
const guestOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Hiciste varios pedidos seguidos. Escríbenos por WhatsApp si necesitas ayuda.' },
  skip: (req) => !!req.user || process.env.NODE_ENV !== 'production'
});

router.post('/', optionalAuth, guestOrderLimiter, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/all', protect, checkRole('admin'), getAllOrders);
router.get('/:id/events', protect, checkRole('admin'), getOrderEvents);
router.put('/:id/status', protect, checkRole('admin'), updateOrderStatus);

export default router;
