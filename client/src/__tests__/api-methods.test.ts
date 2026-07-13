import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    searchProductos: async (query: string) =>
      mockGet('/productos/search', { params: { q: query } }),
    createPago: async (ventaId: number, data: Record<string, unknown>) =>
      mockPost(`/ventas/${ventaId}/pagos`, data),
  },
}));

import api from '../services/api';

describe('API search and pago methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchProductos', () => {
    it('calls GET /productos/search with query parameter', async () => {
      const mockResults = [
        { id: 1, nombre: 'Torta Red Velvet', precio: 5000, stock: 10 },
      ];
      mockGet.mockResolvedValueOnce({ data: mockResults });

      const result = await api.searchProductos('torta');

      expect(mockGet).toHaveBeenCalledWith('/productos/search', {
        params: { q: 'torta' },
      });
      expect(result.data).toEqual(mockResults);
    });

    it('returns empty array when no products match', async () => {
      mockGet.mockResolvedValueOnce({ data: [] });

      const result = await api.searchProductos('xyz123');

      expect(mockGet).toHaveBeenCalledWith('/productos/search', {
        params: { q: 'xyz123' },
      });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('createPago', () => {
    it('calls POST /ventas/:id/pagos with payment data', async () => {
      const mockPago = {
        id: 1,
        venta_id: 5,
        metodo_pago: 'efectivo',
        monto: 14000,
        estado: 'aprobado',
      };
      mockPost.mockResolvedValueOnce({ data: mockPago });

      const result = await api.createPago(5, {
        metodo_pago: 'efectivo',
        monto: 14000,
      });

      expect(mockPost).toHaveBeenCalledWith('/ventas/5/pagos', {
        metodo_pago: 'efectivo',
        monto: 14000,
      });
      expect(result.data).toEqual(mockPago);
    });

    it('sends optional referencia_externa when provided', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      await api.createPago(3, {
        metodo_pago: 'mercado_pago',
        monto: 5000,
        referencia_externa: 'MP-12345',
        datos_json: { status: 'approved' },
      });

      expect(mockPost).toHaveBeenCalledWith('/ventas/3/pagos', {
        metodo_pago: 'mercado_pago',
        monto: 5000,
        referencia_externa: 'MP-12345',
        datos_json: { status: 'approved' },
      });
    });
  });
});
