/**
 * @file authRoutes.js
 * @description Definición de rutas para el módulo de autenticación y gestión de usuarios.
 * Incluye protección de rutas mediante JWT y validación de roles.
 */
import express from 'express';
import { register, login, getMe, promoteUser, updateMe, createResetLink, resetPassword } from '../controllers/authController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/promote', protect, checkRole('admin'), promoteUser);
router.post('/reset-link', protect, checkRole('admin'), createResetLink);
router.post('/reset-password', resetPassword);

export default router;