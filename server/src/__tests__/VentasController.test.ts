import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getVentas, createVenta } from '../controllers/VentasController';
import { VentasService } from '../services/VentasService';

const { mockGetVentas, mockCreateVenta } = vi.hoisted(() => ({
  mockGetVentas: vi.fn(),
  mockCreateVenta: vi.fn(),
}));

vi.mock('../services/VentasService', () => ({
  VentasService: class MockVentasService {
    getVentas = mockGetVentas;
    createVenta = mockCreateVenta;
  },
}));

// Trigger singleton instantiation via module import
new VentasService();

describe('VentasController', () => {
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

  describe('getVentas', () => {
    it('should return ventas with status 200', async () => {
      const mockVentas = [{ id: 1, total: 100, productos: [] }];
      mockGetVentas.mockResolvedValue(mockVentas);

      await getVentas(mockRequest as Request, mockResponse as Response);

      expect(mockGetVentas).toHaveBeenCalledOnce();
      expect(mockJson).toHaveBeenCalledWith(mockVentas);
    });

    it('should return 500 with unified error format', async () => {
      mockGetVentas.mockRejectedValue(new Error('DB error'));

      await getVentas(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
    });
  });

  describe('createVenta', () => {
    it('should create venta and return status 201', async () => {
      const createdVenta = { id: 1, total: 50, productos: [] };
      mockRequest.body = { metodo_pago: 'efectivo', productos: [{ producto_id: 1, cantidad: 2, precio_unitario: 25, subtotal: 50 }] };
      mockCreateVenta.mockResolvedValue(createdVenta);

      await createVenta(mockRequest as Request, mockResponse as Response);

      expect(mockCreateVenta).toHaveBeenCalledWith(mockRequest.body);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(createdVenta);
    });

    it('should return 500 on service error', async () => {
      mockRequest.body = { metodo_pago: 'efectivo', productos: [] };
      mockCreateVenta.mockRejectedValue(new Error('FK violation'));

      await createVenta(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'FK violation',
      });
    });
  });
});
