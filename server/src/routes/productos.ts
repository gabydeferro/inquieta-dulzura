import { Router } from 'express';
import { ProductoController } from '../controllers/ProductoController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const productoController = new ProductoController();

// Rutas públicas
router.get('/', productoController.getAll.bind(productoController));
router.get('/categoria/:categoriaId', productoController.getByCategoriaId.bind(productoController));
router.get('/:id', productoController.getById.bind(productoController));

// Rutas protegidas (requieren rol admin)
router.post('/', authenticateToken, requireAdmin, productoController.create.bind(productoController));
router.put('/:id', authenticateToken, requireAdmin, productoController.update.bind(productoController));
router.delete('/:id', authenticateToken, requireAdmin, productoController.delete.bind(productoController));

export default router;
