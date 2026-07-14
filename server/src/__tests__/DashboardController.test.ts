import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getDashboardStats } from '../controllers/DashboardController';
import { DashboardService } from '../services/DashboardService';

const { mockGetStats } = vi.hoisted(() => ({
  mockGetStats: vi.fn(),
}));

vi.mock('../services/DashboardService', () => ({
  DashboardService: class MockDashboardService {
    getStats = mockGetStats;
  },
}));

describe('DashboardController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: vi.Mock;
  let mockJson: vi.Mock;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn(() => ({ json: mockJson }));
    mockRequest = {};
    mockResponse = { status: mockStatus, json: mockJson };
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats with status 200', async () => {
      const mockStats = {
        ventasHoy: { cantidad: 5, total: 1500 },
        ventasSemana: { cantidad: 20, total: 6000 },
        ventasMes: { cantidad: 100, total: 30000 },
        ingresosMes: 30000,
        totalIngresos: 50000,
        totalVentas: 200,
        totalClientes: 50,
        productosActivos: 30,
        categoriasCount: 8,
        ingredientesCount: 25,
        recetasCount: 15,
        ventasPorDia: [],
        metodosPago: [],
        topProductos: [],
        stockBajo: [],
        stockBajoCount: 0,
        partial_failures: [],
      };
      mockGetStats.mockResolvedValue(mockStats);

      await getDashboardStats(mockRequest as Request, mockResponse as Response);

      expect(mockGetStats).toHaveBeenCalledOnce();
      expect(mockJson).toHaveBeenCalledWith(mockStats);
    });

    it('should return 500 with error message on service failure', async () => {
      mockGetStats.mockRejectedValue(new Error('Database connection failed'));

      await getDashboardStats(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
    });

    it('should return 500 with generic message on unknown error', async () => {
      mockGetStats.mockRejectedValue('unknown error');

      await getDashboardStats(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to load dashboard data',
      });
    });
  });
});