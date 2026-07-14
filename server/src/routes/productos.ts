import { Router } from 'express';
import { ProductoController } from '../controllers/ProductoController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  productoSchema,
  productoUpdateSchema,
  productoIdSchema,
  vinculoSchema,
} from '../schemas/producto.schema';

const router = Router();
const productoController = new ProductoController();

// Rutas públicas

/**
 * @route   GET /api/productos/search
 * @desc    Buscar productos
 * @access  Public
 */
router.get('/search', productoController.search.bind(productoController));

/**
 * @route   GET /api/productos
 * @desc    Obtener todos los productos
 * @access  Public
 */
router.get('/', productoController.getAll.bind(productoController));

/**
 * @route   GET /api/productos/categoria/:categoriaId
 * @desc    Obtener productos por categoría
 * @access  Public
 */
router.get('/categoria/:categoriaId', productoController.getByCategoriaId.bind(productoController));

/**
 * @route   GET /api/productos/:id
 * @desc    Obtener un producto por ID
 * @access  Public
 */
router.get('/:id', productoController.getById.bind(productoController));

// Rutas protegidas (requieren rol admin)

/**
 * @route   POST /api/productos
 * @desc    Crear un nuevo producto
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(productoSchema, 'body'),
  productoController.create.bind(productoController),
);

/**
 * @route   PUT /api/productos/:id
 * @desc    Actualizar un producto por ID
 * @access  Private
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(productoIdSchema, 'params'),
  validate(productoUpdateSchema, 'body'),
  productoController.update.bind(productoController),
);

/**
 * @route   DELETE /api/productos/:id
 * @desc    Eliminar un producto por ID
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(productoIdSchema, 'params'),
  productoController.delete.bind(productoController),
);

// Rutas de vinculación producto-receta

/**
 * @route   GET /api/productos/:id/recetas
 * @desc    Obtener recetas vinculadas a un producto
 * @access  Private
 */
router.get(
  '/:id/recetas',
  authenticateToken,
  requireAdmin,
  productoController.getRecetasByProducto.bind(productoController),
);

/**
 * @route   POST /api/productos/:id/recetas
 * @desc    Vincular una receta a un producto
 * @access  Private
 */
router.post(
  '/:id/recetas',
  authenticateToken,
  requireAdmin,
  validate(vinculoSchema, 'body'),
  productoController.vincularReceta.bind(productoController),
);

/**
 * @route   DELETE /api/productos/:id/recetas/:recetaId
 * @desc    Desvincular una receta de un producto
 * @access  Private
 */
router.delete(
  '/:id/recetas/:recetaId',
  authenticateToken,
  requireAdmin,
  productoController.desvincularReceta.bind(productoController),
);

export default router;
