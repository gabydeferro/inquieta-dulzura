import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { InsufficientIngredientStockError } from '../errors/InsufficientIngredientStockError';
import { IncompatibleUnitsError } from '../errors/IncompatibleUnitsError';
import {
  producir,
  listar,
} from '../controllers/ProduccionController';

// Mock helpers using vi.hoisted
const { mockProducir, mockListar } = vi.hoisted(() => ({
  mockProducir: vi.fn(),
  mockListar: vi.fn(),
}));

vi.mock('../services/ProduccionService', () => ({
  ProduccionService: class MockProduccionService {
    producir = mockProducir;
    listar = mockListar;
  },
}));

import { ProduccionService } from '../services/ProduccionService';
const mockService = new ProduccionService() as any;

describe('ProduccionController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: vi.Mock;
  let mockJson: vi.Mock;
  let mockSend: vi.Mock;

  beforeEach(() => {
    mockJson = vi.fn();
    mockSend = vi.fn();
    mockStatus = vi.fn(() => ({ json: mockJson, send: mockSend }));

    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
      send: mockSend,
    };

    vi.clearAllMocks();
  });

  const mockProduccionResponse = {
    id: 42,
    receta_id: 1,
    producto_id: 5,
    cantidad_producida: 2,
    tandas_ejecutadas: 2,
    ingredientes_consumidos: [
      { ingrediente_id: 1, nombre: 'Harina', cantidad_consumida: 1000 },
    ],
    created_by: 1,
    created_at: new Date('2026-07-29'),
  };

  describe('producir', () => {
    it('should return 201 with the created production record', async () => {
      mockRequest.body = { receta_id: 1, cantidad_producir: 2 };
      mockRequest.user = { userId: 1, email: 'admin@test.com', rol: 'admin' };
      mockProducir.mockResolvedValue(mockProduccionResponse);

      await producir(mockRequest as Request, mockResponse as Response);

      expect(mockProducir).toHaveBeenCalledWith(
        { receta_id: 1, cantidad_producir: 2 },
        1,
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockProduccionResponse);
    });

    it('should return 400 for insufficient stock error', async () => {
      mockRequest.body = { receta_id: 1, cantidad_producir: 2 };
      mockRequest.user = { userId: 1, email: 'admin@test.com', rol: 'admin' };

      const stockError = new InsufficientIngredientStockError(1, 'Harina', 2, 5);
      mockProducir.mockRejectedValue(stockError);

      await producir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Stock insuficiente para "Harina": disponible 2, requerido 5',
        details: [{ ingrediente: 'Harina', disponible: 2, requerido: 5 }],
      });
    });

    it('should return 400 for incompatible units error', async () => {
      mockRequest.body = { receta_id: 1, cantidad_producir: 2 };
      mockRequest.user = { userId: 1, email: 'admin@test.com', rol: 'admin' };

      const unitError = new IncompatibleUnitsError('gramos', 'litros');
      mockProducir.mockRejectedValue(unitError);

      await producir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Unidades incompatibles: gramos → litros',
      });
    });

    it('should return 404 when recipe is not found', async () => {
      mockRequest.body = { receta_id: 99, cantidad_producir: 2 };
      mockRequest.user = { userId: 1, email: 'admin@test.com', rol: 'admin' };
      mockProducir.mockRejectedValue(new Error('Receta no encontrada'));

      await producir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Receta no encontrada',
      });
    });

    it('should return 404 when recipe has no linked product', async () => {
      mockRequest.body = { receta_id: 1, cantidad_producir: 2 };
      mockRequest.user = { userId: 1, email: 'admin@test.com', rol: 'admin' };
      mockProducir.mockRejectedValue(new Error('Receta sin producto vinculado'));

      await producir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Receta sin producto vinculado',
      });
    });

    it('should return 409 when recipe has multiple linked products', async () => {
      mockRequest.body = { receta_id: 1, cantidad_producir: 2 };
      mockRequest.user = { userId: 1, email: 'admin@test.com', rol: 'admin' };
      mockProducir.mockRejectedValue(
        new Error('La receta está vinculada a múltiples productos'),
      );

      await producir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'La receta está vinculada a múltiples productos',
      });
    });

    it('should return 500 for unknown errors', async () => {
      mockRequest.body = { receta_id: 1, cantidad_producir: 2 };
      mockRequest.user = { userId: 1, email: 'admin@test.com', rol: 'admin' };
      mockProducir.mockRejectedValue(new Error('Unknown DB error'));

      await producir(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown DB error',
      });
    });
  });

  describe('listar', () => {
    it('should return paginated production records with defaults', async () => {
      const mockResult = {
        data: [mockProduccionResponse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockRequest.query = {};
      mockListar.mockResolvedValue(mockResult);

      await listar(mockRequest as Request, mockResponse as Response);

      expect(mockListar).toHaveBeenCalledWith(1, 20);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should pass query page and limit to service', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      };
      mockRequest.query = { page: '2', limit: '10' };
      mockListar.mockResolvedValue(mockResult);

      await listar(mockRequest as Request, mockResponse as Response);

      expect(mockListar).toHaveBeenCalledWith(2, 10);
      expect(mockJson).toHaveBeenCalledWith(mockResult);
    });

    it('should return 500 on service error', async () => {
      mockRequest.query = {};
      mockListar.mockRejectedValue(new Error('DB error'));

      await listar(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
    });
  });
});
