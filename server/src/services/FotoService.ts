import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import cloudinary, { verificarConfiguracion } from '../config/cloudinary';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Foto {
  id: number;
  producto_id: number;
  nombre_archivo: string;
  ruta_relativa: string;
  ruta_completa: string;
  url_publica: string;
  cloudinary_public_id?: string;
  tamano_bytes: number;
  mimetype: string;
  ancho_px?: number;
  alto_px?: number;
  es_principal: boolean;
  orden: number;
  created_at: Date;
  updated_at: Date;
}

export interface SubirFotoParams {
  producto_id: number;
  archivo: Express.Multer.File;
  es_principal?: boolean;
}

export interface FotoEstadisticas {
  total_fotos: number;
  tamano_total_bytes: number;
  tamano_total_mb: number;
  promedio_kb: number;
  foto_mas_grande_bytes: number;
  foto_mas_pequena_bytes: number;
}

export class FotoService {
  private directorioBase: string;
  private urlBase: string;
  private usarCloudinary: boolean;

  private static readonly MAX_TAMANO_MB = 5;
  private static readonly TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  constructor() {
    this.directorioBase = path.join(process.cwd(), 'uploads', 'productos');
    this.urlBase = process.env.BASE_URL || 'http://localhost:3000';
    this.usarCloudinary = verificarConfiguracion();

    if (!this.usarCloudinary) {
      this.inicializarDirectorio();
    }
  }

  private async inicializarDirectorio(): Promise<void> {
    try {
      await fs.access(this.directorioBase);
    } catch {
      await fs.mkdir(this.directorioBase, { recursive: true });
    }
  }

  async subirFoto(params: SubirFotoParams): Promise<{ success: boolean; message: string; data?: Foto }> {
    const { producto_id, archivo, es_principal = false } = params;

    try {
      this.validarArchivo(archivo);
      await this.validarProductoExiste(producto_id);

      let foto: Foto;
      if (this.usarCloudinary) {
        foto = await this.subirFotoCloudinary(params);
      } else {
        foto = await this.subirFotoLocal(params);
      }

      return { success: true, message: 'Foto subida correctamente', data: foto };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async subirFotoCloudinary(params: SubirFotoParams): Promise<Foto> {
    const { producto_id, archivo, es_principal = false } = params;

    const resultado = await cloudinary.uploader.upload(archivo.path, {
      folder: process.env.CLOUDINARY_FOLDER || 'inquieta-dulzura/productos',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    await fs.unlink(archivo.path);

    if (es_principal) {
      await this.desmarcarPrincipal(producto_id);
    }

    const orden = await this.obtenerSiguienteOrden(producto_id);
    const query = `
      INSERT INTO fotos_productos (
        producto_id, nombre_archivo, url_publica, cloudinary_public_id, 
        tamano_bytes, mimetype, ancho_px, alto_px, es_principal, orden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [
      producto_id,
      archivo.originalname,
      resultado.secure_url,
      resultado.public_id,
      resultado.bytes,
      archivo.mimetype,
      resultado.width,
      resultado.height,
      es_principal,
      orden
    ]);

    return await this.obtenerFotoPorId(result.insertId);
  }

  private async subirFotoLocal(params: SubirFotoParams): Promise<Foto> {
    const { producto_id, archivo, es_principal = false } = params;

    const extension = path.extname(archivo.originalname);
    const nombreUnico = `${uuidv4()}${extension}`;
    const rutaCompleta = path.join(this.directorioBase, nombreUnico);
    const rutaRelativa = `uploads/productos/${nombreUnico}`;

    await fs.rename(archivo.path, rutaCompleta);

    if (es_principal) {
      await this.desmarcarPrincipal(producto_id);
    }

    const orden = await this.obtenerSiguienteOrden(producto_id);
    const urlPublica = `${this.urlBase}/${rutaRelativa}`;

    const query = `
      INSERT INTO fotos_productos (
        producto_id, nombre_archivo, ruta_relativa, ruta_completa, 
        url_publica, tamano_bytes, mimetype, es_principal, orden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, [
      producto_id,
      archivo.originalname,
      rutaRelativa,
      rutaCompleta,
      urlPublica,
      archivo.size,
      archivo.mimetype,
      es_principal,
      orden
    ]);

    return await this.obtenerFotoPorId(result.insertId);
  }

  async eliminarFoto(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const foto = await this.obtenerFotoPorId(id);

      if (this.usarCloudinary && foto.cloudinary_public_id) {
        await cloudinary.uploader.destroy(foto.cloudinary_public_id);
      } else if (foto.ruta_completa) {
        try {
          await fs.unlink(foto.ruta_completa);
        } catch { }
      }

      await pool.execute('DELETE FROM fotos_productos WHERE id = ?', [id]);
      return { success: true, message: 'Foto eliminada correctamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async obtenerFotosProducto(producto_id: number): Promise<Foto[]> {
    const query = 'SELECT * FROM fotos_productos WHERE producto_id = ? ORDER BY es_principal DESC, orden ASC';
    const [rows] = await pool.execute<RowDataPacket[]>(query, [producto_id]);
    return rows as Foto[];
  }

  async obtenerFotoPorId(id: number): Promise<Foto> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM fotos_productos WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('Foto no encontrada');
    return rows[0] as Foto;
  }

  async obtenerFotoPrincipal(producto_id: number): Promise<Foto | null> {
    const query = 'SELECT * FROM fotos_productos WHERE producto_id = ? AND es_principal = TRUE LIMIT 1';
    const [rows] = await pool.execute<RowDataPacket[]>(query, [producto_id]);
    return rows.length > 0 ? rows[0] as Foto : null;
  }

  async establecerPrincipal(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const foto = await this.obtenerFotoPorId(id);
      await this.desmarcarPrincipal(foto.producto_id);
      await pool.execute('UPDATE fotos_productos SET es_principal = TRUE WHERE id = ?', [id]);
      return { success: true, message: 'Foto establecida como principal' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async reordenarFotos(producto_id: number, orden: number[]): Promise<{ success: boolean; message: string }> {
    try {
      for (let i = 0; i < orden.length; i++) {
        await pool.execute(
          'UPDATE fotos_productos SET orden = ? WHERE id = ? AND producto_id = ?',
          [i, orden[i], producto_id]
        );
      }
      return { success: true, message: 'Orden actualizado' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async obtenerEstadisticas(): Promise<FotoEstadisticas> {
    const query = `
      SELECT 
        COUNT(*) as total_fotos,
        COALESCE(SUM(tamano_bytes), 0) as tamano_total_bytes,
        COALESCE(AVG(tamano_bytes), 0) as promedio_bytes,
        COALESCE(MAX(tamano_bytes), 0) as foto_mas_grande_bytes,
        COALESCE(MIN(tamano_bytes), 0) as foto_mas_pequena_bytes
      FROM fotos_productos
    `;
    const [rows] = await pool.execute<RowDataPacket[]>(query);
    const stats = rows[0];
    return {
      total_fotos: Number(stats.total_fotos),
      tamano_total_bytes: Number(stats.tamano_total_bytes),
      tamano_total_mb: Number(stats.tamano_total_bytes) / (1024 * 1024),
      promedio_kb: Number(stats.promedio_bytes) / 1024,
      foto_mas_grande_bytes: Number(stats.foto_mas_grande_bytes),
      foto_mas_pequena_bytes: Number(stats.foto_mas_pequena_bytes)
    };
  }

  async limpiarArchivosHuerfanos(): Promise<{ success: boolean; message: string; eliminados: number }> {
    if (this.usarCloudinary) return { success: false, message: 'No disponible en Cloudinary', eliminados: 0 };
    try {
      const archivos = await fs.readdir(this.directorioBase);
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT ruta_completa FROM fotos_productos WHERE ruta_completa IS NOT NULL');
      const rutasEnBD = new Set(rows.map(r => r.ruta_completa));
      let eliminados = 0;
      for (const archivo of archivos) {
        const ruta = path.join(this.directorioBase, archivo);
        if (!rutasEnBD.has(ruta)) {
          await fs.unlink(ruta);
          eliminados++;
        }
      }
      return { success: true, message: `Eliminados ${eliminados} archivos`, eliminados };
    } catch (error: any) {
      return { success: false, message: error.message, eliminados: 0 };
    }
  }

  private validarArchivo(archivo: Express.Multer.File): void {
    if (!FotoService.TIPOS_PERMITIDOS.includes(archivo.mimetype)) {
      throw new Error(`Tipo no permitido: ${archivo.mimetype}`);
    }
    if (archivo.size / (1024 * 1024) > FotoService.MAX_TAMANO_MB) {
      throw new Error(`Máximo ${FotoService.MAX_TAMANO_MB}MB`);
    }
  }

  private async validarProductoExiste(producto_id: number): Promise<void> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT id FROM productos WHERE id = ?', [producto_id]);
    if (rows.length === 0) throw new Error('Producto no encontrado');
  }

  private async desmarcarPrincipal(producto_id: number): Promise<void> {
    await pool.execute('UPDATE fotos_productos SET es_principal = FALSE WHERE producto_id = ?', [producto_id]);
  }

  private async obtenerSiguienteOrden(producto_id: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT COALESCE(MAX(orden), 0) + 1 as sig FROM fotos_productos WHERE producto_id = ?', [producto_id]);
    return Number(rows[0].sig);
  }
}

export default new FotoService();
