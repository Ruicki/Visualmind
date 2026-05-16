import express from 'express';
import * as collectionController from '../controllers/collectionController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', collectionController.getAllCollections);
router.get('/by-campaign/:campaignId', collectionController.getCollectionsByCampaign);
router.get('/:slug/products', collectionController.getCollectionProducts);
router.get('/:slug', collectionController.getCollectionBySlug);
router.post('/', protect, checkRole('admin'), upload.fields([{ name: 'image', maxCount: 1 }]), collectionController.createCollection);
router.put('/:id', protect, checkRole('admin'), upload.fields([{ name: 'image', maxCount: 1 }]), collectionController.updateCollection);
router.delete('/:id', protect, checkRole('admin'), collectionController.deleteCollection);

export default router;
