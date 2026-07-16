import { Router } from 'express';
import {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} from '../controllers/ClienteController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { clienteSchema, clienteUpdateSchema } from '../schemas/cliente.schema';

const router = Router();

/**
 * @route   GET /api/clientes
 * @desc    Obtener todos los clientes (con busqueda y paginacion)
 * @access  Private (admin)
 */
router.get('/', authenticateToken, requireAdmin, getAllClientes);

/**
 * @route   GET /api/clientes/:id
 * @desc    Obtener un cliente por ID
 * @access  Private (admin)
 */
router.get('/:id', authenticateToken, requireAdmin, getClienteById);

/**
 * @route   POST /api/clientes
 * @desc    Crear un nuevo cliente
 * @access  Private (admin)
 */
router.post('/', authenticateToken, requireAdmin, validate(clienteSchema, 'body'), createCliente);

/**
 * @route   PUT /api/clientes/:id
 * @desc    Actualizar un cliente por ID
 * @access  Private (admin)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(clienteUpdateSchema, 'body'),
  updateCliente,
);

/**
 * @route   DELETE /api/clientes/:id
 * @desc    Eliminar (soft-delete) un cliente por ID
 * @access  Private (admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteCliente);

export default router;
