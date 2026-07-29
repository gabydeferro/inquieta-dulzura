import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IngredienteService } from '../services/IngredienteService';
import { pool } from '../config/database';
import { IngredienteDTO } from '../dtos/IngredienteDTO';

// Mock the database pool
vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('IngredienteService', () => {
  let ingredienteService: IngredienteService;
  const mockQuery = pool.query as vi.Mock;

  beforeEach(() => {
    ingredienteService = new IngredienteService();
    mockQuery.mockReset();
  });

  // Helper to create a mock Ingrediente
  const createMockIngrediente = (id: number): IngredienteDTO => ({
    id,
    nombre: `Ingrediente ${id}`,
    descripcion: `Descripción del ingrediente ${id}`,
    unidad_medida: 'unidades',
    costo_unitario: 1.5 * id,
    activo: true,
  });

  describe('getAll', () => {
    it('should return all active ingredients', async () => {
      const mockIngredientes = [createMockIngrediente(1), createMockIngrediente(2)];
      mockQuery.mockResolvedValueOnce([mockIngredientes]);

      const result = await ingredienteService.getAll();
      expect(result).toEqual(mockIngredientes);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM ingredientes WHERE activo = TRUE ORDER BY nombre ASC',
      );
    });

    it('should return an empty array if no ingredients are found', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await ingredienteService.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return a single active ingredient by ID', async () => {
      const mockIngrediente = createMockIngrediente(1);
      mockQuery.mockResolvedValueOnce([[mockIngrediente]]);

      const result = await ingredienteService.getById(1);
      expect(result).toEqual(mockIngrediente);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM ingredientes WHERE id = ? AND activo = TRUE',
        [1],
      );
    });

    it('should return null if ingredient not found or not active', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await ingredienteService.getById(99);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new ingredient and return it with an ID', async () => {
      const newIngrediente: Omit<IngredienteDTO, 'id'> = {
        nombre: 'Nuevo Ingrediente',
        descripcion: 'Descripción del nuevo ingrediente',
        unidad_medida: 'kg',
        costo_unitario: 10.0,
        activo: true,
      };
      // 1st query: SELECT dupe check → empty (no existing)
      mockQuery.mockResolvedValueOnce([[]]);
      // 2nd query: INSERT
      mockQuery.mockResolvedValueOnce([{ insertId: 3 }]);

      const result = await ingredienteService.create(newIngrediente);
      expect(result).toEqual({ id: 3, ...newIngrediente });
      expect(mockQuery).toHaveBeenNthCalledWith(1, 'SELECT * FROM ingredientes WHERE nombre = ?', [
        newIngrediente.nombre,
      ]);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        'INSERT INTO ingredientes (nombre, descripcion, unidad_medida, costo_unitario, activo) VALUES (?, ?, ?, ?, ?)',
        [
          newIngrediente.nombre,
          newIngrediente.descripcion,
          newIngrediente.unidad_medida,
          newIngrediente.costo_unitario,
          true,
        ],
      );
    });

    it('should set activo to true by default if not provided', async () => {
      const newIngrediente: Omit<IngredienteDTO, 'id' | 'activo'> = {
        nombre: 'Ingrediente sin Activo',
        descripcion: 'Descripción',
        unidad_medida: 'ml',
        costo_unitario: 5.0,
      };
      // 1st query: SELECT dupe check → empty
      mockQuery.mockResolvedValueOnce([[]]);
      // 2nd query: INSERT
      mockQuery.mockResolvedValueOnce([{ insertId: 4 }]);

      const result = await ingredienteService.create(newIngrediente);
      expect(result.activo).toBe(true);
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.any(String), [
        newIngrediente.nombre,
        newIngrediente.descripcion,
        newIngrediente.unidad_medida,
        newIngrediente.costo_unitario,
        true,
      ]);
    });
  });

  describe('update', () => {
    it('should update an existing ingredient and return the updated ingredient', async () => {
      const updatedData: Partial<IngredienteDTO> = {
        nombre: 'Ingrediente Actualizado',
        costo_unitario: 20.0,
      };
      const existingIngrediente = createMockIngrediente(1);
      // UPDATE query mock
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // getById after update mock
      mockQuery.mockResolvedValueOnce([[{ ...existingIngrediente, ...updatedData }]]);

      const result = await ingredienteService.update(1, updatedData);
      expect(result).toEqual({ ...existingIngrediente, ...updatedData });
      // Only provided fields are SET — omitted fields are NOT overwritten
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE ingredientes SET nombre = ?, costo_unitario = ? WHERE id = ?',
        [updatedData.nombre, updatedData.costo_unitario, 1],
      );
    });

    it('should return null if ingredient to update is not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]); // Mock no rows affected

      const result = await ingredienteService.update(99, { nombre: 'Non Existent' });
      expect(result).toBeNull();
    });
  });

  describe('updateStock', () => {
    it('should update cantidad_disponible and return the updated ingredient', async () => {
      const ingredienteId = 1;
      const newStock = 50;
      const updatedIngrediente = { ...createMockIngrediente(ingredienteId), cantidad_disponible: newStock };

      // UPDATE query mock
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // getById after update mock
      mockQuery.mockResolvedValueOnce([[updatedIngrediente]]);

      const result = await ingredienteService.updateStock(ingredienteId, newStock);

      expect(result).toEqual(updatedIngrediente);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'UPDATE ingredientes SET cantidad_disponible = ? WHERE id = ?',
        [newStock, ingredienteId],
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM ingredientes WHERE id = ? AND activo = TRUE',
        [ingredienteId],
      );
    });

    it('should reject when cantidad_disponible is negative', async () => {
      await expect(ingredienteService.updateStock(1, -5)).rejects.toThrow(
        'cantidad_disponible no puede ser negativo',
      );
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return null if ingredient to update stock is not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await ingredienteService.updateStock(99, 10);
      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE ingredientes SET cantidad_disponible = ? WHERE id = ?',
        [10, 99],
      );
    });

    it('should allow setting stock to 0 (boundary of >= 0)', async () => {
      const ingredienteId = 2;
      const newStock = 0;
      const updatedIngrediente = { ...createMockIngrediente(ingredienteId), cantidad_disponible: newStock };

      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockQuery.mockResolvedValueOnce([[updatedIngrediente]]);

      const result = await ingredienteService.updateStock(ingredienteId, newStock);

      expect(result).toEqual(updatedIngrediente);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'UPDATE ingredientes SET cantidad_disponible = ? WHERE id = ?',
        [newStock, ingredienteId],
      );
    });
  });

  describe('delete', () => {
    it('should soft delete an ingredient by setting activo to FALSE', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await ingredienteService.delete(1);
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE ingredientes SET activo = FALSE WHERE id = ?',
        [1],
      );
    });

    it('should return false if ingredient to delete is not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await ingredienteService.delete(99);
      expect(result).toBe(false);
    });
  });
});
