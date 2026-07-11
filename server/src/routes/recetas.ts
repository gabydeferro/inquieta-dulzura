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

router.get('/', getRecetas);
router.get('/:id', getRecetaById);
router.post('/', authenticateToken, createReceta);
router.put('/:id', authenticateToken, updateReceta);
router.delete('/:id', authenticateToken, deleteReceta);

// Ruta de vinculación: productos que usan esta receta
router.get('/:id/productos', authenticateToken, requireAdmin, getProductosByReceta);

export default router;
