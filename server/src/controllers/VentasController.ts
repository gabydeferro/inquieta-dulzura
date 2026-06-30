import { Request, Response } from 'express';
import { VentasService } from '../services/VentasService';
import { CreateVentaDTO } from '../dtos/VentasDTO';

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
    const message = error instanceof Error ? error.message : 'Error creating venta';
    res.status(500).json({ success: false, error: message });
  }
};
