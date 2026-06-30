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
}
