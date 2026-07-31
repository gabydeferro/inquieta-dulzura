import { Router } from 'express';
import { producir, listar } from '../controllers/ProduccionController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { produccionBodySchema } from '../schemas/produccion.schema';

const router = Router();

/**
 * @route   POST /api/produccion
 * @desc    Ejecutar producción (descuenta ingredientes, acredita stock)
 * @access  Private (admin)
 */
router.post('/', authenticateToken, requireAdmin, validate(produccionBodySchema, 'body'), producir);

/**
 * @route   GET /api/produccion
 * @desc    Listar producciones con paginación
 * @access  Private (admin)
 */
router.get('/', authenticateToken, requireAdmin, listar);

export default router;
