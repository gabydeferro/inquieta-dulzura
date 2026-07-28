import { Router } from 'express';
import {
  getRecetas,
  getRecetaById,
  createReceta,
  updateReceta,
  deleteReceta,
  getProductosByReceta,
} from '../controllers/RecetasController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/recetas
 * @desc    Obtener todas las recetas
 * @access  Private (authenticated)
 */
router.get('/', authenticateToken, getRecetas);

/**
 * @route   GET /api/recetas/:id
 * @desc    Obtener una receta por ID
 * @access  Private (authenticated)
 */
router.get('/:id', authenticateToken, getRecetaById);

/**
 * @route   POST /api/recetas
 * @desc    Crear una nueva receta
 * @access  Private (admin)
 */
router.post('/', authenticateToken, requireAdmin, createReceta);

/**
 * @route   PUT /api/recetas/:id
 * @desc    Actualizar una receta por ID
 * @access  Private (admin)
 */
router.put('/:id', authenticateToken, requireAdmin, updateReceta);

/**
 * @route   DELETE /api/recetas/:id
 * @desc    Eliminar una receta por ID
 * @access  Private (admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteReceta);

// Ruta de vinculación: productos que usan esta receta

/**
 * @route   GET /api/recetas/:id/productos
 * @desc    Obtener los productos asociados a una receta
 * @access  Private
 */
router.get('/:id/productos', authenticateToken, requireAdmin, getProductosByReceta);

export default router;
