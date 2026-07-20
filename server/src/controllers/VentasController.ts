import { Request, Response } from 'express';
import { VentasService } from '../services/VentasService';
import { CreateVentaDTO } from '../dtos/VentasDTO';
import { InsufficientStockError } from '../errors/InsufficientStockError';

const ventasService = new VentasService();

export const getVentas = async (req: Request, res: Response) => {
  try {
    const ventas = await ventasService.getVentas();
    res.json(ventas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching ventas';
    res.status(500).json({ success: false, error: message });
  }
};

export const createVenta = async (req: Request, res: Response) => {
  try {
    const venta = await ventasService.createVenta(req.body as CreateVentaDTO);
    res.status(201).json(venta);
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      res.status(409).json({ success: false, error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Error creating venta';
    res.status(500).json({ success: false, error: message });
  }
};

export const getVentaById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const venta = await ventasService.getVentaById(id);
    if (!venta) {
      res.status(404).json({ success: false, error: 'Venta not found' });
      return;
    }
    res.json(venta);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching venta';
    res.status(500).json({ success: false, error: message });
  }
};

const VALID_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const getHistorial = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const filters: Record<string, string | number> = {};

    if (req.query.fecha_desde) {
      if (!VALID_DATE_RE.test(req.query.fecha_desde as string)) {
        res.status(400).json({ success: false, error: 'fecha_desde must be YYYY-MM-DD' });
        return;
      }
      filters.fecha_desde = req.query.fecha_desde as string;
    }
    if (req.query.fecha_hasta) {
      if (!VALID_DATE_RE.test(req.query.fecha_hasta as string)) {
        res.status(400).json({ success: false, error: 'fecha_hasta must be YYYY-MM-DD' });
        return;
      }
      filters.fecha_hasta = req.query.fecha_hasta as string;
    }
    if (req.query.metodo_pago) {
      filters.metodo_pago = req.query.metodo_pago as string;
    }
    if (req.query.cliente_id) {
      const clienteId = parseInt(req.query.cliente_id as string, 10);
      if (isNaN(clienteId)) {
        res.status(400).json({ success: false, error: 'cliente_id must be a number' });
        return;
      }
      filters.cliente_id = clienteId;
    }

    const result = await ventasService.getHistorial(filters, page, limit);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching historial';
    res.status(500).json({ success: false, error: message });
  }
};

export const updateVentaStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado } = req.body as { estado?: string };

    if (!estado) {
      res.status(400).json({ success: false, error: 'estado is required' });
      return;
    }

    const validEstados = ['completada', 'cancelada', 'pendiente'];
    if (!validEstados.includes(estado)) {
      res.status(400).json({ success: false, error: `estado must be one of: ${validEstados.join(', ')}` });
      return;
    }

    await ventasService.updateStatus(id, estado);
    const venta = await ventasService.getVentaById(id);
    res.json({ success: true, data: venta });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error updating venta status';
    res.status(500).json({ success: false, error: message });
  }
};
