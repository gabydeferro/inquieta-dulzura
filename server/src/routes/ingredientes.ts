import { Router } from 'express';
import {
  getAllIngredientes,
  getIngredienteById,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
} from '../controllers/IngredientesController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ingredienteSchema, ingredienteUpdateSchema } from '../schemas/ingrediente.schema';

const router = Router();

router.get('/', getAllIngredientes);
router.get('/:id', getIngredienteById);
router.post('/', authenticateToken, validate(ingredienteSchema, 'body'), createIngrediente);
router.put('/:id', authenticateToken, validate(ingredienteUpdateSchema, 'body'), updateIngrediente);
router.delete('/:id', authenticateToken, deleteIngrediente);

export default router;
