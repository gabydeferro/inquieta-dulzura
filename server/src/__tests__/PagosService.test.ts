import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PagosService } from '../services/PagosService';
import { pool } from '../config/database';

vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('PagosService', () => {
  let pagosService: PagosService;
  const mockQuery = pool.query as vi.Mock;

  beforeEach(() => {
    pagosService = new PagosService();
    mockQuery.mockReset();
  });

  describe('create', () => {
    it('should insert a payment row and return the created pago', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await pagosService.create({
        venta_id: 10,
        metodo_pago: 'efectivo',
        monto: 14000,
      });

      expect(mockQuery).toHaveBeenCalledOnce();
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO pagos'), [
        10,
        'efectivo',
        14000,
        'aprobado',
        null,
        null,
      ]);
      expect(result).toMatchObject({
        id: 1,
        venta_id: 10,
        metodo_pago: 'efectivo',
        monto: 14000,
        estado: 'aprobado',
      });
    });

    it('should default estado to pendiente for mercado_pago', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 2 }]);

      const result = await pagosService.create({
        venta_id: 11,
        metodo_pago: 'mercado_pago',
        monto: 5000,
      });

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO pagos'), [
        11,
        'mercado_pago',
        5000,
        'pendiente',
        null,
        null,
      ]);
      expect(result.estado).toBe('pendiente');
    });

    it('should store referencia_externa and datos_json when provided', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 3 }]);

      const datosJson = { mp_response: { status: 'approved' } };
      await pagosService.create({
        venta_id: 12,
        metodo_pago: 'mercado_pago',
        monto: 3000,
        referencia_externa: 'MP-12345',
        datos_json: JSON.stringify(datosJson),
      });

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO pagos'), [
        12,
        'mercado_pago',
        3000,
        'pendiente',
        'MP-12345',
        JSON.stringify(datosJson),
      ]);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      await expect(
        pagosService.create({
          venta_id: 99,
          metodo_pago: 'efectivo',
          monto: 1000,
        }),
      ).rejects.toThrow('DB connection failed');
    });
  });

  describe('getByVentaId', () => {
    it('should return all pagos for a given venta_id', async () => {
      const mockRows = [
        {
          id: 1,
          venta_id: 10,
          metodo_pago: 'efectivo',
          monto: 10000,
          referencia_externa: null,
          estado: 'aprobado',
          datos_json: null,
          created_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          venta_id: 10,
          metodo_pago: 'tarjeta',
          monto: 4000,
          referencia_externa: 'TXN-999',
          estado: 'aprobado',
          datos_json: null,
          created_at: '2024-01-01T00:00:01.000Z',
        },
      ];
      mockQuery.mockResolvedValueOnce([mockRows]);

      const result = await pagosService.getByVentaId(10);

      expect(result).toHaveLength(2);
      expect(result[0].metodo_pago).toBe('efectivo');
      expect(result[0].monto).toBe(10000);
      expect(result[1].metodo_pago).toBe('tarjeta');
      expect(result[1].monto).toBe(4000);
      expect(result[1].referencia_externa).toBe('TXN-999');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE venta_id = ?'), [10]);
    });

    it('should return empty array when no pagos exist for venta', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await pagosService.getByVentaId(999);

      expect(result).toEqual([]);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE venta_id = ?'), [999]);
    });
  });
});
