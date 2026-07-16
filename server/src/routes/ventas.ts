import { Router } from 'express';
import { getVentas, createVenta, getVentaById, getHistorial } from '../controllers/VentasController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ventaCreateSchema } from '../schemas/venta.schema';

const router = Router();

router.get('/', getVentas);
router.get('/historial', authenticateToken, requireAdmin, getHistorial);
router.get('/:id', getVentaById);
router.post('/', validate(ventaCreateSchema, 'body'), createVenta);

export default router;
