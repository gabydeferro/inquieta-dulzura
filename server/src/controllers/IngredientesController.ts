import { Request, Response } from 'express';
import { IngredienteService } from '../services/IngredienteService';

const ingredienteService = new IngredienteService();

export const getAllIngredientes = async (req: Request, res: Response) => {
  try {
    const ingredientes = await ingredienteService.getAll();
    res.json(ingredientes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ingredientes' });
  }
};

export const getIngredienteById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ingrediente = await ingredienteService.getById(id);
    if (ingrediente) {
      res.json(ingrediente);
    } else {
      res.status(404).json({ message: 'Ingrediente not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ingrediente' });
  }
};

export const createIngrediente = async (req: Request, res: Response) => {
  try {
    const newIngrediente = await ingredienteService.create(req.body);
    res.status(201).json(newIngrediente);
  } catch (error) {
    res.status(500).json({ message: 'Error creating ingrediente' });
  }
};

export const updateIngrediente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedIngrediente = await ingredienteService.update(id, req.body);
    if (updatedIngrediente) {
      res.json(updatedIngrediente);
    } else {
      res.status(404).json({ message: 'Ingrediente not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating ingrediente' });
  }
};

export const deleteIngrediente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await ingredienteService.delete(id);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Ingrediente not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting ingrediente' });
  }
};