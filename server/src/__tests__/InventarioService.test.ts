import { describe, test, expect, vi } from 'vitest';
import { pool } from '../config/database';
import { getInventario } from '../services/InventarioService';

vi.mock('../config/database', () => ({
  pool: { execute: vi.fn() },
}));

const mockExecute = pool.execute as vi.Mock;

describe('InventarioService', () => {
  describe('getInventario', () => {
    test('debe retornar el inventario', async () => {
      const mockRows = [
        { id: 1, nombre: 'Categoria 1' },
        { id: 2, nombre: 'Categoria 2' },
      ];
      mockExecute.mockResolvedValueOnce([mockRows, []]);

      const result = await getInventario();
      expect(result).toEqual(mockRows);
      expect(mockExecute).toHaveBeenCalledWith('SELECT * FROM categorias');
    });

    test('debe propagar errores de la base de datos', async () => {
      mockExecute.mockRejectedValueOnce(new Error('DB error'));

      await expect(getInventario()).rejects.toThrow('DB error');
    });
  });
});
