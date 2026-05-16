import express from 'express';
import {
  getSubcategories,
  getSubcategoryById,
  getSubcategoryProducts,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from '../controllers/subcategoryController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSubcategories);
router.get('/:id/products', getSubcategoryProducts);
router.get('/:id', getSubcategoryById);
// Admin-only mutations
router.post('/', protect, checkRole('admin'), createSubcategory);
router.put('/:id', protect, checkRole('admin'), updateSubcategory);
router.delete('/:id', protect, checkRole('admin'), deleteSubcategory);

export default router;
