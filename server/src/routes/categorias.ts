import { Router } from 'express';
import { CategoriaController } from '../controllers/CategoriaController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const categoriaController = new CategoriaController();

// Rutas públicas
router.get('/', categoriaController.getAll.bind(categoriaController));
router.get('/:id', categoriaController.getById.bind(categoriaController));

// Rutas protegidas (requieren rol admin)
router.post('/', authenticateToken, requireAdmin, categoriaController.create.bind(categoriaController));
router.put('/:id', authenticateToken, requireAdmin, categoriaController.update.bind(categoriaController));
router.delete('/:id', authenticateToken, requireAdmin, categoriaController.delete.bind(categoriaController));

export default router;
