/**
 * @file productRoutes.js
 * @description Definición de rutas para la gestión de productos.
 * Incluye rutas públicas para la tienda y rutas protegidas para la administración,
 * integrando middlewares de autenticación y carga de archivos.
 */

import express from 'express';
import * as productController from '../controllers/productController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Rutas de Administración (Prioritarias para evitar conflictos con :id)
 */
router.get('/admin', protect, checkRole('admin'), productController.getAdminProducts);

/** 
 * Rutas Públicas
 */
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/sub-categories', productController.getSubcategories);
router.get('/:id', productController.getProductById);


/** Crear nuevo producto con soporte para múltiples imágenes (principal y hover) */
router.post('/', 
  protect, 
  checkRole('admin'), 
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'hover_image', maxCount: 1 }]), 
  productController.createProduct
);

/** Actualizar producto existente y sus variantes */
router.put('/:id', 
  protect, 
  checkRole('admin'), 
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'hover_image', maxCount: 1 }]), 
  productController.updateProduct
);

/** Eliminar producto y sus archivos asociados del servidor */
router.delete('/:id', protect, checkRole('admin'), productController.deleteProduct);

export default router;

