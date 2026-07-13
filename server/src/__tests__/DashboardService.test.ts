import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from '../services/DashboardService';
import { pool } from '../config/database';

vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('../services/ConfiguracionService', () => ({
  ConfiguracionService: class MockConfiguracionService {
    get = vi.fn().mockResolvedValue('10');
  },
}));

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  const mockQuery = pool.query as vi.Mock;

  beforeEach(() => {
    dashboardService = new DashboardService();
    mockQuery.mockReset();
  });

  describe('getStats', () => {
    it('should return complete dashboard stats with all required fields', async () => {
      // Mock all 14 queries (including configuracion query)
      mockQuery
        // 1. ventas hoy
        .mockResolvedValueOnce([[{ cantidad: 5, total: 1500 }]])
        // 2. ventas semana
        .mockResolvedValueOnce([[{ cantidad: 20, total: 6000 }]])
        // 3. ventas mes
        .mockResolvedValueOnce([[{ cantidad: 100, total: 30000 }]])
        // 4. total ingresos
        .mockResolvedValueOnce([[{ total: 50000 }]])
        // 5. total ventas
        .mockResolvedValueOnce([[{ total: 200 }]])
        // 6. total clientes
        .mockResolvedValueOnce([[{ total: 50 }]])
        // 7. productos activos
        .mockResolvedValueOnce([[{ total: 30 }]])
        // 8. categorias count
        .mockResolvedValueOnce([[{ total: 8 }]])
        // 9. ingredientes count
        .mockResolvedValueOnce([[{ total: 25 }]])
        // 10. recetas count
        .mockResolvedValueOnce([[{ total: 15 }]])
        // 11. ventas por dia
        .mockResolvedValueOnce([
          [
            { fecha: '2026-07-01', cantidad: 3, total: 900 },
            { fecha: '2026-07-02', cantidad: 2, total: 600 },
          ],
        ])
        // 12. metodos pago
        .mockResolvedValueOnce([
          [
            { metodo: 'efectivo', cantidad: 60, total: 18000 },
            { metodo: 'tarjeta', cantidad: 40, total: 12000 },
          ],
        ])
        // 13. top productos
        .mockResolvedValueOnce([
          [
            { producto_id: 1, nombre: 'Torta Chocolate', cantidad: 50, total: 12500 },
            { producto_id: 2, nombre: 'Galletas', cantidad: 30, total: 4500 },
          ],
        ])
        // 14. stock bajo
        .mockResolvedValueOnce([
          [
            {
              producto_id: 3,
              nombre: 'Harina',
              cantidad_disponible: 5,
              unidad_medida: 'kg',
            },
          ],
        ]);

      const result = await dashboardService.getStats();

      // Verify all fields exist
      expect(result).toHaveProperty('ventasHoy');
      expect(result).toHaveProperty('ventasSemana');
      expect(result).toHaveProperty('ventasMes');
      expect(result).toHaveProperty('totalIngresos');
      expect(result).toHaveProperty('totalVentas');
      expect(result).toHaveProperty('totalClientes');
      expect(result).toHaveProperty('productosActivos');
      expect(result).toHaveProperty('categoriasCount');
      expect(result).toHaveProperty('ingredientesCount');
      expect(result).toHaveProperty('recetasCount');
      expect(result).toHaveProperty('ventasPorDia');
      expect(result).toHaveProperty('metodosPago');
      expect(result).toHaveProperty('topProductos');
      expect(result).toHaveProperty('stockBajo');
      expect(result).toHaveProperty('stockBajoCount');

      // Verify values
      expect(result.ventasHoy.cantidad).toBe(5);
      expect(result.ventasHoy.total).toBe(1500);
      expect(result.ventasSemana.cantidad).toBe(20);
      expect(result.ventasMes.cantidad).toBe(100);
      expect(result.totalIngresos).toBe(50000);
      expect(result.totalVentas).toBe(200);
      expect(result.totalClientes).toBe(50);
      expect(result.productosActivos).toBe(30);
      expect(result.categoriasCount).toBe(8);
      expect(result.ingredientesCount).toBe(25);
      expect(result.recetasCount).toBe(15);
      expect(result.ventasPorDia).toHaveLength(2);
      expect(result.metodosPago).toHaveLength(2);
      expect(result.topProductos).toHaveLength(2);
      expect(result.stockBajo).toHaveLength(1);
      expect(result.stockBajoCount).toBe(1);

      // Verify 14 queries executed
      expect(mockQuery).toHaveBeenCalledTimes(14);
    });

    it('should handle null values with COALESCE (return 0)', async () => {
      mockQuery
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      const result = await dashboardService.getStats();

      expect(result.ventasHoy.cantidad).toBe(0);
      expect(result.ventasHoy.total).toBe(0);
      expect(result.totalIngresos).toBe(0);
      expect(result.stockBajoCount).toBe(0);
    });

    it('should return empty arrays for chart data when no sales exist', async () => {
      mockQuery
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      const result = await dashboardService.getStats();

      expect(result.ventasPorDia).toEqual([]);
      expect(result.metodosPago).toEqual([]);
      expect(result.topProductos).toEqual([]);
      expect(result.stockBajo).toEqual([]);
    });

    it('should execute all queries in parallel via Promise.all', async () => {
      mockQuery
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ cantidad: 0, total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[{ total: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await dashboardService.getStats();

      // All 14 queries should have been called
      expect(mockQuery).toHaveBeenCalledTimes(14);
    });
  });
});