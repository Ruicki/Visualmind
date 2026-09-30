/**
 * @file authMiddleware.js
 * @description Middlewares de seguridad para Express.
 * Maneja la validación de tokens JWT y el control de acceso basado en roles.
 */

import jwt from 'jsonwebtoken';
import pool from '../src/config/db.js';

/**
 * protect
 * @description Middleware para asegurar que una ruta requiere autenticación.
 * Verifica el token JWT (Bearer) y confirma en la BD que el usuario sigue existiendo.
 * El rol se toma de la BD, no del token: quitar el rol de admin o borrar la cuenta
 * surte efecto de inmediato. `token_version` permite invalidar sesiones ya emitidas.
 * @param {Object} req - Request de Express.
 * @param {Object} res - Response de Express.
 * @param {Function} next - Siguiente middleware.
 */
export const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no hay token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ message: 'No autorizado, token fallido' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, role, token_version FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = rows[0];
    if (!user || (user.token_version ?? 0) !== (decoded.tv ?? 0)) {
      return res.status(401).json({ message: 'Tu sesión expiró. Inicia sesión de nuevo.' });
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * checkRole
 * @description Genera un middleware para validar que el usuario autenticado tiene un rol específico.
 * @param {string} role - Rol requerido (ej: 'admin').
 * @returns {Function} Middleware de Express.
 */
export const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: 'Acceso denegado: permisos insuficientes' });
    }
  };
};

// Aliases para compatibilidad con el resto de la aplicación
export const verifyToken = protect;
export const isAdmin = checkRole('admin');
