import express from 'express';
import * as productController from '../controllers/productController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/admin', productController.getAdminProducts);
router.get('/categories', productController.getCategories);
router.get('/sub-categories', productController.getSubcategories);
router.get('/:id', productController.getProductById);
router.post('/', protect, checkRole('admin'), upload.single('image'), productController.createProduct);
router.put('/:id', protect, checkRole('admin'), upload.single('image'), productController.updateProduct);
router.delete('/:id', protect, checkRole('admin'), productController.deleteProduct);

export default router;
