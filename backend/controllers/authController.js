/**
 * @file authController.js
 * @description Controlador para la gestión de autenticación y usuarios.
 * Implementa flujos de login, registro, gestión de perfil y seguridad mediante JWT.
 */

import pool from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Hash de relleno: el login tarda lo mismo exista o no el email
const DUMMY_HASH = bcrypt.hashSync('visualmind-dummy-password', 10);

/** Normaliza un email para comparar y guardar siempre igual. */
export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

/** Devuelve un mensaje de error si la contraseña no cumple la política, o null. */
export const passwordProblem = (password) => {
  const p = String(password ?? '');
  if (p.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (p.length > 128) return 'La contraseña es demasiado larga';
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'La contraseña debe incluir letras y números';
  return null;
};

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, tv: user.token_version ?? 0 },
  process.env.JWT_SECRET,
  { expiresIn: '24h', algorithm: 'HS256' }
);

/**
 * login
 * @description Autentica a un usuario verificando sus credenciales.
 * Genera un token JWT de 24 horas si la validación es exitosa.
 */
export const login = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);

    if (!user || !isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Firma del token con payload mínimo (seguridad)
    const token = signToken(user);

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * register
 * @description Crea una nueva cuenta de usuario.
 * Aplica hashing a la contraseña antes de la persistencia.
 */
export const register = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  const fullName = req.body?.full_name ? String(req.body.full_name).trim().slice(0, 255) : null;
  // El rol nunca se acepta desde el cliente: todo registro público es 'customer'.
  // Los administradores se crean con /api/auth/promote (solo admin) o con ADMIN_EMAIL/ADMIN_PASSWORD.
  const role = 'customer';

  if (!EMAIL_RE.test(email) || email.length > 255) {
    return res.status(400).json({ message: 'Escribe un email válido' });
  }
  const problem = passwordProblem(password);
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  try {
    const userExists = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hashing con salt (factor de trabajo 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, token_version',
      [email, hashedPassword, fullName, role]
    );

    const { token_version, ...user } = newUser.rows[0];
    const token = signToken({ ...user, token_version });

    res.status(201).json({ token, user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * getMe
 * @description Recupera la información del usuario autenticado actual.
 * El ID se extrae del middleware de protección previa.
 */
export const getMe = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * updateMe
 * @description Actualiza los datos personales del usuario.
 * Valida que el nuevo email (si se cambia) no esté en uso.
 */
export const updateMe = async (req, res) => {
  const userId = req.user.id;
  const fullName = req.body?.full_name != null ? String(req.body.full_name).trim().slice(0, 255) : null;
  const email = req.body?.email != null && String(req.body.email).trim() !== '' ? normalizeEmail(req.body.email) : null;

  if (email && (!EMAIL_RE.test(email) || email.length > 255)) {
    return res.status(400).json({ message: 'Escribe un email válido' });
  }

  try {
    if (email) {
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2', [email, userId]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'El email ya está en uso' });
      }
    }
    // Solo se cambian los campos enviados; los demás se conservan
    const result = await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, email, full_name, role',
      [fullName, email, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * promoteUser
 * @description (Admin Only) Eleva los privilegios de un usuario a 'admin'.
 * Se identifica por email.
 */
export const promoteUser = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE LOWER(email) = $2 RETURNING id, email, role',
      ['admin', email]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario promovido a admin', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};