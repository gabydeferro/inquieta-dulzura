import { connection } from '../db';
import { ContenidoDigitalDTO } from '../dtos/ContenidoDigitalDTO';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// DB row type — matches the snake_case columns in contenido_digital table
interface ContenidoDigitalRow extends RowDataPacket {
  id: number;
  producto_id: number;
  url: string;
  cloudinary_public_id: string | null;
  titulo: string;
  descripcion: string | null;
  etiquetas: string; // JSON string from MySQL
  fecha_subida: Date;
  tipo: 'imagen' | 'video';
  tamaño: number | null;
  created_at: Date;
  updated_at: Date;
}

function parseTags(raw: string): string[] {
  return JSON.parse(raw) as string[];
}

// DTO ↔ DB column mapping helpers
function rowToDTO(row: ContenidoDigitalRow): ContenidoDigitalDTO {
  return {
    id: row.id,
    productoId: row.producto_id,
    url: row.url,
    titulo: row.titulo,
    descripcion: row.descripcion ?? undefined,
    etiquetas: typeof row.etiquetas === 'string' ? parseTags(row.etiquetas) : [],
    fechaSubida: row.fecha_subida,
    tipo: row.tipo,
    tamaño: row.tamaño ?? undefined,
  };
}

export class ContenidoDigitalService {
  async obtenerTodasLasImagenes(): Promise<ContenidoDigitalDTO[]> {
    const [rows] = await connection.query<ContenidoDigitalRow[]>(
      'SELECT * FROM contenido_digital ORDER BY fecha_subida DESC',
    );
    return rows.map(rowToDTO);
  }

  async obtenerImagenPorId(id: number): Promise<ContenidoDigitalDTO | undefined> {
    const [rows] = await connection.query<ContenidoDigitalRow[]>(
      'SELECT * FROM contenido_digital WHERE id = ?',
      [id],
    );
    if (rows.length === 0) {
      return undefined;
    }
    return rowToDTO(rows[0]);
  }

  async obtenerImagenesPorProducto(productoId: number): Promise<ContenidoDigitalDTO[]> {
    const [rows] = await connection.query<ContenidoDigitalRow[]>(
      'SELECT * FROM contenido_digital WHERE producto_id = ? ORDER BY fecha_subida DESC',
      [productoId],
    );
    return rows.map(rowToDTO);
  }

  async obtenerImagenesPorEtiqueta(etiqueta: string): Promise<ContenidoDigitalDTO[]> {
    const [rows] = await connection.query<ContenidoDigitalRow[]>(
      `SELECT * FROM contenido_digital WHERE JSON_SEARCH(etiquetas, 'one', ?) IS NOT NULL ORDER BY fecha_subida DESC`,
      [etiqueta],
    );
    return rows.map(rowToDTO);
  }

  async crearImagen(data: Omit<ContenidoDigitalDTO, 'id'>): Promise<ContenidoDigitalDTO> {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO contenido_digital (producto_id, url, titulo, descripcion, etiquetas, fecha_subida, tipo, tamaño)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.productoId,
        data.url,
        data.titulo,
        data.descripcion || null,
        JSON.stringify(data.etiquetas),
        data.fechaSubida || new Date(),
        data.tipo,
        data.tamaño || null,
      ],
    );
    const nueva = await this.obtenerImagenPorId(result.insertId);
    return nueva!;
  }

  async actualizarImagen(
    id: number,
    data: Partial<ContenidoDigitalDTO>,
  ): Promise<ContenidoDigitalDTO> {
    const imagen = await this.obtenerImagenPorId(id);
    if (!imagen) {
      throw new Error('Imagen no encontrada');
    }

    // Build dynamic UPDATE — only include fields that are present in data
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.productoId !== undefined) {
      fields.push('producto_id = ?');
      values.push(data.productoId);
    }
    if (data.url !== undefined) {
      fields.push('url = ?');
      values.push(data.url);
    }
    if (data.titulo !== undefined) {
      fields.push('titulo = ?');
      values.push(data.titulo);
    }
    if (data.descripcion !== undefined) {
      fields.push('descripcion = ?');
      values.push(data.descripcion);
    }
    if (data.etiquetas !== undefined) {
      fields.push('etiquetas = ?');
      values.push(JSON.stringify(data.etiquetas));
    }
    if (data.fechaSubida !== undefined) {
      fields.push('fecha_subida = ?');
      values.push(data.fechaSubida);
    }
    if (data.tipo !== undefined) {
      fields.push('tipo = ?');
      values.push(data.tipo);
    }
    if (data.tamaño !== undefined) {
      fields.push('tamaño = ?');
      values.push(data.tamaño);
    }

    if (fields.length === 0) {
      return imagen;
    }

    values.push(id);
    await connection.query(
      `UPDATE contenido_digital SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    return (await this.obtenerImagenPorId(id))!;
  }

  async eliminarImagen(id: number): Promise<void> {
    const [result] = await connection.query<ResultSetHeader>(
      'DELETE FROM contenido_digital WHERE id = ?',
      [id],
    );
    if (result.affectedRows === 0) {
      throw new Error('Imagen no encontrada');
    }
  }

  async agregarEtiqueta(id: number, etiqueta: string): Promise<ContenidoDigitalDTO> {
    const imagen = await this.obtenerImagenPorId(id);
    if (!imagen) {
      throw new Error('Imagen no encontrada');
    }
    if (!imagen.etiquetas.includes(etiqueta)) {
      imagen.etiquetas.push(etiqueta);
      await connection.query('UPDATE contenido_digital SET etiquetas = ? WHERE id = ?', [
        JSON.stringify(imagen.etiquetas),
        id,
      ]);
    }
    return imagen;
  }

  async eliminarEtiqueta(id: number, etiqueta: string): Promise<ContenidoDigitalDTO> {
    const imagen = await this.obtenerImagenPorId(id);
    if (!imagen) {
      throw new Error('Imagen no encontrada');
    }
    imagen.etiquetas = imagen.etiquetas.filter((e) => e !== etiqueta);
    await connection.query('UPDATE contenido_digital SET etiquetas = ? WHERE id = ?', [
      JSON.stringify(imagen.etiquetas),
      id,
    ]);
    return imagen;
  }
}
