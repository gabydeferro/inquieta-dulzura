import { Request, Response } from 'express';
import { CategoriaService } from '../services/CategoriaService';
import { CreateCategoriaDTO } from '../dtos/CategoriaDTO';
import { handleDuplicateError } from '../middleware/duplicateError';

export class CategoriaController {
  private categoriaService: CategoriaService;

  constructor() {
    this.categoriaService = new CategoriaService();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categorias = await this.categoriaService.getAll();
      res.status(200).json(categorias);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener las categorías';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const categoria = await this.categoriaService.getById(id);
      if (categoria) {
        res.status(200).json(categoria);
      } else {
        res.status(404).json({ success: false, error: 'Categoría no encontrada' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener la categoría';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const nuevaCategoria = await this.categoriaService.create(
        req.body as CreateCategoriaDTO,
      );
      res.status(201).json(nuevaCategoria);
    } catch (error: unknown) {
      if (handleDuplicateError(error, res, 'Ya existe una categoría con ese nombre')) return;
      const message = error instanceof Error ? error.message : 'Error al crear la categoría';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const categoriaActualizada = await this.categoriaService.update(
        id,
        req.body as CreateCategoriaDTO,
      );
      if (categoriaActualizada) {
        res.status(200).json(categoriaActualizada);
      } else {
        res.status(404).json({ success: false, error: 'Categoría no encontrada para actualizar' });
      }
    } catch (error: unknown) {
      if (handleDuplicateError(error, res, 'Ya existe una categoría con ese nombre')) return;
      const message = error instanceof Error ? error.message : 'Error al actualizar la categoría';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.categoriaService.delete(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ success: false, error: 'Categoría no encontrada para eliminar' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la categoría';
      res.status(500).json({ success: false, error: message });
    }
  }
}
