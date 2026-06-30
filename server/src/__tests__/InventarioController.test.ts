import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getInventario } from '../controllers/InventarioController';
import { connection } from '../db';

vi.mock('../db', () => ({
  connection: { execute: vi.fn() },
}));

describe('InventarioController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: vi.Mock;
  const mockExecute = connection.execute as vi.Mock;

  beforeEach(() => {
    mockJson = vi.fn();
    mockRequest = {};
    mockResponse = { json: mockJson };
    vi.clearAllMocks();
  });

  describe('getInventario', () => {
    it('should return all inventario', async () => {
      const mockRows = [{ id: 1, nombre: 'Categoria' }];
      mockExecute.mockResolvedValueOnce([mockRows, []]);

      await getInventario(mockRequest as Request, mockResponse as Response);

      expect(mockExecute).toHaveBeenCalledWith('SELECT * FROM categorias');
      expect(mockJson).toHaveBeenCalledWith(mockRows);
    });

    it('should handle DB errors', async () => {
      mockExecute.mockRejectedValueOnce(new Error('DB error'));

      await expect(getInventario(mockRequest as Request, mockResponse as Response)).rejects.toThrow(
        'DB error',
      );
    });
  });
});
