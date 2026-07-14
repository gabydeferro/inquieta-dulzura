import { Router } from 'express';
import { CategoriaController } from '../controllers/CategoriaController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  categoriaSchema,
  categoriaUpdateSchema,
  categoriaIdSchema,
} from '../schemas/categoria.schema';

const router = Router();
const categoriaController = new CategoriaController();

// Rutas públicas

/**
 * @route   GET /api/categorias
 * @desc    Obtiene todas las categorías
 * @access  Public
 */
router.get('/', categoriaController.getAll.bind(categoriaController));

/**
 * @route   GET /api/categorias/:id
 * @desc    Obtener una categoría por su ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(categoriaIdSchema, 'params'),
  categoriaController.getById.bind(categoriaController),
);

// Rutas protegidas (requieren rol admin)

/**
 * @route   POST /api/categorias
 * @desc    Crear una nueva categoría
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(categoriaSchema, 'body'),
  categoriaController.create.bind(categoriaController),
);

/**
 * @route   PUT /api/categorias/:id
 * @desc    Actualizar una categoría por su ID
 * @access  Private
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(categoriaIdSchema, 'params'),
  validate(categoriaUpdateSchema, 'body'),
  categoriaController.update.bind(categoriaController),
);

/**
 * @route   DELETE /api/categorias/:id
 * @desc    Eliminar una categoría por su ID
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(categoriaIdSchema, 'params'),
  categoriaController.delete.bind(categoriaController),
);

export default router;
