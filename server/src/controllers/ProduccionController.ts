import { Request, Response } from 'express';
import { ProduccionService } from '../services/ProduccionService';
import { AuthRequest } from '../types/express';
import { CreateProduccionDTO } from '../dtos/ProduccionDTO';
import { InsufficientIngredientStockError } from '../errors/InsufficientIngredientStockError';
import { IncompatibleUnitsError } from '../errors/IncompatibleUnitsError';

const produccionService = new ProduccionService();

/**
 * POST /api/produccion
 * Crea una nueva producción (descuenta ingredientes, acredita stock).
 */
export const producir = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const input: CreateProduccionDTO = {
      receta_id: body.receta_id as number,
      cantidad_producir: body.cantidad_producir as number,
    };

    const result = await produccionService.producir(input, userId);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al producir';

    if (error instanceof InsufficientIngredientStockError) {
      res.status(400).json({
        success: false,
        error: message,
        details: [
          {
            ingrediente: error.nombre,
            disponible: error.disponible,
            requerido: error.requerido,
          },
        ],
      });
      return;
    }

    if (error instanceof IncompatibleUnitsError) {
      res.status(400).json({ success: false, error: message });
      return;
    }

    // Error mapping
    if (message.includes('Receta no encontrada')) {
      res.status(404).json({ success: false, error: message });
      return;
    }

    if (message.includes('Receta sin producto vinculado')) {
      res.status(404).json({ success: false, error: message });
      return;
    }

    if (message.includes('múltiples productos')) {
      res.status(409).json({ success: false, error: message });
      return;
    }

    res.status(500).json({ success: false, error: message });
  }
};

/**
 * GET /api/produccion
 * Lista producciones con paginación.
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await produccionService.listar(page, limit);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al listar producciones';
    res.status(500).json({ success: false, error: message });
  }
};
