import { Router } from 'express';
import { getPagosByVentaId } from '../controllers/PagosController';

const router = Router();

router.get('/:id/pagos', getPagosByVentaId);

export default router;
