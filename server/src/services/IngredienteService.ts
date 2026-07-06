import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { IngredienteDTO } from '../dtos/IngredienteDTO';

export class IngredienteService {
  async getAll(): Promise<IngredienteDTO[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM ingredientes WHERE activo = TRUE ORDER BY nombre ASC',
    );
    return rows as IngredienteDTO[];
  }

  async getById(id: number): Promise<IngredienteDTO | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM ingredientes WHERE id = ? AND activo = TRUE',
      [id],
    );
    const ingredientes = rows as IngredienteDTO[];
    return ingredientes.length > 0 ? ingredientes[0] : null;
  }

  async create(ingrediente: IngredienteDTO): Promise<IngredienteDTO> {
    const { nombre, descripcion, unidad_medida, costo_unitario, activo } = ingrediente;

    // Check if an ingredient with the same name already exists (even if inactive)
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM ingredientes WHERE nombre = ?',
      [nombre],
    );
    const existingIngredientes = existing as IngredienteDTO[];

    if (existingIngredientes.length > 0) {
      // If exists, update it (reactivate if it was inactive)
      const existingId = existingIngredientes[0].id!;
      await pool.query(
        'UPDATE ingredientes SET descripcion = ?, unidad_medida = ?, costo_unitario = ?, activo = ? WHERE id = ?',
        [descripcion, unidad_medida, costo_unitario, activo ?? true, existingId],
      );
      return {
        id: existingId,
        nombre,
        descripcion,
        unidad_medida,
        costo_unitario,
        activo: activo ?? true,
      };
    }

    // If doesn't exist, create new
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO ingredientes (nombre, descripcion, unidad_medida, costo_unitario, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, unidad_medida, costo_unitario, activo ?? true],
    );
    const insertedId = result.insertId;
    return { id: insertedId, ...ingrediente, activo: activo ?? true };
  }

  async update(id: number, ingrediente: Partial<IngredienteDTO>): Promise<IngredienteDTO | null> {
    const setClauses: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, any> = {
      nombre: ingrediente.nombre,
      descripcion: ingrediente.descripcion,
      unidad_medida: ingrediente.unidad_medida,
      costo_unitario: ingrediente.costo_unitario,
      activo: ingrediente.activo,
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
      `UPDATE ingredientes SET ${setClauses.join(', ')} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return null;
    }
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    // Soft delete
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE ingredientes SET activo = FALSE WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }
}
