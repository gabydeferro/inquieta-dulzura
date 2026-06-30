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
router.get('/', categoriaController.getAll.bind(categoriaController));
router.get(
  '/:id',
  validate(categoriaIdSchema, 'params'),
  categoriaController.getById.bind(categoriaController),
);

// Rutas protegidas (requieren rol admin)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(categoriaSchema, 'body'),
  categoriaController.create.bind(categoriaController),
);
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(categoriaIdSchema, 'params'),
  validate(categoriaUpdateSchema, 'body'),
  categoriaController.update.bind(categoriaController),
);
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(categoriaIdSchema, 'params'),
  categoriaController.delete.bind(categoriaController),
);

export default router;
