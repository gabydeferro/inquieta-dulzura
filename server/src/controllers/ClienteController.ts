import { Request, Response } from 'express';
import { ClienteService } from '../services/ClienteService';
import { CreateClienteDTO, UpdateClienteDTO } from '../dtos/ClienteDTO';
import { handleDuplicateError } from '../middleware/duplicateError';

const clienteService = new ClienteService();

export const getAllClientes = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const result = await clienteService.getAll(q, page, limit);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching clientes';
    res.status(500).json({ success: false, error: message });
  }
};

export const getClienteById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const cliente = await clienteService.getById(id);
    if (cliente) {
      res.json(cliente);
    } else {
      res.status(404).json({ success: false, error: 'Cliente not found' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching cliente';
    res.status(500).json({ success: false, error: message });
  }
};

export const createCliente = async (req: Request, res: Response) => {
  try {
    const newCliente = await clienteService.create(req.body as CreateClienteDTO);
    res.status(201).json(newCliente);
  } catch (error) {
    if (handleDuplicateError(error, res, 'Ya existe un cliente con ese nombre')) return;
    const message = error instanceof Error ? error.message : 'Error creating cliente';
    res.status(500).json({ success: false, error: message });
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedCliente = await clienteService.update(id, req.body as UpdateClienteDTO);
    if (updatedCliente) {
      res.json(updatedCliente);
    } else {
      res.status(404).json({ success: false, error: 'Cliente not found' });
    }
  } catch (error) {
    if (handleDuplicateError(error, res, 'Ya existe un cliente con ese nombre')) return;
    const message = error instanceof Error ? error.message : 'Error updating cliente';
    res.status(500).json({ success: false, error: message });
  }
};

export const deleteCliente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await clienteService.softDelete(id);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ success: false, error: 'Cliente not found' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error deleting cliente';
    res.status(500).json({ success: false, error: message });
  }
};
