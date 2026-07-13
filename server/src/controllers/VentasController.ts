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
