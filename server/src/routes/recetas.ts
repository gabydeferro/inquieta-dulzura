import { Router } from 'express';
import {
  getRecetas,
  getRecetaById,
  createReceta,
  updateReceta,
  deleteReceta,
} from '../controllers/RecetasController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getRecetas);
router.get('/:id', getRecetaById);
router.post('/', authenticateToken, createReceta);
router.put('/:id', authenticateToken, updateReceta);
router.delete('/:id', authenticateToken, deleteReceta);

export default router;
