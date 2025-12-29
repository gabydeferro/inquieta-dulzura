import { Request, Response } from 'express';
import { ProductoService } from '../services/ProductoService';
import { CreateProductoDTO, UpdateProductoDTO } from '../dtos/ProductoDTO';

export class ProductoController {
  private productoService: ProductoService;

  constructor() {
    this.productoService = new ProductoService();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Check if the user is authenticated and has admin role, for example
      // For now, we differentiate based on a query param for simplicity
      const isAdmin = req.query.admin === 'true';
      const productos = isAdmin
        ? await this.productoService.getAllAdmin()
        : await this.productoService.getAll();
      res.status(200).json(productos);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los productos', error });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const producto = await this.productoService.getById(id);
      if (producto) {
        res.status(200).json(producto);
      } else {
        res.status(404).json({ message: 'Producto no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el producto', error });
    }
  }

  public async getByCategoriaId(req: Request, res: Response): Promise<void> {
    try {
      const categoriaId = parseInt(req.params.categoriaId, 10);
      const productos = await this.productoService.getByCategoriaId(categoriaId);
      res.status(200).json(productos);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener productos por categoría', error });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const createProductoDTO: CreateProductoDTO = req.body;
      if (!createProductoDTO.nombre || !createProductoDTO.categoria_id || !createProductoDTO.precio) {
        res.status(400).json({ message: 'Los campos nombre, categoria_id y precio son obligatorios' });
        return;
      }
      const nuevoProducto = await this.productoService.create(createProductoDTO);
      res.status(201).json(nuevoProducto);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        res.status(409).json({ message: 'Ya existe un producto con este nombre o SKU.' });
        return;
      }
      res.status(500).json({ message: 'Error al crear el producto', error });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updateProductoDTO: UpdateProductoDTO = req.body;
      const productoActualizado = await this.productoService.update(id, updateProductoDTO);
      if (productoActualizado) {
        res.status(200).json(productoActualizado);
      } else {
        res.status(404).json({ message: 'Producto no encontrado para actualizar' });
      }
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        res.status(409).json({ message: 'Ya existe un producto con este nombre o SKU.' });
        return;
      }
      res.status(500).json({ message: 'Error al actualizar el producto', error });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await this.productoService.delete(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Producto no encontrado para eliminar' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar el producto', error });
    }
  }
}
