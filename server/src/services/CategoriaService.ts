import { connection } from '../db';
import { CategoriaDTO, CreateCategoriaDTO, UpdateCategoriaDTO } from '../dtos/CategoriaDTO';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class CategoriaService {

  async getAll(): Promise<CategoriaDTO[]> {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT id, nombre, descripcion, activo FROM categorias ORDER BY nombre ASC');
    return rows as CategoriaDTO[];
  }

  async getById(id: number): Promise<CategoriaDTO | null> {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT id, nombre, descripcion, activo FROM categorias WHERE id = ?', [id]);
    if (rows.length === 0) {
      return null;
    }
    return rows[0] as CategoriaDTO;
  }

  async create(data: CreateCategoriaDTO): Promise<CategoriaDTO> {
    const { nombre, descripcion } = data;
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion || null]
    );
    const insertedId = result.insertId;
    return (await this.getById(insertedId))!;
  }

  async update(id: number, data: UpdateCategoriaDTO): Promise<CategoriaDTO | null> {
    const categoria = await this.getById(id);
    if (!categoria) {
      return null;
    }

    const updatedCategoria = { ...categoria, ...data };

    await connection.query(
      'UPDATE categorias SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
      [updatedCategoria.nombre, updatedCategoria.descripcion, updatedCategoria.activo, id]
    );

    return await this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await connection.query<ResultSetHeader>('DELETE FROM categorias WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
