import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VentasService } from '../services/VentasService';
import { pool } from '../config/database';
import { InsufficientStockError } from '../errors/InsufficientStockError';

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
          venta_id: 1,
          cliente_id: null,
          fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100,
          descuento: 10,
          impuestos: 0,
          total: 90,
          metodo_pago: 'efectivo',
          estado: 'completada',
          notas: '',
          cliente_nombre: null,
          detalle_id: 1,
          producto_id: 1,
          cantidad: 2,
          precio_unitario: 25,
          detalle_subtotal: 50,
          detalle_descuento: 0,
          detalle_total: 50,
          producto_nombre: 'Torta de Chocolate',
        },
        {
          venta_id: 1,
          cliente_id: null,
          fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100,
          descuento: 10,
          impuestos: 0,
          total: 90,
          metodo_pago: 'efectivo',
          estado: 'completada',
          notas: '',
          cliente_nombre: null,
          detalle_id: 2,
          producto_id: 3,
          cantidad: 1,
          precio_unitario: 50,
          detalle_subtotal: 50,
          detalle_descuento: 0,
          detalle_total: 50,
          producto_nombre: 'Galletas de Avena',
        },
      ];
      mockQuery.mockResolvedValueOnce([mockJoinedRows]);
      // getVentas now also fetches pagos — no pagos for this venta
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await ventasService.getVentas();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].total).toBe(90);
      expect(result[0].productos).toHaveLength(2);
      expect(result[0].productos[0].producto_nombre).toBe('Torta de Chocolate');
      expect(result[0].productos[1].producto_nombre).toBe('Galletas de Avena');
      expect(result[0].pagos).toEqual([]);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no ventas exist', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await ventasService.getVentas();

      expect(result).toEqual([]);
    });

    it('should include pagos array when ventas have associated payments (getVentas list)', async () => {
      const mockJoinedRows = [
        {
          venta_id: 1,
          cliente_id: null,
          fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100,
          descuento: 10,
          impuestos: 0,
          total: 90,
          metodo_pago: 'efectivo',
          estado: 'completada',
          notas: '',
          cliente_nombre: null,
          detalle_id: 1,
          producto_id: 1,
          cantidad: 2,
          precio_unitario: 25,
          detalle_subtotal: 50,
          detalle_descuento: 0,
          detalle_total: 50,
          producto_nombre: 'Torta de Chocolate',
        },
      ];
      const mockPagoRows = [
        {
          id: 1,
          venta_id: 1,
          metodo_pago: 'efectivo',
          monto: 90,
          referencia_externa: null,
          estado: 'aprobado',
          datos_json: null,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      ];
      mockQuery.mockResolvedValueOnce([mockJoinedRows]);
      mockQuery.mockResolvedValueOnce([mockPagoRows]);

      const result = await ventasService.getVentas();

      expect(result).toHaveLength(1);
      expect(result[0].pagos).toBeDefined();
      expect(result[0].pagos).toHaveLength(1);
      expect(result[0].pagos![0].metodo_pago).toBe('efectivo');
      expect(result[0].pagos![0].monto).toBe(90);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('createVenta', () => {
    it('should validate stock via SELECT FOR UPDATE, insert pagos, and return created venta', async () => {
      const mockConn = {
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        query: vi.fn(),
      };
      mockGetConnection.mockResolvedValue(mockConn);
      // Stock check #1 — sufficient
      mockConn.query.mockResolvedValueOnce([[{ cantidad_disponible: 10 }]]);
      // Stock check #2 — sufficient
      mockConn.query.mockResolvedValueOnce([[{ cantidad_disponible: 5 }]]);
      // INSERT ventas
      mockConn.query.mockResolvedValueOnce([{ insertId: 1 }]);
      // INSERT detalle #1
      mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // INSERT detalle #2
      mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // INSERT pago
      mockConn.query.mockResolvedValueOnce([{ insertId: 10 }]);
      // After commit: fetch query returns the created venta with detalles
      const mockVentaRows = [
        {
          venta_id: 1,
          cliente_id: null,
          fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100,
          descuento: 5,
          impuestos: 0,
          total: 95,
          metodo_pago: 'tarjeta',
          estado: 'completada',
          notas: '',
          cliente_nombre: null,
          detalle_id: 1,
          producto_id: 1,
          cantidad: 2,
          precio_unitario: 25,
          detalle_subtotal: 50,
          detalle_descuento: 0,
          detalle_total: 50,
          producto_nombre: 'Torta de Chocolate',
        },
        {
          venta_id: 1,
          cliente_id: null,
          fecha_venta: '2024-01-01T00:00:00.000Z',
          subtotal: 100,
          descuento: 5,
          impuestos: 0,
          total: 95,
          metodo_pago: 'tarjeta',
          estado: 'completada',
          notas: '',
          cliente_nombre: null,
          detalle_id: 2,
          producto_id: 2,
          cantidad: 1,
          precio_unitario: 50,
          detalle_subtotal: 50,
          detalle_descuento: 0,
          detalle_total: 50,
          producto_nombre: 'Pan Integral',
        },
      ];
      mockQuery.mockResolvedValueOnce([mockVentaRows]);
      // Fetch pagos for the created venta
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await ventasService.createVenta({
        metodo_pago: 'tarjeta',
        descuento: 5,
        productos: [
          { producto_id: 1, cantidad: 2, precio_unitario: 25, subtotal: 50 },
          { producto_id: 2, cantidad: 1, precio_unitario: 50, subtotal: 50 },
        ],
      });

      expect(mockConn.beginTransaction).toHaveBeenCalledOnce();
      // 2 stock checks + 1 INSERT ventas + 2 INSERT detalles + 1 INSERT pago
      expect(mockConn.query).toHaveBeenCalledTimes(6);
      // First stock check uses FOR UPDATE
      expect(mockConn.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('FOR UPDATE'),
        [1],
      );
      expect(mockConn.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('FOR UPDATE'),
        [2],
      );
      // Pagos insert happens inside the transaction
      expect(mockConn.query).toHaveBeenNthCalledWith(
        6,
        expect.stringContaining('INSERT INTO pagos'),
        [1, 'tarjeta', 95, 'aprobado', null, null],
      );
      expect(mockConn.commit).toHaveBeenCalledOnce();
      expect(mockConn.release).toHaveBeenCalledOnce();
      expect(mockConn.rollback).not.toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.total).toBe(95);
      expect(result.productos).toHaveLength(2);
    });

    it('should throw InsufficientStockError when stock is insufficient for a product', async () => {
      const mockConn = {
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        query: vi.fn(),
      };
      mockGetConnection.mockResolvedValue(mockConn);
      // Stock check — insufficient (requested 5, only 2 available)
      mockConn.query.mockResolvedValueOnce([[{ cantidad_disponible: 2 }]]);

      await expect(
        ventasService.createVenta({
          metodo_pago: 'efectivo',
          productos: [{ producto_id: 1, cantidad: 5, precio_unitario: 25, subtotal: 125 }],
        }),
      ).rejects.toThrow(InsufficientStockError);

      expect(mockConn.beginTransaction).toHaveBeenCalledOnce();
      expect(mockConn.rollback).toHaveBeenCalledOnce();
      expect(mockConn.commit).not.toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalledOnce();
    });

    it('should throw InsufficientStockError when product has no stock row', async () => {
      const mockConn = {
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        query: vi.fn(),
      };
      mockGetConnection.mockResolvedValue(mockConn);
      // Stock check — no row returned for this product
      mockConn.query.mockResolvedValueOnce([[]]);

      await expect(
        ventasService.createVenta({
          metodo_pago: 'efectivo',
          productos: [{ producto_id: 999, cantidad: 1, precio_unitario: 10, subtotal: 10 }],
        }),
      ).rejects.toThrow(InsufficientStockError);
    });

    it('should rollback transaction and throw on detalle INSERT failure after stock checks', async () => {
      const mockConn = {
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        query: vi.fn(),
      };
      mockGetConnection.mockResolvedValue(mockConn);
      // Stock check passes
      mockConn.query.mockResolvedValueOnce([[{ cantidad_disponible: 10 }]]);
      // INSERT ventas succeeds
      mockConn.query.mockResolvedValueOnce([{ insertId: 1 }]);
      // INSERT detalle fails
      mockConn.query.mockRejectedValueOnce(new Error('FK violation'));

      await expect(
        ventasService.createVenta({
          metodo_pago: 'efectivo',
          productos: [{ producto_id: 999, cantidad: 1, precio_unitario: 10, subtotal: 10 }],
        }),
      ).rejects.toThrow('FK violation');

      expect(mockConn.beginTransaction).toHaveBeenCalledOnce();
      expect(mockConn.rollback).toHaveBeenCalledOnce();
      expect(mockConn.release).toHaveBeenCalledOnce();
      expect(mockConn.commit).not.toHaveBeenCalled();
    });
  });
});
