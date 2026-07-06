import { connection } from '../db';
import { ProductoDTO, CreateProductoDTO, UpdateProductoDTO } from '../dtos/ProductoDTO';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class ProductoService {
  async getAll(): Promise<ProductoDTO[]> {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM productos WHERE activo = true ORDER BY nombre ASC',
    );
    return rows as ProductoDTO[];
  }

  async getAllAdmin(): Promise<ProductoDTO[]> {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM productos ORDER BY nombre ASC',
    );
    return rows as ProductoDTO[];
  }

  async getByCategoriaId(categoriaId: number): Promise<ProductoDTO[]> {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM productos WHERE categoria_id = ? AND activo = true ORDER BY nombre ASC',
      [categoriaId],
    );
    return rows as ProductoDTO[];
  }

  async getById(id: number): Promise<ProductoDTO | null> {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM productos WHERE id = ?', [
      id,
    ]);
    if (rows.length === 0) {
      return null;
    }
    return rows[0] as ProductoDTO;
  }

  async create(data: CreateProductoDTO): Promise<ProductoDTO> {
    const { categoria_id, nombre, descripcion, precio, costo, sku } = data;
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO productos (categoria_id, nombre, descripcion, precio, costo, sku) VALUES (?, ?, ?, ?, ?, ?)',
      [categoria_id, nombre, descripcion || null, precio, costo || null, sku || null],
    );
    const insertedId = result.insertId;
    return (await this.getById(insertedId))!;
  }

  async update(id: number, data: UpdateProductoDTO): Promise<ProductoDTO | null> {
    const producto = await this.getById(id);
    if (!producto) {
      return null;
    }

    const updatedProducto = { ...producto, ...data };

    console.log('🔍 ProductoService.update — id:', id, 'data:', JSON.stringify(data));
    console.log('🔍 ProductoService.update — updatedProducto keys:', Object.keys(updatedProducto), 'nombre:', updatedProducto.nombre, 'precio:', updatedProducto.precio);

    const [updateResult] = await connection.query<ResultSetHeader>(
      'UPDATE productos SET categoria_id = ?, nombre = ?, descripcion = ?, precio = ?, costo = ?, sku = ?, activo = ? WHERE id = ?',
      [
        updatedProducto.categoria_id,
        updatedProducto.nombre,
        updatedProducto.descripcion,
        updatedProducto.precio,
        updatedProducto.costo,
        updatedProducto.sku,
        updatedProducto.activo,
        id,
      ],
    );

    console.log('🔍 ProductoService.update — affectedRows:', updateResult.affectedRows, 'changedRows:', updateResult.changedRows);

    const updated = await this.getById(id);
    console.log('🔍 ProductoService.update — re-read:', JSON.stringify({ id: updated?.id, nombre: updated?.nombre, precio: updated?.precio }));
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await connection.query<ResultSetHeader>('DELETE FROM productos WHERE id = ?', [
      id,
    ]);
    return result.affectedRows > 0;
  }
}
