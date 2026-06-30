import { Request, Response } from 'express';
import { RecetaService } from '../services/RecetaService';
import type { CreateRecetaDTO, UpdateRecetaDTO } from '../dtos/RecetasDTO';

const recetaService = new RecetaService();

export const getRecetas = async (req: Request, res: Response) => {
  try {
    const recetas = await recetaService.getAll();
    res.json(recetas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching recetas';
    res.status(500).json({ success: false, error: message });
  }
};

export const getRecetaById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const receta = await recetaService.getById(id);
    if (receta) {
      res.json(receta);
    } else {
      res.status(404).json({ success: false, error: 'Receta not found' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching receta';
    res.status(500).json({ success: false, error: message });
  }
};

export const createReceta = async (req: Request, res: Response) => {
  try {
    const newReceta = await recetaService.create(req.body as CreateRecetaDTO);
    res.status(201).json(newReceta);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error creating receta';
    res.status(500).json({ success: false, error: message });
  }
};

export const updateReceta = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedReceta = await recetaService.update(id, req.body as UpdateRecetaDTO);
    if (updatedReceta) {
      res.json(updatedReceta);
    } else {
      res.status(404).json({ success: false, error: 'Receta not found' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error updating receta';
    res.status(500).json({ success: false, error: message });
  }
};

export const deleteReceta = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await recetaService.delete(id);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ success: false, error: 'Receta not found' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error deleting receta';
    res.status(500).json({ success: false, error: message });
  }
};
