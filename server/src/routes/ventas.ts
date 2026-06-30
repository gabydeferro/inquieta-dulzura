import { Router } from 'express';
import { getVentas, createVenta } from '../controllers/VentasController';
import { validate } from '../middleware/validate';
import { ventaCreateSchema } from '../schemas/venta.schema';

const router = Router();

router.get('/', getVentas);
router.post('/', validate(ventaCreateSchema, 'body'), createVenta);

export default router;
