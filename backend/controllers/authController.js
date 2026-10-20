/**
 * @file authController.js
 * @description Controlador para la gestión de autenticación y usuarios.
 * Implementa flujos de login, registro, gestión de perfil y seguridad mediante JWT.
 */

import pool from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
export const RESET_LINK_HOURS = 24;

/** URL pública de la tienda para armar enlaces (FRONTEND_URL o el primer origen permitido). */
export const frontendUrl = () =>
  (process.env.FRONTEND_URL || (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')[0]).trim().replace(/\/$/, '');

/**
 * createResetLink
 * @description (Admin) Genera un enlace de un solo uso para que un cliente cambie su
 * contraseña. El admin se lo envía por WhatsApp; no hace falta un servicio de correo.
 */
export const createResetLink = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No hay ninguna cuenta con ese email' });
    }
    const token = crypto.randomBytes(32).toString('base64url');
    const expires = await pool.query(
      `INSERT INTO password_resets (token_hash, user_id, expires_at, created_by)
       VALUES ($1, $2, NOW() + make_interval(hours => $3), $4) RETURNING expires_at`,
      [hashToken(token), rows[0].id, RESET_LINK_HOURS, req.user.id]
    );
    res.status(201).json({
      url: `${frontendUrl()}/reset-password?token=${token}`,
      expires_at: expires.rows[0].expires_at
    });
  } catch (error) {
    console.error('Error al crear enlace de recuperación:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * resetPassword
 * @description Cambia la contraseña con un enlace válido. El enlace deja de servir tras
 * usarse, y todas las sesiones abiertas de esa cuenta se cierran.
 */
export const resetPassword = async (req, res) => {
  const token = String(req.body?.token || '');
  const problem = passwordProblem(req.body?.password);
  if (!token) return res.status(400).json({ message: 'El enlace no es válido' });
  if (problem) return res.status(400).json({ message: problem });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT user_id FROM password_resets
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [hashToken(token)]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El enlace venció o ya se usó. Pide uno nuevo por WhatsApp.' });
    }
    const hash = await bcrypt.hash(String(req.body.password), 10);
    await client.query(
      'UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2',
      [hash, rows[0].user_id]
    );
    await client.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [rows[0].user_id]);
    await client.query('COMMIT');
    res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
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