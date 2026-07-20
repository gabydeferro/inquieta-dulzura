import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { CreateVentaDTO, VentaResponse, VentaDetalleResponse } from '../dtos/VentasDTO';
import { PagoResponse } from '../dtos/PagosDTO';
import { InsufficientStockError } from '../errors/InsufficientStockError';

export interface HistorialFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  metodo_pago?: string;
  cliente_id?: number;
}

export interface VentaHistorial {
  id: number;
  fecha_venta: string;
  cliente_id: number | null;
  cliente_nombre: string | null;
  productos: string;
  total: number;
  metodo_pago: string;
}

export interface HistorialResult {
  data: VentaHistorial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface VentaJoinedRow {
  venta_id: number;
  cliente_id: number | null;
  fecha_venta: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  metodo_pago: string;
  estado: string;
  notas: string | null;
  cliente_nombre: string | null;
  detalle_id: number | null;
  producto_id: number | null;
  cantidad: number | null;
  precio_unitario: number | null;
  detalle_subtotal: number | null;
  detalle_descuento: number | null;
  detalle_total: number | null;
  producto_nombre: string | null;
}

export class VentasService {
  async getVentas(): Promise<VentaResponse[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        v.id AS venta_id,
        v.cliente_id,
        v.fecha_venta,
        v.subtotal,
        v.descuento,
        v.impuestos,
        v.total,
        v.metodo_pago,
        v.estado,
        v.notas,
        c.nombre AS cliente_nombre,
        vd.id AS detalle_id,
        vd.producto_id,
        vd.cantidad,
        vd.precio_unitario,
        vd.subtotal AS detalle_subtotal,
        vd.descuento AS detalle_descuento,
        vd.total AS detalle_total,
        p.nombre AS producto_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
      LEFT JOIN productos p ON vd.producto_id = p.id
      ORDER BY v.fecha_venta DESC, vd.id`,
    );

    const ventas = this.aggregateVentas(rows as VentaJoinedRow[]);

    // Fetch pagos for each venta
    if (ventas.length > 0) {
      const ventaIds = ventas.map((v) => v.id);
      const placeholders = ventaIds.map(() => '?').join(',');
      const [pagoRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, venta_id, metodo_pago, monto, referencia_externa, estado, datos_json, created_at
         FROM pagos
         WHERE venta_id IN (${placeholders})
         ORDER BY created_at ASC`,
        ventaIds,
      );
      const pagosByVentaId = new Map<number, PagoResponse[]>();
      for (const pago of pagoRows as PagoResponse[]) {
        const arr = pagosByVentaId.get(pago.venta_id) ?? [];
        arr.push(pago);
        pagosByVentaId.set(pago.venta_id, arr);
      }
      for (const venta of ventas) {
        venta.pagos = pagosByVentaId.get(venta.id) ?? [];
      }
    }

    return ventas;
  }

  async getHistorial(
    filters: HistorialFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<HistorialResult> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.fecha_desde) {
      conditions.push('v.fecha_venta >= ?');
      params.push(filters.fecha_desde);
    }
    if (filters.fecha_hasta) {
      conditions.push('DATE(v.fecha_venta) <= ?');
      params.push(filters.fecha_hasta);
    }
    if (filters.metodo_pago) {
      conditions.push('v.metodo_pago = ?');
      params.push(filters.metodo_pago);
    }
    if (filters.cliente_id) {
      conditions.push('v.cliente_id = ?');
      params.push(filters.cliente_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    // Count total
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM ventas v ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    // Fetch paginated summary rows
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        v.id,
        v.fecha_venta,
        v.cliente_id,
        c.nombre AS cliente_nombre,
        v.total,
        v.metodo_pago
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ${where}
      ORDER BY v.fecha_venta DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const ventaIds = (rows as RowDataPacket[]).map((r) => r.id);
    let productosByVentaId = new Map<number, string[]>();

    if (ventaIds.length > 0) {
      const placeholders = ventaIds.map(() => '?').join(',');
      const [detalleRows] = await pool.query<RowDataPacket[]>(
        `SELECT vd.venta_id, p.nombre AS producto_nombre
         FROM venta_detalle vd
         LEFT JOIN productos p ON vd.producto_id = p.id
         WHERE vd.venta_id IN (${placeholders})
         ORDER BY vd.venta_id, vd.id`,
        ventaIds,
      );
      for (const row of detalleRows as RowDataPacket[]) {
        const arr = productosByVentaId.get(row.venta_id) ?? [];
        if (row.producto_nombre) arr.push(row.producto_nombre);
        productosByVentaId.set(row.venta_id, arr);
      }
    }

    const data: VentaHistorial[] = (rows as RowDataPacket[]).map((row) => ({
      id: row.id,
      fecha_venta: row.fecha_venta,
      cliente_id: row.cliente_id,
      cliente_nombre: row.cliente_nombre,
      productos: (productosByVentaId.get(row.id) ?? []).join(', '),
      total: row.total,
      metodo_pago: row.metodo_pago,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  METODO_PAGO_DEFAULTS: Record<string, string> = {
    efectivo: 'aprobado',
    tarjeta: 'aprobado',
    transferencia: 'aprobado',
    cuenta_dni: 'aprobado',
    modo: 'aprobado',
    otro: 'aprobado',
    mercado_pago: 'pendiente',
  };

  /** Maps metodo_pago → venta.estado. 'mercado_pago' starts pendiente (webhook completes). */
  private getVentaEstado(metodoPago: string): string {
    return metodoPago === 'mercado_pago' ? 'pendiente' : 'completada';
  }

  async createVenta(data: CreateVentaDTO): Promise<VentaResponse> {
    const conn = await pool.getConnection();
    const isMP = data.metodo_pago === 'mercado_pago';

    try {
      await conn.beginTransaction();

      // 1. Validate stock for ALL items with SELECT FOR UPDATE (even MP — reserve capacity)
      for (const prod of data.productos) {
        const [rows] = await conn.query<RowDataPacket[]>(
          'SELECT cantidad_disponible FROM stock WHERE producto_id = ? FOR UPDATE',
          [prod.producto_id],
        );
        if (rows.length === 0 || Number(rows[0].cantidad_disponible) < prod.cantidad) {
          throw new InsufficientStockError(prod.producto_id);
        }
      }

      const subtotal = data.productos.reduce((sum, p) => sum + p.subtotal, 0);
      const descuento = data.descuento ?? 0;
      const total = subtotal - descuento;
      const ventaEstado = this.getVentaEstado(data.metodo_pago);

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO ventas (cliente_id, subtotal, descuento, impuestos, total, metodo_pago, estado, notas)
         VALUES (?, ?, ?, 0, ?, ?, ?, '')`,
        [data.cliente_id ?? null, subtotal, descuento, total, data.metodo_pago, ventaEstado],
      );

      const ventaId = result.insertId;

      for (const prod of data.productos) {
        await conn.query(
          `INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal, descuento, total)
           VALUES (?, ?, ?, ?, ?, 0, ?)`,
          [
            ventaId,
            prod.producto_id,
            prod.cantidad,
            prod.precio_unitario,
            prod.subtotal,
            prod.subtotal,
          ],
        );
      }

      // 2. Decrement stock ONLY for non-MP payments (MP deferred to webhook)
      if (!isMP) {
        for (const prod of data.productos) {
          await conn.query(
            `UPDATE stock SET cantidad_disponible = cantidad_disponible - ? WHERE producto_id = ?`,
            [prod.cantidad, prod.producto_id],
          );
        }
      }

      // 3. Insert pago row (1 pago per venta for now)
      const pagoEstado = this.METODO_PAGO_DEFAULTS[data.metodo_pago] ?? 'pendiente';
      await conn.query(
        `INSERT INTO pagos (venta_id, metodo_pago, monto, estado, referencia_externa, datos_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ventaId, data.metodo_pago, total, pagoEstado, null, null],
      );

      await conn.commit();

      // Fetch the created venta to return
      return this.getVentaById(ventaId);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /** Update venta estado (used by webhook handler). */
  async updateStatus(id: number, estado: string): Promise<void> {
    await pool.query(
      'UPDATE ventas SET estado = ? WHERE id = ?',
      [estado, id],
    );
  }

  /** Decrement stock for all items in a venta (called after webhook confirms approval). */
  async decrementStock(ventaId: number): Promise<void> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT producto_id, cantidad FROM venta_detalle WHERE venta_id = ?',
      [ventaId],
    );

    for (const row of rows) {
      await pool.query(
        `UPDATE stock SET cantidad_disponible = cantidad_disponible - ? WHERE producto_id = ?`,
        [row.cantidad, row.producto_id],
      );
    }
  }

  async getVentaById(id: number): Promise<VentaResponse> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        v.id AS venta_id,
        v.cliente_id,
        v.fecha_venta,
        v.subtotal,
        v.descuento,
        v.impuestos,
        v.total,
        v.metodo_pago,
        v.estado,
        v.notas,
        c.nombre AS cliente_nombre,
        vd.id AS detalle_id,
        vd.producto_id,
        vd.cantidad,
        vd.precio_unitario,
        vd.subtotal AS detalle_subtotal,
        vd.descuento AS detalle_descuento,
        vd.total AS detalle_total,
        p.nombre AS producto_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
      LEFT JOIN productos p ON vd.producto_id = p.id
      WHERE v.id = ?
      ORDER BY vd.id`,
      [id],
    );

    const ventas = this.aggregateVentas(rows as VentaJoinedRow[]);
    const venta = ventas[0];

    if (venta) {
      const [pagoRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, venta_id, metodo_pago, monto, referencia_externa, estado, datos_json, created_at
         FROM pagos
         WHERE venta_id = ?
         ORDER BY created_at ASC`,
        [id],
      );
      venta.pagos = pagoRows as PagoResponse[];
    }

    return venta;
  }

  private aggregateVentas(rows: VentaJoinedRow[]): VentaResponse[] {
    const ventaMap = new Map<number, VentaResponse>();

    for (const row of rows) {
      if (!ventaMap.has(row.venta_id)) {
        ventaMap.set(row.venta_id, {
          id: row.venta_id,
          cliente_id: row.cliente_id ?? undefined,
          cliente_nombre: row.cliente_nombre ?? undefined,
          fecha_venta: row.fecha_venta,
          subtotal: row.subtotal,
          descuento: row.descuento,
          impuestos: row.impuestos,
          total: row.total,
          metodo_pago: row.metodo_pago,
          estado: row.estado,
          notas: row.notas ?? undefined,
          productos: [],
        });
      }

      if (row.detalle_id !== null) {
        const venta = ventaMap.get(row.venta_id)!;
        const detalle: VentaDetalleResponse = {
          id: row.detalle_id,
          venta_id: row.venta_id,
          producto_id: row.producto_id!,
          producto_nombre: row.producto_nombre ?? undefined,
          cantidad: row.cantidad!,
          precio_unitario: row.precio_unitario!,
          subtotal: row.detalle_subtotal!,
          descuento: row.detalle_descuento!,
          total: row.detalle_total!,
        };
        venta.productos.push(detalle);
      }
    }

    return Array.from(ventaMap.values());
  }
}
