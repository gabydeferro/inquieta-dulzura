import { Request, Response } from 'express';
import { ProductoService } from '../services/ProductoService';
import { CreateProductoDTO } from '../dtos/ProductoDTO';
import { handleDuplicateError } from '../middleware/duplicateError';

export class ProductoController {
  private productoService: ProductoService;

  constructor() {
    this.productoService = new ProductoService();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const isAdmin = req.query.admin === 'true';
      const productos = isAdmin
        ? await this.productoService.getAllAdmin()
        : await this.productoService.getAll();
      res.status(200).json(productos);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener los productos';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const producto = await this.productoService.getById(id);
      if (producto) {
        res.status(200).json(producto);
      } else {
        res.status(404).json({ success: false, error: 'Producto no encontrado' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener el producto';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async getByCategoriaId(req: Request, res: Response): Promise<void> {
    try {
      const categoriaId = parseInt(req.params.categoriaId, 10);
      const productos = await this.productoService.getByCategoriaId(categoriaId);
      res.status(200).json(productos);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al obtener productos por categoría';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const nuevoProducto = await this.productoService.create(req.body as CreateProductoDTO);
      res.status(201).json(nuevoProducto);
    } catch (error: unknown) {
      if (handleDuplicateError(error, res, 'Ya existe un producto con este nombre o SKU.')) return;
      const message = error instanceof Error ? error.message : 'Error al crear el producto';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const productoActualizado = await this.productoService.update(
        id,
        req.body as CreateProductoDTO,
      );
      if (productoActualizado) {
        res.status(200).json(productoActualizado);
      } else {
        res.status(404).json({ success: false, error: 'Producto no encontrado para actualizar' });
      }
    } catch (error: unknown) {
      if (handleDuplicateError(error, res, 'Ya existe un producto con este nombre o SKU.')) return;
      const message = error instanceof Error ? error.message : 'Error al actualizar el producto';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.productoService.delete(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ success: false, error: 'Producto no encontrado para eliminar' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar el producto';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async search(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string) ?? '';
      const productos = await this.productoService.search(query);
      res.status(200).json(productos);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error searching productos';
      res.status(500).json({ success: false, error: message });
    }
  }

  // --- Vinculación handlers ---

  public async getRecetasByProducto(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const recetas = await this.productoService.getRecetasByProducto(id);
      res.status(200).json(recetas);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al obtener recetas del producto';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async vincularReceta(req: Request, res: Response): Promise<void> {
    try {
      const productoId = parseInt(req.params.id, 10);
      const { receta_id, cantidad_receta } = req.body;
      const vinculo = await this.productoService.vincular(productoId, receta_id, cantidad_receta);
      res.status(201).json(vinculo);
    } catch (error: unknown) {
      if (handleDuplicateError(error, res, 'Este producto ya está vinculado a esta receta.'))
        return;
      const message = error instanceof Error ? error.message : 'Error al vincular receta';
      res.status(500).json({ success: false, error: message });
    }
  }

  public async desvincularReceta(req: Request, res: Response): Promise<void> {
    try {
      const productoId = parseInt(req.params.id, 10);
      const recetaId = parseInt(req.params.recetaId, 10);
      const success = await this.productoService.desvincular(productoId, recetaId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ success: false, error: 'Vinculación no encontrada' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al desvincular receta';
      res.status(500).json({ success: false, error: message });
    }
  }
}
