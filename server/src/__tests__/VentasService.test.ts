import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VentasService } from '../services/VentasService';
import { pool } from '../config/database';

vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
}));

describe('VentasService', () => {
  let ventasService: VentasService;
  const mockQuery = pool.query as vi.Mock;
  const mockGetConnection = pool.getConnection as vi.Mock;

  beforeEach(() => {
    ventasService = new VentasService();
    mockQuery.mockReset();
    mockGetConnection.mockReset();
  });

  describe('getVentas', () => {
    it('should return ventas with productos aggregated from single JOIN', async () => {
      const mockJoinedRows = [
        {
          venta_id: 1, cliente_id: null, fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100, descuento: 10, impuestos: 0, total: 90,
          metodo_pago: 'efectivo', estado: 'completada', notas: '',
          cliente_nombre: null,
          detalle_id: 1, producto_id: 1, cantidad: 2, precio_unitario: 25,
          detalle_subtotal: 50, detalle_descuento: 0, detalle_total: 50,
          producto_nombre: 'Torta de Chocolate',
        },
        {
          venta_id: 1, cliente_id: null, fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100, descuento: 10, impuestos: 0, total: 90,
          metodo_pago: 'efectivo', estado: 'completada', notas: '',
          cliente_nombre: null,
          detalle_id: 2, producto_id: 3, cantidad: 1, precio_unitario: 50,
          detalle_subtotal: 50, detalle_descuento: 0, detalle_total: 50,
          producto_nombre: 'Galletas de Avena',
        },
      ];
      mockQuery.mockResolvedValueOnce([mockJoinedRows]);

      const result = await ventasService.getVentas();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].total).toBe(90);
      expect(result[0].productos).toHaveLength(2);
      expect(result[0].productos[0].producto_nombre).toBe('Torta de Chocolate');
      expect(result[0].productos[1].producto_nombre).toBe('Galletas de Avena');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no ventas exist', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await ventasService.getVentas();

      expect(result).toEqual([]);
    });
  });

  describe('createVenta', () => {
    it('should insert venta and detalles in a transaction and return created venta', async () => {
      const mockConn = {
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        query: vi.fn(),
      };
      mockGetConnection.mockResolvedValue(mockConn);
      // INSERT ventas
      mockConn.query.mockResolvedValueOnce([{ insertId: 1 }]);
      // INSERT detalle #1
      mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // INSERT detalle #2
      mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // After commit: fetch query returns the created venta with detalles
      const mockVentaRows = [
        {
          venta_id: 1, cliente_id: null, fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100, descuento: 5, impuestos: 0, total: 95,
          metodo_pago: 'tarjeta', estado: 'completada', notas: '',
          cliente_nombre: null,
          detalle_id: 1, producto_id: 1, cantidad: 2, precio_unitario: 25,
          detalle_subtotal: 50, detalle_descuento: 0, detalle_total: 50,
          producto_nombre: 'Torta de Chocolate',
        },
        {
          venta_id: 1, cliente_id: null, fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100, descuento: 5, impuestos: 0, total: 95,
          metodo_pago: 'tarjeta', estado: 'completada', notas: '',
          cliente_nombre: null,
          detalle_id: 2, producto_id: 2, cantidad: 1, precio_unitario: 50,
          detalle_subtotal: 50, detalle_descuento: 0, detalle_total: 50,
          producto_nombre: 'Pan Integral',
        },
      ];
      mockQuery.mockResolvedValueOnce([mockVentaRows]);

      const result = await ventasService.createVenta({
        metodo_pago: 'tarjeta',
        descuento: 5,
        productos: [
          { producto_id: 1, cantidad: 2, precio_unitario: 25, subtotal: 50 },
          { producto_id: 2, cantidad: 1, precio_unitario: 50, subtotal: 50 },
        ],
      });

      expect(mockConn.beginTransaction).toHaveBeenCalledOnce();
      expect(mockConn.commit).toHaveBeenCalledOnce();
      expect(mockConn.release).toHaveBeenCalledOnce();
      expect(mockConn.rollback).not.toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.total).toBe(95);
      expect(result.productos).toHaveLength(2);
    });

    it('should rollback transaction and throw on detalle INSERT failure', async () => {
      const mockConn = {
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        query: vi.fn(),
      };
      mockGetConnection.mockResolvedValue(mockConn);
      // INSERT ventas succeeds
      mockConn.query.mockResolvedValueOnce([{ insertId: 1 }]);
      // INSERT detalle fails
      mockConn.query.mockRejectedValueOnce(new Error('FK violation'));

      await expect(ventasService.createVenta({
        metodo_pago: 'efectivo',
        productos: [
          { producto_id: 999, cantidad: 1, precio_unitario: 10, subtotal: 10 },
        ],
      })).rejects.toThrow('FK violation');

      expect(mockConn.beginTransaction).toHaveBeenCalledOnce();
      expect(mockConn.rollback).toHaveBeenCalledOnce();
      expect(mockConn.release).toHaveBeenCalledOnce();
      expect(mockConn.commit).not.toHaveBeenCalled();
    });
  });
});
