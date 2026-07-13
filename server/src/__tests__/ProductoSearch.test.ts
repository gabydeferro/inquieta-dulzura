import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductoService } from '../services/ProductoService';
import { connection } from '../db';

vi.mock('../db', () => ({
  connection: {
    query: vi.fn(),
  },
}));

describe('ProductoService — search', () => {
  let productoService: ProductoService;
  const mockQuery = connection.query as vi.Mock;

  beforeEach(() => {
    productoService = new ProductoService();
    mockQuery.mockReset();
  });

  describe('search', () => {
    it('should return matching products by name using LIKE', async () => {
      const mockRows = [
        { id: 1, nombre: 'Torta de Chocolate', precio: 25.0, stock: 10 },
        { id: 3, nombre: 'Torta Red Velvet', precio: 30.0, stock: 5 },
      ];
      mockQuery.mockResolvedValueOnce([mockRows]);

      const result = await productoService.search('torta');

      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Torta de Chocolate');
      expect(result[1].nombre).toBe('Torta Red Velvet');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LIKE'), ['%torta%']);
    });

    it('should return empty array when no products match', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await productoService.search('xyz123');

      expect(result).toEqual([]);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LIKE'), ['%xyz123%']);
    });

    it('should only return active products', async () => {
      const mockRows = [{ id: 1, nombre: 'Torta de Chocolate', precio: 25.0, stock: 10 }];
      mockQuery.mockResolvedValueOnce([mockRows]);

      await productoService.search('torta');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('activo = true'), ['%torta%']);
    });

    it('should be case-insensitive in search term', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      await productoService.search('TORTA');

      // MySQL LIKE is case-insensitive by default with utf8mb4_unicode_ci
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('LIKE'), ['%TORTA%']);
    });
  });
});
