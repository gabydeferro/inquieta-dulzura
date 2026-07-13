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
router.get('/search', productoController.search.bind(productoController));
router.get('/', productoController.getAll.bind(productoController));
router.get('/categoria/:categoriaId', productoController.getByCategoriaId.bind(productoController));
router.get('/:id', productoController.getById.bind(productoController));

// Rutas protegidas (requieren rol admin)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(productoSchema, 'body'),
  productoController.create.bind(productoController),
);
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(productoIdSchema, 'params'),
  validate(productoUpdateSchema, 'body'),
  productoController.update.bind(productoController),
);
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(productoIdSchema, 'params'),
  productoController.delete.bind(productoController),
);

// Rutas de vinculación producto-receta
router.get(
  '/:id/recetas',
  authenticateToken,
  requireAdmin,
  productoController.getRecetasByProducto.bind(productoController),
);
router.post(
  '/:id/recetas',
  authenticateToken,
  requireAdmin,
  validate(vinculoSchema, 'body'),
  productoController.vincularReceta.bind(productoController),
);
router.delete(
  '/:id/recetas/:recetaId',
  authenticateToken,
  requireAdmin,
  productoController.desvincularReceta.bind(productoController),
);

export default router;
