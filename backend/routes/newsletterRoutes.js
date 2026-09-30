import express from 'express';
import pool from '../src/config/db.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  // Campo trampa invisible en el formulario: si viene lleno, es un bot
  if (req.body?.website) {
    return res.json({ message: 'Suscripción exitosa', alreadySubscribed: false });
  }

  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
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
