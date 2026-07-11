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
    const producto = rows[0] as ProductoDTO;

    // Eager-load linked recipes
    const [recetas] = await connection.query<RowDataPacket[]>(
      `SELECT pr.receta_id, r.nombre, pr.cantidad_receta
       FROM producto_receta pr
       JOIN recetas r ON pr.receta_id = r.id
       WHERE pr.producto_id = ?`,
      [id],
    );

    producto.recetas = recetas.map((row) => ({
      receta_id: row.receta_id as number,
      nombre: row.nombre as string,
      cantidad_receta: row.cantidad_receta as number,
    }));

    return producto;
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

    await connection.query(
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

    return await this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await connection.query<ResultSetHeader>('DELETE FROM productos WHERE id = ?', [
      id,
    ]);
    return result.affectedRows > 0;
  }

  // --- Vinculación methods ---

  async getRecetasByProducto(productoId: number): Promise<{ receta_id: number; nombre: string; cantidad_receta: number }[]> {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT pr.receta_id, r.nombre, pr.cantidad_receta
       FROM producto_receta pr
       JOIN recetas r ON pr.receta_id = r.id
       WHERE pr.producto_id = ?`,
      [productoId],
    );
    return rows.map((row) => ({
      receta_id: row.receta_id as number,
      nombre: row.nombre as string,
      cantidad_receta: row.cantidad_receta as number,
    }));
  }

  async vincular(
    productoId: number,
    recetaId: number,
    cantidadReceta: number,
  ): Promise<{ producto_id: number; receta_id: number; cantidad_receta: number }> {
    await connection.query<ResultSetHeader>(
      'INSERT INTO producto_receta (producto_id, receta_id, cantidad_receta) VALUES (?, ?, ?)',
      [productoId, recetaId, cantidadReceta],
    );
    return {
      producto_id: productoId,
      receta_id: recetaId,
      cantidad_receta: cantidadReceta,
    };
  }

  async desvincular(productoId: number, recetaId: number): Promise<boolean> {
    const [result] = await connection.query<ResultSetHeader>(
      'DELETE FROM producto_receta WHERE producto_id = ? AND receta_id = ?',
      [productoId, recetaId],
    );
    return result.affectedRows > 0;
  }
}
