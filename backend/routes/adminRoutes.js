import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { expireSeasons, getSeasonStats } from '../services/seasonService.js';

const router = express.Router();

router.get('/stats', protect, checkRole('admin'), getDashboardStats);

// Trigger manual de expiración de temporadas
router.post('/expire-seasons', protect, checkRole('admin'), async (req, res) => {
  try {
    const result = await expireSeasons();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/season-stats', protect, checkRole('admin'), async (req, res) => {
  try {
    const stats = await getSeasonStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
