/**
 * @file authController.js
 * @description Controlador para la gestión de autenticación y usuarios.
 * Implementa flujos de login, registro, gestión de perfil y seguridad mediante JWT.
 */

import pool from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * login
 * @description Autentica a un usuario verificando sus credenciales.
 * Genera un token JWT de 24 horas si la validación es exitosa.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Firma del token con payload mínimo (seguridad)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  const { email, password, role = 'customer' } = req.body;

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hashing con salt (factor de trabajo 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, hashedPassword, req.body.full_name || null, role]
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (error) {
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
  const { full_name, email } = req.body;
  const userId = req.user.id;
  try {
    if (email) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'El email ya está en uso' });
      }
    }
    const result = await pool.query(
      'UPDATE users SET full_name=$1, email=$2 WHERE id=$3 RETURNING id, email, full_name, role',
      [full_name, email, userId]
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
  const { email } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role',
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