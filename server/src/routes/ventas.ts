import { Router } from 'express';
import { getVentas, createVenta, getVentaById, getHistorial, updateVentaStatus } from '../controllers/VentasController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ventaCreateSchema } from '../schemas/venta.schema';

const router = Router();

router.get('/', authenticateToken, getVentas);
router.get('/historial', authenticateToken, requireAdmin, getHistorial);
router.get('/:id', getVentaById);
router.post('/', validate(ventaCreateSchema, 'body'), createVenta);
router.patch('/:id/status', authenticateToken, requireAdmin, updateVentaStatus);

export default router;
