import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { ClienteDTO, PaginatedResponse } from '../dtos/ClienteDTO';

export class ClienteService {
  async getAll(
    q?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<ClienteDTO>> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE activo = TRUE';
    const params: any[] = [];

    if (q && q.trim()) {
      whereClause += ' AND (nombre LIKE ? OR telefono LIKE ? OR email LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Count total
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM clientes ${whereClause}`,
      params,
    );
    const total = countRows[0].total;

    // Fetch page
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM clientes ${whereClause} ORDER BY nombre ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      data: rows as ClienteDTO[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: number): Promise<ClienteDTO | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM clientes WHERE id = ? AND activo = TRUE',
      [id],
    );
    const clientes = rows as ClienteDTO[];
    return clientes.length > 0 ? clientes[0] : null;
  }

  async create(cliente: {
    nombre: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    notas?: string;
  }): Promise<ClienteDTO> {
    const { nombre, telefono, email, direccion, notas } = cliente;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO clientes (nombre, telefono, email, direccion, notas) VALUES (?, ?, ?, ?, ?)',
      [nombre, telefono || null, email || null, direccion || null, notas || null],
    );

    return this.getById(result.insertId) as Promise<ClienteDTO>;
  }

  async update(
    id: number,
    cliente: Partial<{
      nombre: string;
      telefono: string;
      email: string;
      direccion: string;
      notas: string;
    }>,
  ): Promise<ClienteDTO | null> {
    const setClauses: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, any> = {
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      notas: cliente.notas,
    };

    for (const [field, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE clientes SET ${setClauses.join(', ')} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return null;
    }
    return this.getById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE clientes SET activo = FALSE WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }
}
