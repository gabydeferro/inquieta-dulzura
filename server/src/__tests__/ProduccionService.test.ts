import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProduccionService } from '../services/ProduccionService';
import { pool } from '../config/database';
import { CreateProduccionDTO, ProduccionResponse } from '../dtos/ProduccionDTO';
import { InsufficientIngredientStockError } from '../errors/InsufficientIngredientStockError';

// Mock database pool
vi.mock('../config/database', () => ({
  pool: {
    getConnection: vi.fn(),
    query: vi.fn(),
  },
}));

describe('ProduccionService', () => {
  let service: ProduccionService;
  const mockPoolQuery = pool.query as vi.Mock;
  const mockGetConnection = pool.getConnection as vi.Mock;

  // Mock connection with transaction methods
  const createMockConnection = () => {
    const conn = {
      beginTransaction: vi.fn(),
      execute: vi.fn(),
      query: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    };
    return conn;
  };

  beforeEach(() => {
    service = new ProduccionService();
    vi.clearAllMocks();
  });

  // Shared test data
  const recetaRow = { id: 1, nombre: 'Pan Francés' };

  const ingredienteRows = [
    {
      receta_id: 1,
      ingrediente_id: 1,
      cantidad: 500,
      unidad_medida: 'gramos',
      notas: null,
      nombre: 'Harina',
      cantidad_disponible: 10,
      unidad_medida_ingrediente: 'kg',
    },
    {
      receta_id: 1,
      ingrediente_id: 2,
      cantidad: 2,
      unidad_medida: 'unidades',
      notas: null,
      nombre: 'Huevos',
      cantidad_disponible: 24,
      unidad_medida_ingrediente: 'unidades',
    },
    {
      receta_id: 1,
      ingrediente_id: 3,
      cantidad: 10,
      unidad_medida: 'gramos',
      notas: null,
      nombre: 'Sal',
      cantidad_disponible: 500,
      unidad_medida_ingrediente: 'gramos',
    },
  ];

  const productoRecetaRow = { producto_id: 5, cantidad_receta: 1 };

  const stockRow = { producto_id: 5, cantidad_disponible: 0 };

  const defaultDTO: CreateProduccionDTO = {
    receta_id: 1,
    cantidad_producir: 2,
  };

  const mockSetup = (dto: CreateProduccionDTO = defaultDTO) => {
    // pool.query calls happen before getConnection
    mockPoolQuery
      // 1st: find recipe
      .mockResolvedValueOnce([[recetaRow]])
      // 2nd: find recipe ingredients
      .mockResolvedValueOnce([ingredienteRows])
      // 3rd: find linked products
      .mockResolvedValueOnce([[productoRecetaRow]]);
  };

  describe('producir', () => {
    it('should successfully produce and return a ProduccionResponse', async () => {
      const conn = createMockConnection();
      mockGetConnection.mockResolvedValue(conn);

      // Pre-transaction queries
      mockSetup();

      // transaction queries: FOR UPDATE ingredients + FOR UPDATE stock
      conn.execute
        // FOR UPDATE ingredients
        .mockResolvedValueOnce([ingredienteRows, []])
        // FOR UPDATE stock
        .mockResolvedValueOnce([[stockRow], []]);

      // UPDATE ingredientes (3 ingredients) — mysql2 returns [ResultSetHeader, FieldPacket[]]
      conn.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        // UPDATE stock
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        // INSERT produccion
        .mockResolvedValueOnce([{ insertId: 42 }, []]);

      const result = await service.producir(defaultDTO, 1);

      // Verify pre-transaction queries
      expect(mockPoolQuery).toHaveBeenNthCalledWith(1, 'SELECT * FROM recetas WHERE id = ?', [1]);
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('SELECT ri.*, i.nombre, i.cantidad_disponible, i.unidad_medida'),
        [1],
      );
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        3,
        'SELECT pr.producto_id, pr.cantidad_receta FROM producto_receta pr WHERE pr.receta_id = ?',
        [1],
      );

      // Verify transaction start
      expect(conn.beginTransaction).toHaveBeenCalledOnce();

      // Verify FOR UPDATE queries
      expect(conn.execute).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT * FROM receta_ingrediente WHERE receta_id = ? FOR UPDATE'),
        [1],
      );
      expect(conn.execute).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('SELECT * FROM stock WHERE producto_id = ? FOR UPDATE'),
        [5],
      );

      // Verify UPDATE ingredients
      expect(conn.query).toHaveBeenCalledWith(
        'UPDATE ingredientes SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?',
        expect.any(Array),
      );

      // Verify UPDATE stock
      expect(conn.query).toHaveBeenCalledWith(
        'UPDATE stock SET cantidad_disponible = cantidad_disponible + ? WHERE producto_id = ?',
        expect.any(Array),
      );

      // Verify INSERT produccion
      expect(conn.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO producciones'),
        expect.any(Array),
      );

      // Verify commit
      expect(conn.commit).toHaveBeenCalledOnce();

      // Verify result shape
      expect(result).toHaveProperty('id', 42);
      expect(result).toHaveProperty('receta_id', 1);
      expect(result).toHaveProperty('producto_id', 5);
      expect(result).toHaveProperty('cantidad_producida', 2);
      expect(result).toHaveProperty('tandas_ejecutadas', 2);
      expect(result).toHaveProperty('created_by', 1);
      expect(result).toHaveProperty('created_at');
    });

    it('should throw 404-like error when recipe not found', async () => {
      mockPoolQuery.mockResolvedValueOnce([[]]);

      await expect(service.producir(defaultDTO, 1)).rejects.toThrow('Receta no encontrada');
      expect(mockGetConnection).not.toHaveBeenCalled();
    });

    it('should throw 400-like error when recipe has no linked products', async () => {
      mockPoolQuery
        .mockResolvedValueOnce([[recetaRow]])
        .mockResolvedValueOnce([ingredienteRows])
        .mockResolvedValueOnce([[]]); // empty products

      await expect(service.producir(defaultDTO, 1)).rejects.toThrow(
        'Receta sin producto vinculado',
      );
      expect(mockGetConnection).not.toHaveBeenCalled();
    });

    it('should throw 409-like error when recipe has multiple linked products', async () => {
      mockPoolQuery
        .mockResolvedValueOnce([[recetaRow]])
        .mockResolvedValueOnce([ingredienteRows])
        .mockResolvedValueOnce([
          [
            { producto_id: 5, cantidad_receta: 1 },
            { producto_id: 6, cantidad_receta: 1 },
          ],
        ]);

      await expect(service.producir(defaultDTO, 1)).rejects.toThrow(
        'La receta está vinculada a múltiples productos',
      );
      expect(mockGetConnection).not.toHaveBeenCalled();
    });

    it('should throw InsufficientIngredientStockError when stock is insufficient', async () => {
      const conn = createMockConnection();
      mockGetConnection.mockResolvedValue(conn);

      // Ingredient with insufficient stock: Harina needs 1000 gramos (1kg) but has 0.5 kg
      const lowStockIngredientes = [
        {
          receta_id: 1,
          ingrediente_id: 1,
          cantidad: 1000,
          unidad_medida: 'gramos',
          notas: null,
          nombre: 'Harina',
          cantidad_disponible: 0.5,
          unidad_medida_ingrediente: 'kg',
        },
      ];

      mockPoolQuery
        .mockResolvedValueOnce([[recetaRow]])
        .mockResolvedValueOnce([lowStockIngredientes])
        .mockResolvedValueOnce([[productoRecetaRow]]);

      conn.execute
        .mockResolvedValueOnce([lowStockIngredientes, []])
        .mockResolvedValueOnce([[stockRow], []]);

      await expect(service.producir(defaultDTO, 1)).rejects.toThrow(
        InsufficientIngredientStockError,
      );

      // Verify rollback was called
      expect(conn.rollback).toHaveBeenCalled();
      expect(conn.commit).not.toHaveBeenCalled();
    });

    it('should throw error when units are incompatible', async () => {
      const conn = createMockConnection();
      mockGetConnection.mockResolvedValue(conn);

      // Ingredient with incompatible unit: receta says ml but ingrediente uses kg
      const incompatibleIngredientes = [
        {
          receta_id: 1,
          ingrediente_id: 1,
          cantidad: 500,
          unidad_medida: 'ml',
          notas: null,
          nombre: 'Leche',
          cantidad_disponible: 10,
          unidad_medida_ingrediente: 'kg', // mass vs volume = incompatible
        },
      ];

      mockPoolQuery
        .mockResolvedValueOnce([[recetaRow]])
        .mockResolvedValueOnce([incompatibleIngredientes])
        .mockResolvedValueOnce([[productoRecetaRow]]);

      conn.execute
        .mockResolvedValueOnce([incompatibleIngredientes, []])
        .mockResolvedValueOnce([[stockRow], []]);

      await expect(service.producir(defaultDTO, 1)).rejects.toThrow('Unidades incompatibles');

      expect(conn.rollback).toHaveBeenCalled();
    });

    it('should handle errors during transaction and rollback', async () => {
      const conn = createMockConnection();
      mockGetConnection.mockResolvedValue(conn);

      mockSetup();
      conn.execute
        .mockResolvedValueOnce([ingredienteRows, []])
        .mockResolvedValueOnce([[stockRow], []]);
      conn.query.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.producir(defaultDTO, 1)).rejects.toThrow('DB error');
      expect(conn.rollback).toHaveBeenCalled();
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
    });

    it('should verify stock for same-unit ingredient correctly', async () => {
      const conn = createMockConnection();
      mockGetConnection.mockResolvedValue(conn);

      // Same unit — no conversion needed
      const sameUnitIngredientes = [
        {
          receta_id: 1,
          ingrediente_id: 1,
          cantidad: 3,
          unidad_medida: 'kg',
          notas: null,
          nombre: 'Harina',
          cantidad_disponible: 10,
          unidad_medida_ingrediente: 'kg',
        },
      ];

      mockPoolQuery
        .mockResolvedValueOnce([[recetaRow]])
        .mockResolvedValueOnce([sameUnitIngredientes])
        .mockResolvedValueOnce([[productoRecetaRow]]);

      conn.execute
        .mockResolvedValueOnce([sameUnitIngredientes, []])
        .mockResolvedValueOnce([[stockRow], []]);
      conn.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ insertId: 43 }, []]);

      const result = await service.producir({ receta_id: 1, cantidad_producir: 2 }, 1);

      expect(result.id).toBe(43);
      expect(result.tandas_ejecutadas).toBe(2);
      expect(conn.commit).toHaveBeenCalled();
    });

    it('should pass userId as created_by in the insert', async () => {
      const conn = createMockConnection();
      mockGetConnection.mockResolvedValue(conn);

      mockSetup();
      conn.execute
        .mockResolvedValueOnce([ingredienteRows, []])
        .mockResolvedValueOnce([[stockRow], []]);
      conn.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ insertId: 99 }, []]);

      const result = await service.producir(defaultDTO, 7);

      expect(result.created_by).toBe(7);
      expect(result.id).toBe(99);
    });

    it('should recalculate when cantidad_receta is not 1', async () => {
      const conn = createMockConnection();
      mockGetConnection.mockResolvedValue(conn);

      // cantidad_receta = 0.5 means half a recipe batch per product unit
      const halfBatchProducto = { producto_id: 5, cantidad_receta: 0.5 };

      mockPoolQuery
        .mockResolvedValueOnce([[recetaRow]])
        .mockResolvedValueOnce([ingredienteRows])
        .mockResolvedValueOnce([[halfBatchProducto]]);

      conn.execute
        .mockResolvedValueOnce([ingredienteRows, []])
        .mockResolvedValueOnce([[stockRow], []]);
      conn.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ insertId: 50 }, []]);

      // cantidad_producir=4, cantidad_receta=0.5 → tandas = 4*0.5 = 2
      const result = await service.producir({ receta_id: 1, cantidad_producir: 4 }, 1);

      expect(result.tandas_ejecutadas).toBe(2);
      expect(result.cantidad_producida).toBe(4);
    });
  });
});
