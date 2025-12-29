import { Router } from 'express';
import {
  getAllIngredientes,
  getIngredienteById,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
} from '../controllers/IngredientesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getAllIngredientes);
router.get('/:id', getIngredienteById);
router.post('/', authenticateToken, createIngrediente);
router.put('/:id', authenticateToken, updateIngrediente);
router.delete('/:id', authenticateToken, deleteIngrediente);

export default router;
