import { Router } from 'express';
import { getPagosByVentaId } from '../controllers/PagosController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/:id/pagos', authenticateToken, getPagosByVentaId);

export default router;
