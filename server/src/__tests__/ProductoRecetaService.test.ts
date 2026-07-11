import { describe, test, expect, vi, beforeEach } from 'vitest';
import { connection } from '../db';

vi.mock('../db', () => ({
  connection: { query: vi.fn() },
}));

const mockQuery = connection.query as vi.Mock;

// We import after mock so the module picks up the mocked connection
import { ProductoService } from '../services/ProductoService';
import { RecetaService } from '../services/RecetaService';

describe('ProductoService — Vinculación Recetas', () => {
  let service: ProductoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductoService();
  });

  describe('getRecetasByProducto', () => {
    test('debe retornar las recetas vinculadas a un producto', async () => {
      const mockRows = [
        { receta_id: 3, nombre: 'Torta Chocolate', cantidad_receta: 2 },
        { receta_id: 7, nombre: 'Torta Vainilla', cantidad_receta: 1 },
      ];
      mockQuery.mockResolvedValueOnce([mockRows]);

      const result = await service.getRecetasByProducto(5);

      expect(result).toEqual(mockRows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('producto_receta'),
        [5],
      );
    });

    test('debe retornar array vacío si no hay recetas vinculadas', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await service.getRecetasByProducto(99);

      expect(result).toEqual([]);
    });
  });

  describe('vincular', () => {
    test('debe insertar una vinculación y retornar los datos', async () => {
      const mockInsertResult = { insertId: 1, affectedRows: 1 };
      mockQuery.mockResolvedValueOnce([mockInsertResult]);

      const result = await service.vincular(5, 3, 2.5);

      expect(result).toEqual({
        producto_id: 5,
        receta_id: 3,
        cantidad_receta: 2.5,
      });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO producto_receta'),
        [5, 3, 2.5],
      );
    });

    test('debe lanzar error en caso de duplicado (UNIQUE constraint)', async () => {
      const duplicateError = new Error('Duplicate entry') as Error & { code: string; errno: number };
      duplicateError.code = 'ER_DUP_ENTRY';
      duplicateError.errno = 1062;
      mockQuery.mockRejectedValueOnce(duplicateError);

      await expect(service.vincular(5, 3, 1)).rejects.toThrow('Duplicate entry');
    });
  });

  describe('desvincular', () => {
    test('debe eliminar la vinculación y retornar true', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await service.desvincular(5, 3);

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM producto_receta'),
        [5, 3],
      );
    });

    test('debe retornar false si la vinculación no existía', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await service.desvincular(5, 99);

      expect(result).toBe(false);
    });
  });

  describe('getById — eager-load recetas', () => {
    test('debe incluir recetas vinculadas en getById', async () => {
      const mockProducto = { id: 5, nombre: 'Pastel', precio: 100 };
      const mockRecetas = [{ receta_id: 3, nombre: 'Torta Chocolate', cantidad_receta: 2 }];

      mockQuery
        .mockResolvedValueOnce([[mockProducto]])
        .mockResolvedValueOnce([mockRecetas]);

      const result = await service.getById(5);

      expect(result).toEqual({
        ...mockProducto,
        recetas: mockRecetas,
      });
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    test('debe incluir recetas vacías si no hay vinculaciones', async () => {
      const mockProducto = { id: 99, nombre: 'Sin Recetas', precio: 50 };

      mockQuery
        .mockResolvedValueOnce([[mockProducto]])
        .mockResolvedValueOnce([[]]);

      const result = await service.getById(99);

      expect(result).toEqual({
        ...mockProducto,
        recetas: [],
      });
    });

    test('debe retornar null si el producto no existe', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await service.getById(999);

      expect(result).toBeNull();
    });
  });
});

describe('RecetaService — Vinculación Productos', () => {
  let service: RecetaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecetaService();
  });

  describe('getProductosByReceta', () => {
    test('debe retornar los productos vinculados a una receta', async () => {
      const mockRows = [
        { producto_id: 5, nombre: 'Pastel', cantidad_receta: 2 },
        { producto_id: 8, nombre: 'Torta', cantidad_receta: 3 },
      ];
      mockQuery.mockResolvedValueOnce([mockRows]);

      const result = await service.getProductosByReceta(3);

      expect(result).toEqual(mockRows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('producto_receta'),
        [3],
      );
    });

    test('debe retornar array vacío si no hay productos vinculados', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await service.getProductosByReceta(99);

      expect(result).toEqual([]);
    });
  });

  describe('getById — eager-load productos', () => {
    test('debe incluir productos vinculados en getById', async () => {
      const mockReceta = { id: 3, nombre: 'Torta Chocolate', activo: true };
      const mockIngredientes = [
        { ingrediente_id: 1, cantidad: 2, unidad_medida: 'kg', notas: null, nombre: 'Harina' },
      ];
      const mockProductos = [
        { producto_id: 5, nombre: 'Pastel', cantidad_receta: 2 },
      ];

      mockQuery
        .mockResolvedValueOnce([[mockReceta]])
        .mockResolvedValueOnce([mockIngredientes])
        .mockResolvedValueOnce([mockProductos]);

      const result = await service.getById(3);

      expect(result).toBeDefined();
      expect(result!.productos).toEqual(mockProductos);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });
  });
});
