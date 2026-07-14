import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { ConfiguracionService } from './ConfiguracionService';

interface DashboardStats {
  ventasHoy: { cantidad: number; total: number };
  ventasSemana: { cantidad: number; total: number };
  ventasMes: { cantidad: number; total: number };
  ingresosMes: number;
  totalIngresos: number;
  totalVentas: number;
  totalClientes: number;
  productosActivos: number;
  categoriasCount: number;
  ingredientesCount: number;
  recetasCount: number;
  ventasPorDia: Array<{ fecha: string; cantidad: number; total: number }>;
  metodosPago: Array<{ metodo: string; cantidad: number; total: number }>;
  topProductos: Array<{
    producto_id: number;
    nombre: string;
    cantidad: number;
    total: number;
  }>;
  stockBajo: Array<{
    producto_id: number;
    nombre: string;
    cantidad_disponible: number;
    unidad_medida: string;
  }>;
  stockBajoCount: number;
  partial_failures: string[];
}

export class DashboardService {
  private configService = new ConfiguracionService();

  async getStats(): Promise<DashboardStats> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    // Get stock threshold from configuracion
    const thresholdStr = await this.configService.get('stock_bajo_threshold');
    const stockThreshold = thresholdStr ? parseInt(thresholdStr, 10) : 10;

    // Execute all queries in parallel with partial failure tolerance
    const results = await Promise.allSettled([
      // 1. Ventas hoy
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
           FROM ventas WHERE DATE(fecha_venta) = ?`,
          [todayStr],
        )
        .then(([rows]) => ({
          cantidad: rows[0].cantidad,
          total: rows[0].total,
        })),

      // 2. Ventas semana
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
           FROM ventas WHERE fecha_venta >= ?`,
          [weekAgoStr],
        )
        .then(([rows]) => ({
          cantidad: rows[0].cantidad,
          total: rows[0].total,
        })),

      // 3. Ventas mes
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
           FROM ventas WHERE fecha_venta >= ?`,
          [monthAgoStr],
        )
        .then(([rows]) => ({
          cantidad: rows[0].cantidad,
          total: rows[0].total,
        })),

      // 4. Total ingresos
      pool
        .query<RowDataPacket[]>(
          `SELECT COALESCE(SUM(total), 0) as total FROM ventas`,
        )
        .then(([rows]) => rows[0].total),

      // 5. Total ventas
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as total FROM ventas`,
        )
        .then(([rows]) => rows[0].total),

      // 6. Total clientes
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as total FROM personas`,
        )
        .then(([rows]) => rows[0].total),

      // 7. Productos activos
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as total FROM productos WHERE activo = 1`,
        )
        .then(([rows]) => rows[0].total),

      // 8. Categorias count
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as total FROM categorias`,
        )
        .then(([rows]) => rows[0].total),

      // 9. Ingredientes count
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as total FROM ingredientes`,
        )
        .then(([rows]) => rows[0].total),

      // 10. Recetas count
      pool
        .query<RowDataPacket[]>(
          `SELECT COUNT(*) as total FROM recetas`,
        )
        .then(([rows]) => rows[0].total),

      // 11. Ventas por dia (last 30 days)
      pool
        .query<RowDataPacket[]>(
          `SELECT DATE(fecha_venta) as fecha, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
           FROM ventas
           WHERE fecha_venta >= ?
           GROUP BY DATE(fecha_venta)
           ORDER BY fecha`,
          [monthAgoStr],
        )
        .then(([rows]) =>
          rows.map((row) => ({
            fecha: row.fecha,
            cantidad: row.cantidad,
            total: row.total,
          })),
        ),

      // 12. Metodos de pago
      pool
        .query<RowDataPacket[]>(
          `SELECT metodo_pago as metodo, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
           FROM ventas
           WHERE fecha_venta >= ?
           GROUP BY metodo_pago
           ORDER BY total DESC`,
          [monthAgoStr],
        )
        .then(([rows]) =>
          rows.map((row) => ({
            metodo: row.metodo,
            cantidad: row.cantidad,
            total: row.total,
          })),
        ),

      // 13. Top 5 productos (last 30 days)
      pool
        .query<RowDataPacket[]>(
          `SELECT vd.producto_id, p.nombre, SUM(vd.cantidad) as cantidad, SUM(vd.total) as total
           FROM venta_detalle vd
           JOIN ventas v ON vd.venta_id = v.id
           JOIN productos p ON vd.producto_id = p.id
           WHERE v.fecha_venta >= ?
           GROUP BY vd.producto_id, p.nombre
           ORDER BY cantidad DESC
           LIMIT 5`,
          [monthAgoStr],
        )
        .then(([rows]) =>
          rows.map((row) => ({
            producto_id: row.producto_id,
            nombre: row.nombre,
            cantidad: row.cantidad,
            total: row.total,
          })),
        ),

      // 14. Stock bajo
      pool
        .query<RowDataPacket[]>(
          `SELECT p.id as producto_id, p.nombre, s.cantidad_disponible, p.unidad_medida
           FROM productos p
           JOIN stock s ON p.id = s.producto_id
           WHERE s.cantidad_disponible <= ?
           ORDER BY s.cantidad_disponible ASC`,
          [stockThreshold],
        )
        .then(([rows]) =>
          rows.map((row) => ({
            producto_id: row.producto_id,
            nombre: row.nombre,
            cantidad_disponible: row.cantidad_disponible,
            unidad_medida: row.unidad_medida,
          })),
        ),
    ]);

    // Helper to extract value from settled result or return default
    const queryNames = [
      'ventasHoy', 'ventasSemana', 'ventasMes', 'totalIngresos',
      'totalVentas', 'totalClientes', 'productosActivos', 'categoriasCount',
      'ingredientesCount', 'recetasCount', 'ventasPorDia', 'metodosPago',
      'topProductos', 'stockBajo',
    ];

    const partial_failures: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        partial_failures.push(queryNames[index]);
      }
    });

    // Fail only if ALL queries failed
    if (partial_failures.length === results.length) {
      throw new Error('All dashboard queries failed');
    }

    const unwrap = <T>(result: PromiseSettledResult<T>, defaultValue: T): T =>
      result.status === 'fulfilled' ? result.value : defaultValue;

    const ventasHoy = unwrap(results[0], { cantidad: 0, total: 0 });
    const ventasSemana = unwrap(results[1], { cantidad: 0, total: 0 });
    const ventasMes = unwrap(results[2], { cantidad: 0, total: 0 });
    const totalIngresos = unwrap(results[3], 0);
    const totalVentas = unwrap(results[4], 0);
    const totalClientes = unwrap(results[5], 0);
    const productosActivos = unwrap(results[6], 0);
    const categoriasCount = unwrap(results[7], 0);
    const ingredientesCount = unwrap(results[8], 0);
    const recetasCount = unwrap(results[9], 0);
    const ventasPorDia = unwrap(results[10], []);
    const metodosPago = unwrap(results[11], []);
    const topProductos = unwrap(results[12], []);
    const stockBajo = unwrap(results[13], []);

    return {
      ventasHoy,
      ventasSemana,
      ventasMes,
      ingresosMes: ventasMes.total,
      totalIngresos,
      totalVentas,
      totalClientes,
      productosActivos,
      categoriasCount,
      ingredientesCount,
      recetasCount,
      ventasPorDia,
      metodosPago,
      topProductos,
      stockBajo,
      stockBajoCount: stockBajo.length,
      partial_failures,
    };
  }
}