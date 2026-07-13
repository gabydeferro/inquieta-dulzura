import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';
import { CreatePagoDTO, PagoResponse } from '../dtos/PagosDTO';

const METODO_PAGO_DEFAULTS: Record<string, string> = {
  efectivo: 'aprobado',
  tarjeta: 'aprobado',
  transferencia: 'aprobado',
  cuenta_dni: 'aprobado',
  modo: 'aprobado',
  otro: 'aprobado',
  mercado_pago: 'pendiente',
};

export class PagosService {
  async create(data: CreatePagoDTO & { estado?: string }): Promise<PagoResponse> {
    const estado: string = data.estado ?? METODO_PAGO_DEFAULTS[data.metodo_pago] ?? 'pendiente';

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO pagos (venta_id, metodo_pago, monto, estado, referencia_externa, datos_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.venta_id,
        data.metodo_pago,
        data.monto,
        estado,
        data.referencia_externa ?? null,
        data.datos_json ?? null,
      ],
    );

    const insertId: number = result.insertId;
    return {
      id: insertId,
      venta_id: data.venta_id,
      metodo_pago: data.metodo_pago,
      monto: data.monto,
      estado,
      referencia_externa: data.referencia_externa ?? null,
      datos_json: data.datos_json ?? null,
      created_at: new Date().toISOString(),
    };
  }

  async getByVentaId(ventaId: number): Promise<PagoResponse[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, venta_id, metodo_pago, monto, referencia_externa, estado, datos_json, created_at
       FROM pagos
       WHERE venta_id = ?
       ORDER BY created_at ASC`,
      [ventaId],
    );

    return rows as PagoResponse[];
  }
}
