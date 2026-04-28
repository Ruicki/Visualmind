/**
 * @file authMiddleware.js
 * @description Middlewares de seguridad para Express.
 * Maneja la validación de tokens JWT y el control de acceso basado en roles.
 */

import jwt from 'jsonwebtoken';

/**
 * protect
 * @description Middleware para asegurar que una ruta requiere autenticación.
 * Extrae el token del header Authorization (Bearer), lo verifica y adjunta el payload a `req.user`.
 * @param {Object} req - Request de Express.
 * @param {Object} res - Response de Express.
 * @param {Function} next - Siguiente middleware.
 */
export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'No autorizado, token fallido' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no hay token' });
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
