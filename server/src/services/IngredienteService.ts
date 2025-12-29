import { pool } from '../config/database';
import { IngredienteDTO } from '../dtos/IngredienteDTO';

export class IngredienteService {
  async getAll(): Promise<IngredienteDTO[]> {
    const [rows] = await pool.query('SELECT * FROM ingredientes WHERE activo = TRUE');
    return rows as IngredienteDTO[];
  }

  async getById(id: number): Promise<IngredienteDTO | null> {
    const [rows] = await pool.query('SELECT * FROM ingredientes WHERE id = ? AND activo = TRUE', [id]);
    const ingredientes = rows as IngredienteDTO[];
    return ingredientes.length > 0 ? ingredientes[0] : null;
  }

  async create(ingrediente: IngredienteDTO): Promise<IngredienteDTO> {
    const { nombre, descripcion, unidad_medida, costo_unitario, activo } = ingrediente;
    const [result] = await pool.query(
      'INSERT INTO ingredientes (nombre, descripcion, unidad_medida, costo_unitario, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, unidad_medida, costo_unitario, activo ?? true]
    );
    const insertedId = (result as any).insertId;
    return { id: insertedId, ...ingrediente, activo: activo ?? true };
  }

  async update(id: number, ingrediente: Partial<IngredienteDTO>): Promise<IngredienteDTO | null> {
    const { nombre, descripcion, unidad_medida, costo_unitario, activo } = ingrediente;
    const [result] = await pool.query(
      'UPDATE ingredientes SET nombre = ?, descripcion = ?, unidad_medida = ?, costo_unitario = ?, activo = ? WHERE id = ?',
      [nombre, descripcion, unidad_medida, costo_unitario, activo, id]
    );
    if ((result as any).affectedRows === 0) {
      return null; // Ingrediente not found or no changes made
    }
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    // Soft delete
    const [result] = await pool.query('UPDATE ingredientes SET activo = FALSE WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }
}
