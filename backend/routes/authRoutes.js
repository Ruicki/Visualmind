import express from 'express';
import { register, login, getMe, promoteUser, updateMe } from '../controllers/authController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/promote', protect, checkRole('admin'), promoteUser);

export default router;