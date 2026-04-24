import express from 'express';
const router = express.Router();
import * as collectionController from '../controllers/collectionController.js';

router.get('/', collectionController.getAllCollections);
router.post('/', collectionController.createCollection);
router.put('/:id', collectionController.updateCollection);
router.delete('/:id', collectionController.deleteCollection);

export default router;
