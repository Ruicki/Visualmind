import express from 'express';
import { 
    getAllCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} from '../controllers/categoryController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/categories
 * @desc Obtiene todas las categorías (Público)
 */
router.get('/', getAllCategories);

/**
 * @route POST /api/categories
 * @desc Crea una nueva categoría (Admin)
 */
router.post('/', verifyToken, isAdmin, createCategory);

/**
 * @route PUT /api/categories/:id
 * @desc Actualiza una categoría (Admin)
 */
router.put('/:id', verifyToken, isAdmin, updateCategory);

/**
 * @route DELETE /api/categories/:id
 * @desc Elimina una categoría (Admin)
 */
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

export default router;
