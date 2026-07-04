import { Context } from 'grammy';
import { connection } from '../../db';
import { RowDataPacket } from 'mysql2';
import { downloadTelegramFile, createMulterFile } from '../telegram-file';
import { FotoService } from '../../services/FotoService';

const fotoService = new FotoService();

/**
 * Handler para mensajes con foto — asocia la foto al producto cuyo ID esté en el caption.
 * Se registra con bot.on('message:photo', fotoHandler).
 */
export async function fotoHandler(ctx: Context): Promise<void> {
  try {
    const caption = ctx.message?.caption;

    // Validar que haya caption
    if (!caption) {
      await ctx.reply('📸 Enviá la foto con el ID del producto como caption.');
      return;
    }

    // Validar que el caption sea numérico (ID del producto)
    const productoId = Number(caption);
    if (isNaN(productoId)) {
      await ctx.reply('📸 Enviá la foto con el ID del producto como caption.');
      return;
    }

    // Validar que el producto existe
    const [productos] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM productos WHERE id = ?',
      [productoId],
    );

    if (productos.length === 0) {
      await ctx.reply(`❌ Producto #${productoId} no encontrado.`);
      return;
    }

    // Obtener la foto de mayor resolución (último elemento del array)
    const photos = ctx.message?.photo;
    if (!photos || photos.length === 0) {
      await ctx.reply('❌ No se recibió ninguna foto.');
      return;
    }

    const lastPhoto = photos[photos.length - 1];

    // Descargar archivo de Telegram
    // ctx.api is an Api instance with token and getFile
    const api = ctx.api as unknown as { getFile: Function; token: string };
    const { buffer, tempPath, ext } = await downloadTelegramFile(
      { api, token: api.token } as any,
      lastPhoto.file_id,
    );

    // Determinar mimetype según extensión
    const mimetypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    const mimetype = mimetypeMap[ext] || 'image/jpeg';

    // Crear archivo mock compatible con Multer
    const archivo = createMulterFile(buffer, tempPath, `producto_${productoId}${ext}`, mimetype);

    // Subir foto via FotoService
    const result = await fotoService.subirFoto({ producto_id: productoId, archivo });

    if (!result.success) {
      await ctx.reply(`❌ Error al subir foto: ${result.message}`);
      return;
    }

    await ctx.reply(`✅ Foto agregada al producto #${productoId}.`);
  } catch (error) {
    console.error('Error en fotoHandler:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}
