import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getRecetas } from '../controllers/RecetasController';
import { RecetaService } from '../services/RecetaService';

// Mock helpers using vi.hoisted (vitest hoisting-safe)
const { mockGetAll } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
}));

vi.mock('../services/RecetaService', () => ({
  RecetaService: class MockRecetaService {
    getAll = mockGetAll;
  },
}));

const mockRecetaService = new RecetaService() as any;

describe('RecetasController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: vi.Mock;
  let mockJson: vi.Mock;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn(() => ({ json: mockJson }));
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    vi.clearAllMocks();
  });

  describe('getRecetas', () => {
    it('should return all recetas with status 200', async () => {
      const mockRecetas = [{ id: 1, nombre: 'Torta de Chocolate' }];
      (mockRecetaService.getAll as vi.Mock).mockResolvedValue(mockRecetas);

      await getRecetas(mockRequest as Request, mockResponse as Response);

      expect(mockRecetaService.getAll).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(mockRecetas);
    });

    it('should return 500 with unified error format', async () => {
      (mockRecetaService.getAll as vi.Mock).mockRejectedValue(new Error('DB error'));

      await getRecetas(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
    });
  });
});
