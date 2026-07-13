import { Request, Response } from 'express';
import { PagosService } from '../services/PagosService';

const pagosService = new PagosService();

export const getPagosByVentaId = async (req: Request, res: Response) => {
  try {
    const ventaId = parseInt(req.params.id, 10);
    const pagos = await pagosService.getByVentaId(ventaId);
    res.json(pagos);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching pagos';
    res.status(500).json({ success: false, error: message });
  }
};
