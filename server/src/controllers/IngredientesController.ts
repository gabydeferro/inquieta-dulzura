import { Request, Response } from 'express';
import { IngredienteService } from '../services/IngredienteService';

const ingredienteService = new IngredienteService();

export const getAllIngredientes = async (req: Request, res: Response) => {
  try {
    const ingredientes = await ingredienteService.getAll();
    res.json(ingredientes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching ingredientes';
    res.status(500).json({ success: false, error: message });
  }
};

export const getIngredienteById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ingrediente = await ingredienteService.getById(id);
    if (ingrediente) {
      res.json(ingrediente);
    } else {
      res.status(404).json({ success: false, error: 'Ingrediente not found' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching ingrediente';
    res.status(500).json({ success: false, error: message });
  }
};

export const createIngrediente = async (req: Request, res: Response) => {
  try {
    const newIngrediente = await ingredienteService.create(req.body as Record<string, unknown>);
    res.status(201).json(newIngrediente);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error creating ingrediente';
    res.status(500).json({ success: false, error: message });
  }
};

export const updateIngrediente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedIngrediente = await ingredienteService.update(
      id,
      req.body as Record<string, unknown>,
    );
    if (updatedIngrediente) {
      res.json(updatedIngrediente);
    } else {
      res.status(404).json({ success: false, error: 'Ingrediente not found' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error updating ingrediente';
    res.status(500).json({ success: false, error: message });
  }
};

export const deleteIngrediente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await ingredienteService.delete(id);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ success: false, error: 'Ingrediente not found' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error deleting ingrediente';
    res.status(500).json({ success: false, error: message });
  }
};
