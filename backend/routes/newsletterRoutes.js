import express from 'express';
import pool from '../src/config/db.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await pool.query(
      'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );

    if (result.rowCount === 0) {
      return res.json({ message: 'Ya estabas suscrito', alreadySubscribed: true });
    }

    res.json({ message: 'Suscripción exitosa', alreadySubscribed: false });
  } catch (error) {
    console.error('[Newsletter] Error:', error.message);
    res.status(500).json({ error: 'Error al suscribir' });
  }
});

export default router;
