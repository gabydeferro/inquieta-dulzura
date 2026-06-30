import { Router } from 'express';
import { ProductoController } from '../controllers/ProductoController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { productoSchema, productoUpdateSchema, productoIdSchema } from '../schemas/producto.schema';

const router = Router();
const productoController = new ProductoController();

// Rutas públicas
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

export default router;
