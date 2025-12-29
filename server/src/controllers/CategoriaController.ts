import { Request, Response } from 'express';
import { CategoriaService } from '../services/CategoriaService';
import { CreateCategoriaDTO, UpdateCategoriaDTO } from '../dtos/CategoriaDTO';

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
      res.status(500).json({ message: 'Error al obtener las categorías', error });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const categoria = await this.categoriaService.getById(id);
      if (categoria) {
        res.status(200).json(categoria);
      } else {
        res.status(404).json({ message: 'Categoría no encontrada' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la categoría', error });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const createCategoriaDTO: CreateCategoriaDTO = req.body;
      // Basic validation
      if (!createCategoriaDTO.nombre) {
        res.status(400).json({ message: 'El campo nombre es obligatorio' });
        return;
      }
      const nuevaCategoria = await this.categoriaService.create(createCategoriaDTO);
      res.status(201).json(nuevaCategoria);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
        return;
      }
      res.status(500).json({ message: 'Error al crear la categoría', error });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updateCategoriaDTO: UpdateCategoriaDTO = req.body;
      const categoriaActualizada = await this.categoriaService.update(id, updateCategoriaDTO);
      if (categoriaActualizada) {
        res.status(200).json(categoriaActualizada);
      } else {
        res.status(404).json({ message: 'Categoría no encontrada para actualizar' });
      }
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
        return;
      }
      res.status(500).json({ message: 'Error al actualizar la categoría', error });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.categoriaService.delete(id);
      if (success) {
        res.status(204).send(); // No content
      } else {
        res.status(404).json({ message: 'Categoría no encontrada para eliminar' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar la categoría', error });
    }
  }
}
