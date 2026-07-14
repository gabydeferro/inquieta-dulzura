import { Router } from 'express';
import {
  getAllIngredientes,
  getIngredienteById,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
} from '../controllers/IngredientesController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ingredienteSchema, ingredienteUpdateSchema } from '../schemas/ingrediente.schema';

const router = Router();

/**
 * @route   GET /api/ingredientes
 * @desc    Obtener todos los ingredientes
 * @access  Private
 */
router.get('/', getAllIngredientes);

/**
 * @route   GET /api/ingredientes/:id
 * @desc    Obtener un ingrediente por ID
 * @access  Private
 */
router.get('/:id', getIngredienteById);

/**
 * @route   POST /api/ingredientes
 * @desc    Crear un nuevo ingrediente
 * @access  Private
 */
router.post('/', authenticateToken, validate(ingredienteSchema, 'body'), createIngrediente);

/**
 * @route   PUT /api/ingredientes/:id
 * @desc    Actualizar un ingrediente por ID
 * @access  Private
 */
router.put('/:id', authenticateToken, validate(ingredienteUpdateSchema, 'body'), updateIngrediente);

/**
 * @route   DELETE /api/ingredientes/:id
 * @desc    Eliminar un ingrediente por ID
 * @access  Private
 */
router.delete('/:id', authenticateToken, deleteIngrediente);

export default router;
