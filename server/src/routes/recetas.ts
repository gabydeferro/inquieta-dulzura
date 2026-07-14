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
 * @access  Public
 */
router.get('/', getRecetas);

/**
 * @route   GET /api/recetas/:id
 * @desc    Obtener una receta por ID
 * @access  Public
 */
router.get('/:id', getRecetaById);

/**
 * @route   POST /api/recetas
 * @desc    Crear una nueva receta
 * @access  Private
 */
router.post('/', authenticateToken, createReceta);

/**
 * @route   PUT /api/recetas/:id
 * @desc    Actualizar una receta por ID
 * @access  Private
 */
router.put('/:id', authenticateToken, updateReceta);

/**
 * @route   DELETE /api/recetas/:id
 * @desc    Eliminar una receta por ID
 * @access  Private
 */
router.delete('/:id', authenticateToken, deleteReceta);

// Ruta de vinculación: productos que usan esta receta

/**
 * @route   GET /api/recetas/:id/productos
 * @desc    Obtener los productos asociados a una receta
 * @access  Private
 */
router.get('/:id/productos', authenticateToken, requireAdmin, getProductosByReceta);

export default router;
