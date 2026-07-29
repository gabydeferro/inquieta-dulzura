import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';
import { CreateProduccionDTO, ProduccionResponse } from '../dtos/ProduccionDTO';
import { InsufficientIngredientStockError } from '../errors/InsufficientIngredientStockError';
import { convertUnit } from '../utils/unitConversion';

interface ListarResult {
  data: ProduccionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RecetaRow extends RowDataPacket {
  id: number;
  nombre: string;
}

interface RecetaIngredienteRow extends RowDataPacket {
  receta_id: number;
  ingrediente_id: number;
  cantidad: number;
  unidad_medida: string;
  notas: string | null;
  nombre: string;
  cantidad_disponible: number;
  unidad_medida_ingrediente: string;
}

interface ProductoRecetaRow extends RowDataPacket {
  producto_id: number;
  cantidad_receta: number;
}

export class ProduccionService {
  async producir(data: CreateProduccionDTO, userId: number): Promise<ProduccionResponse> {
    const { receta_id, cantidad_producir } = data;

    // 1. Buscar receta (pre-check — no transaction needed)
    const [recetaRows] = await pool.query<RecetaRow[]>(
      'SELECT * FROM recetas WHERE id = ?',
      [receta_id],
    );

    if (recetaRows.length === 0) {
      throw new Error('Receta no encontrada');
    }

    // 2-3. Buscar ingredientes y productos vinculados (pre-check)
    const [ingredienteRows] = await pool.query<RecetaIngredienteRow[]>(
      `SELECT ri.*, i.nombre, i.cantidad_disponible, i.unidad_medida AS unidad_medida_ingrediente
       FROM receta_ingrediente ri
       JOIN ingredientes i ON ri.ingrediente_id = i.id
       WHERE ri.receta_id = ?`,
      [receta_id],
    );

    const [productoRows] = await pool.query<ProductoRecetaRow[]>(
      'SELECT pr.producto_id, pr.cantidad_receta FROM producto_receta pr WHERE pr.receta_id = ?',
      [receta_id],
    );

    if (productoRows.length === 0) {
      throw new Error('Receta sin producto vinculado');
    }

    if (productoRows.length > 1) {
      throw new Error('La receta está vinculada a múltiples productos');
    }

    const { producto_id, cantidad_receta } = productoRows[0];
    const tandas = cantidad_producir * cantidad_receta;

    // 4+6+. Transaction: BEGIN, FOR UPDATE, calcular, validar, descontar, acreditar, insertar, COMMIT
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // FOR UPDATE on ingredients
      await connection.execute(
        'SELECT * FROM receta_ingrediente WHERE receta_id = ? FOR UPDATE',
        [receta_id],
      );

      // FOR UPDATE on stock
      await connection.execute(
        'SELECT * FROM stock WHERE producto_id = ? FOR UPDATE',
        [producto_id],
      );

      // Calcular cantidades necesarias y validar compatibilidad de unidades
      const needed = ingredienteRows.map((ri) => {
        const cantidadBase = ri.cantidad * tandas;

        if (ri.unidad_medida !== ri.unidad_medida_ingrediente) {
          const convertido = convertUnit(
            cantidadBase,
            ri.unidad_medida,
            ri.unidad_medida_ingrediente,
          );
          return {
            ingrediente_id: ri.ingrediente_id,
            nombre: ri.nombre,
            necesario: convertido,
            disponible: ri.cantidad_disponible,
          };
        }

        return {
          ingrediente_id: ri.ingrediente_id,
          nombre: ri.nombre,
          necesario: cantidadBase,
          disponible: ri.cantidad_disponible,
        };
      });

      // Validar stock
      const insufficient = needed.filter((n) => n.disponible < n.necesario);
      if (insufficient.length > 0) {
        const first = insufficient[0];
        throw new InsufficientIngredientStockError(
          first.ingrediente_id,
          first.nombre,
          first.disponible,
          first.necesario,
        );
      }

      // Descontar ingredientes
      for (const n of needed) {
        await connection.query(
          'UPDATE ingredientes SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?',
          [n.necesario, n.ingrediente_id],
        );
      }

      // Acreditar producto en stock
      await connection.query(
        'UPDATE stock SET cantidad_disponible = cantidad_disponible + ? WHERE producto_id = ?',
        [cantidad_producir, producto_id],
      );

      // Insertar producción con snapshot
      const ingredientesSnapshot = needed.map((n) => ({
        ingrediente_id: n.ingrediente_id,
        nombre: n.nombre,
        cantidad_consumida: n.necesario,
      }));

      const [insertResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO producciones (receta_id, producto_id, cantidad_producida, tandas_ejecutadas, ingredientes_consumidos, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          receta_id,
          producto_id,
          cantidad_producir,
          tandas,
          JSON.stringify(ingredientesSnapshot),
          userId,
        ],
      );

      await connection.commit();

      return {
        id: insertResult.insertId,
        receta_id,
        producto_id,
        cantidad_producida: cantidad_producir,
        tandas_ejecutadas: tandas,
        ingredientes_consumidos: ingredientesSnapshot,
        created_by: userId,
        created_at: new Date(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async listar(page: number, limit: number): Promise<ListarResult> {
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM producciones',
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, r.nombre AS nombre_receta, pr.nombre AS nombre_producto
       FROM producciones p
       LEFT JOIN recetas r ON p.receta_id = r.id
       LEFT JOIN productos pr ON p.producto_id = pr.id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return {
      data: rows as ProduccionResponse[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
