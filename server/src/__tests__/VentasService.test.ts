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
      // 2 stock checks + 1 INSERT ventas + 2 INSERT detalles + 2 stock decrements + 1 INSERT pago
      expect(mockConn.query).toHaveBeenCalledTimes(8);
      // First stock check uses FOR UPDATE
      expect(mockConn.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FOR UPDATE'), [1]);
      expect(mockConn.query).toHaveBeenNthCalledWith(2, expect.stringContaining('FOR UPDATE'), [2]);
      // Pagos insert happens inside the transaction (call #8 — after stock decrements)
      expect(mockConn.query).toHaveBeenNthCalledWith(
        8,
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

    it('should set venta.estado to completada and decrement stock for non-MP payments', async () => {
      const mockConn = {
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        query: vi.fn(),
      };
      mockGetConnection.mockResolvedValue(mockConn);
      // Stock check — sufficient
      mockConn.query.mockResolvedValueOnce([[{ cantidad_disponible: 10 }]]);
      // INSERT ventas — verify 'completada' estado
      mockConn.query.mockResolvedValueOnce([{ insertId: 1 }]);
      // INSERT detalle
      mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Stock decrement (non-MP path)
      mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // INSERT pago
      mockConn.query.mockResolvedValueOnce([{ insertId: 10 }]);
      // After commit: fetch
      mockQuery.mockResolvedValueOnce([[ 
        { venta_id: 1, cliente_id: null, fecha_venta: '2024-01-01T00:00:00.000Z', subtotal: 50, descuento: 0, impuestos: 0, total: 50, metodo_pago: 'efectivo', estado: 'completada', notas: '', cliente_nombre: null, detalle_id: 1, producto_id: 1, cantidad: 3, precio_unitario: 10, detalle_subtotal: 30, detalle_descuento: 0, detalle_total: 30, producto_nombre: 'Pan' },
      ]]);
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await ventasService.createVenta({
        metodo_pago: 'efectivo',
        productos: [{ producto_id: 1, cantidad: 3, precio_unitario: 10, subtotal: 30 }],
      });

      // Venta INSERT uses 'completada'
      const ventaInsertArgs = mockConn.query.mock.calls[1]; // call #2 (0-indexed: 1)
      expect(ventaInsertArgs[0]).toContain('INSERT INTO ventas');
      expect(ventaInsertArgs[1]).toContain('completada'); // estado param
      expect(ventaInsertArgs[1]).toContain('efectivo'); // metodo_pago param
      // Stock decrement runs for non-MP (call #4 — after detalle INSERT)
      expect(mockConn.query).toHaveBeenNthCalledWith(
        4,
        expect.stringContaining('UPDATE stock'),
        expect.arrayContaining([1]),
      );
      expect(result.estado).toBe('completada');
    });

    it('should set venta.estado to pendiente and skip stock decrement for MP payments', async () => {
      const mockConn = {
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        query: vi.fn(),
      };
      mockGetConnection.mockResolvedValue(mockConn);
      // Stock check — sufficient (FOR UPDATE still runs for MP)
      mockConn.query.mockResolvedValueOnce([[{ cantidad_disponible: 10 }]]);
      // INSERT ventas — verify 'pendiente' estado
      mockConn.query.mockResolvedValueOnce([{ insertId: 2 }]);
      // INSERT detalle
      mockConn.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // NO stock decrement for MP — INSERT pago is next
      mockConn.query.mockResolvedValueOnce([{ insertId: 20 }]);
      // After commit: fetch
      mockQuery.mockResolvedValueOnce([[
        { venta_id: 2, cliente_id: null, fecha_venta: '2024-01-01T00:00:00.000Z', subtotal: 50, descuento: 0, impuestos: 0, total: 50, metodo_pago: 'mercado_pago', estado: 'pendiente', notas: '', cliente_nombre: null, detalle_id: 3, producto_id: 1, cantidad: 3, precio_unitario: 10, detalle_subtotal: 30, detalle_descuento: 0, detalle_total: 30, producto_nombre: 'Pan' },
      ]]);
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await ventasService.createVenta({
        metodo_pago: 'mercado_pago',
        productos: [{ producto_id: 1, cantidad: 3, precio_unitario: 10, subtotal: 30 }],
      });

      // Venta INSERT uses 'pendiente'
      const ventaInsertArgs = mockConn.query.mock.calls[1]; // call #2 (0-indexed: 1)
      expect(ventaInsertArgs[0]).toContain('INSERT INTO ventas');
      expect(ventaInsertArgs[1]).toContain('pendiente'); // estado param
      expect(ventaInsertArgs[1]).toContain('mercado_pago'); // metodo_pago param
      // Total calls: 1 stock check + 1 INSERT venta + 1 INSERT detalle + 1 INSERT pago = 4
      // NO stock decrement call for MP
      expect(mockConn.query).toHaveBeenCalledTimes(4);
      expect(result.estado).toBe('pendiente');
    });

    it('should update venta estado via updateStatus', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await ventasService.updateStatus(1, 'cancelada');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ventas'),
        ['cancelada', 1],
      );
    });

    it('should decrement stock via decrementStock for a confirmed venta', async () => {
      // First query: fetch venta_detalle items (pool.query returns [[rows]])
      mockQuery.mockResolvedValueOnce([
        [
          { producto_id: 1, cantidad: 3 },
          { producto_id: 2, cantidad: 1 },
        ],
      ]);
      // Second query: UPDATE stock for product 1
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Third query: UPDATE stock for product 2
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await ventasService.decrementStock(5);

      // Should query venta_detalle to get items
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT producto_id, cantidad'),
        [5],
      );
      // Should UPDATE stock for each product
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE stock'),
        expect.arrayContaining([3, 1]),
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('UPDATE stock'),
        expect.arrayContaining([1, 2]),
      );
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
