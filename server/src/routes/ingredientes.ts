import { Router } from 'express';
import {
  getAllIngredientes,
  getIngredienteById,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
} from '../controllers/IngredientesController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ingredienteSchema, ingredienteUpdateSchema } from '../schemas/ingrediente.schema';

const router = Router();

/**
 * @route   GET /api/ingredientes
 * @desc    Obtener todos los ingredientes
 * @access  Private (authenticated)
 */
router.get('/', authenticateToken, getAllIngredientes);

/**
 * @route   GET /api/ingredientes/:id
 * @desc    Obtener un ingrediente por ID
 * @access  Private (authenticated)
 */
router.get('/:id', authenticateToken, getIngredienteById);

/**
 * @route   POST /api/ingredientes
 * @desc    Crear un nuevo ingrediente
 * @access  Private (admin)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(ingredienteSchema, 'body'),
  createIngrediente,
);

/**
 * @route   PUT /api/ingredientes/:id
 * @desc    Actualizar un ingrediente por ID
 * @access  Private (admin)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(ingredienteUpdateSchema, 'body'),
  updateIngrediente,
);

/**
 * @route   DELETE /api/ingredientes/:id
 * @desc    Eliminar un ingrediente por ID
 * @access  Private (admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteIngrediente);

export default router;
