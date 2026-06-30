import { describe, test, expect, vi } from 'vitest';
import { connection } from '../db';
import { getRecetas } from '../services/RecetasService';

vi.mock('../db', () => ({
  connection: { execute: vi.fn() },
}));

const mockExecute = connection.execute as vi.Mock;

describe('RecetasService', () => {
  describe('getRecetas', () => {
    test('debe retornar todas las recetas', async () => {
      const mockRows = [{ id: 1, nombre: 'Torta de Chocolate' }];
      mockExecute.mockResolvedValueOnce([mockRows, []]);

      const result = await getRecetas();
      expect(result).toEqual(mockRows);
      expect(mockExecute).toHaveBeenCalledWith('SELECT * FROM recetas');
    });

    test('debe retornar array vacío si no hay recetas', async () => {
      mockExecute.mockResolvedValueOnce([[], []]);

      const result = await getRecetas();
      expect(result).toEqual([]);
    });
  });
});
