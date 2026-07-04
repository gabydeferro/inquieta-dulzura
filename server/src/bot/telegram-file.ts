import { Bot } from 'grammy';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Descarga un archivo de Telegram dado un fileId.
 * Retorna el buffer del archivo, su extensión y la ruta temporal.
 */
export async function downloadTelegramFile(
  bot: Bot,
  fileId: string,
): Promise<{ buffer: Buffer; ext: string; tempPath: string }> {
  const fileInfo = await bot.api.getFile(fileId);
  const filePath = fileInfo.file_path;
  if (!filePath) {
    throw new Error('No se pudo obtener la ruta del archivo de Telegram');
  }

  const url = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al descargar archivo: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = path.extname(filePath);

  // Write to a temp file so FotoService can consume it via archivo.path
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bot-'));
  const tempPath = path.join(tmpDir, `photo${ext}`);
  await fs.writeFile(tempPath, buffer);

  return { buffer, ext, tempPath };
}

/**
 * Crea un objeto compatible con Express.Multer.File a partir de buffer descargado.
 */
export function createMulterFile(
  buffer: Buffer,
  tempPath: string,
  originalname: string,
  mimetype: string,
): Express.Multer.File {
  return {
    fieldname: 'archivo',
    originalname,
    mimetype,
    encoding: '7bit',
    size: buffer.length,
    destination: '',
    filename: originalname,
    path: tempPath,
    buffer,
  } as Express.Multer.File;
}
