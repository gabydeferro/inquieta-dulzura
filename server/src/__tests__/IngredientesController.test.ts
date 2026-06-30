import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import {
  getAllIngredientes,
  getIngredienteById,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
} from '../controllers/IngredientesController';
import { IngredienteService } from '../services/IngredienteService';

// Mock helpers using vi.hoisted (vitest >= 2.x)
const { mockGetAll, mockGetById, mockCreate, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockGetById: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('../services/IngredienteService', () => ({
  IngredienteService: class MockIngredienteService {
    getAll = mockGetAll;
    getById = mockGetById;
    create = mockCreate;
    update = mockUpdate;
    delete = mockDelete;
  },
}));

const mockIngredienteService = new IngredienteService() as any;

describe('IngredientesController', () => {
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

  const mockIngredientes = [
    {
      id: 1,
      nombre: 'Harina',
      descripcion: 'Harina de trigo',
      unidad_medida: 'kg',
      costo_unitario: 1.2,
      activo: true,
    },
    {
      id: 2,
      nombre: 'Azucar',
      descripcion: 'Azucar refinada',
      unidad_medida: 'kg',
      costo_unitario: 0.8,
      activo: true,
    },
  ];

  describe('getAllIngredientes', () => {
    it('should return all ingredients with status 200', async () => {
      (mockIngredienteService.getAll as vi.Mock).mockResolvedValue(mockIngredientes);

      await getAllIngredientes(mockRequest as Request, mockResponse as Response);

      expect(mockIngredienteService.getAll).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(mockIngredientes);
    });

    it('should return 500 with unified error format', async () => {
      (mockIngredienteService.getAll as vi.Mock).mockRejectedValue(new Error('DB error'));

      await getAllIngredientes(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
    });
  });

  describe('getIngredienteById', () => {
    it('should return an ingredient by ID with status 200', async () => {
      const ingrediente = mockIngredientes[0];
      mockRequest.params = { id: '1' };
      (mockIngredienteService.getById as vi.Mock).mockResolvedValue(ingrediente);

      await getIngredienteById(mockRequest as Request, mockResponse as Response);

      expect(mockIngredienteService.getById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith(ingrediente);
    });

    it('should return 404 with unified error format', async () => {
      mockRequest.params = { id: '99' };
      (mockIngredienteService.getById as vi.Mock).mockResolvedValue(null);

      await getIngredienteById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Ingrediente not found',
      });
    });

    it('should return 500 with unified error format', async () => {
      mockRequest.params = { id: '1' };
      (mockIngredienteService.getById as vi.Mock).mockRejectedValue(new Error('DB error'));

      await getIngredienteById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
    });
  });

  describe('createIngrediente', () => {
    it('should create a new ingredient and return it with status 201', async () => {
      const newIngrediente = {
        nombre: 'Sal',
        descripcion: 'Sal de mesa',
        unidad_medida: 'kg',
        costo_unitario: 0.5,
        activo: true,
      };
      const createdIngrediente = { id: 3, ...newIngrediente };
      mockRequest.body = newIngrediente;
      (mockIngredienteService.create as vi.Mock).mockResolvedValue(createdIngrediente);

      await createIngrediente(mockRequest as Request, mockResponse as Response);

      expect(mockIngredienteService.create).toHaveBeenCalledWith(newIngrediente);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(createdIngrediente);
    });

    it('should return 500 with unified error format', async () => {
      mockRequest.body = { nombre: 'Sal' };
      (mockIngredienteService.create as vi.Mock).mockRejectedValue(new Error('DB error'));

      await createIngrediente(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
    });
  });

  describe('updateIngrediente', () => {
    it('should update an existing ingredient and return it with status 200', async () => {
      const updatedData = { costo_unitario: 1.0 };
      const updatedIngrediente = { ...mockIngredientes[0], ...updatedData };
      mockRequest.params = { id: '1' };
      mockRequest.body = updatedData;
      (mockIngredienteService.update as vi.Mock).mockResolvedValue(updatedIngrediente);

      await updateIngrediente(mockRequest as Request, mockResponse as Response);

      expect(mockIngredienteService.update).toHaveBeenCalledWith(1, updatedData);
      expect(mockJson).toHaveBeenCalledWith(updatedIngrediente);
    });

    it('should return 404 with unified error format', async () => {
      mockRequest.params = { id: '99' };
      mockRequest.body = { nombre: 'Non Existent' };
      (mockIngredienteService.update as vi.Mock).mockResolvedValue(null);

      await updateIngrediente(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Ingrediente not found',
      });
    });

    it('should return 500 with unified error format', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { nombre: 'Updated' };
      (mockIngredienteService.update as vi.Mock).mockRejectedValue(new Error('DB error'));

      await updateIngrediente(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
    });
  });

  describe('deleteIngrediente', () => {
    it('should delete an ingredient and return status 204', async () => {
      mockRequest.params = { id: '1' };
      (mockIngredienteService.delete as vi.Mock).mockResolvedValue(true);

      await deleteIngrediente(mockRequest as Request, mockResponse as Response);

      expect(mockIngredienteService.delete).toHaveBeenCalledWith(1);
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return 404 with unified error format', async () => {
      mockRequest.params = { id: '99' };
      (mockIngredienteService.delete as vi.Mock).mockResolvedValue(false);

      await deleteIngrediente(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Ingrediente not found',
      });
    });

    it('should return 500 with unified error format', async () => {
      mockRequest.params = { id: '1' };
      (mockIngredienteService.delete as vi.Mock).mockRejectedValue(new Error('DB error'));

      await deleteIngrediente(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
    });
  });
});
