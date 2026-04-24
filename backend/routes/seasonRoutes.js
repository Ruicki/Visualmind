import express from 'express';
const router = express.Router();
import * as seasonController from '../controllers/seasonController.js';

router.get('/', seasonController.getAllSeasons);
router.get('/active', seasonController.getActiveSeason);
router.post('/', seasonController.createSeason);
router.put('/:id', seasonController.updateSeason);
router.delete('/:id', seasonController.deleteSeason);

export default router;
