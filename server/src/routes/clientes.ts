import { Router } from 'express';
import { getClientes } from '../controllers/ClientesController';

const router = Router();
router.get('/', getClientes);
export default router;
