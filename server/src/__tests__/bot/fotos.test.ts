import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDownloadTelegramFile, mockCreateMulterFile, mockSubirFoto } = vi.hoisted(() => ({
  mockDownloadTelegramFile: vi.fn(),
  mockCreateMulterFile: vi.fn(),
  mockSubirFoto: vi.fn(),
}));

vi.mock('../../bot/telegram-file', () => ({
  downloadTelegramFile: mockDownloadTelegramFile,
  createMulterFile: mockCreateMulterFile,
}));

vi.mock('../../services/FotoService', () => ({
  FotoService: class {
    subirFoto = mockSubirFoto;
  },
}));

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../../db', () => ({
  connection: { query: mockQuery },
}));

import { fotoHandler } from '../../bot/handlers/fotos';

function createMockCtx() {
  return {
    reply: vi.fn(),
    message: {
      photo: [
        { file_id: 'small-file', width: 100, height: 100 },
        { file_id: 'large-file', width: 800, height: 800 },
      ],
      caption: '5',
    },
    api: {
      getFile: vi.fn(),
    },
  };
}

describe('fotoHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe procesar foto con caption valido y confirmar', async () => {
    const ctx = createMockCtx() as any;

    mockQuery.mockResolvedValue([[{ id: 5 }]]); // producto existe
    mockDownloadTelegramFile.mockResolvedValue({
      buffer: Buffer.from('test'),
      ext: '.jpg',
      tempPath: '/tmp/photo.jpg',
    });
    mockCreateMulterFile.mockReturnValue({
      fieldname: 'archivo',
      originalname: 'foto.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 4,
      path: '/tmp/photo.jpg',
    });
    mockSubirFoto.mockResolvedValue({ success: true, message: 'Foto subida correctamente' });

    await fotoHandler(ctx);

    // Verificar que se buscó el producto
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('productos'), [5]);
    // Verificar que se descargó la foto (último elemento del array photo = mayor resolución)
    expect(mockDownloadTelegramFile).toHaveBeenCalledWith(expect.any(Object), 'large-file');
    // Verificar que se creó el MulterFile
    expect(mockCreateMulterFile).toHaveBeenCalled();
    // Verificar que se llamó a subirFoto
    expect(mockSubirFoto).toHaveBeenCalledWith(
      expect.objectContaining({
        producto_id: 5,
      }),
    );
    // Verificar respuesta
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#5');
    expect(replyText.toLowerCase()).toContain('foto');
  });

  it('debe responder ayuda si no hay caption', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.caption = undefined;

    await fotoHandler(ctx);

    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockDownloadTelegramFile).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('caption');
    expect(replyText).toContain('ID');
  });

  it('debe responder ayuda si caption no es numerico', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.caption = 'abc';

    await fotoHandler(ctx);

    expect(mockQuery).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('caption');
  });

  it('debe rechazar si el producto no existe', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.caption = '999';

    mockQuery.mockResolvedValue([[]]); // producto NO existe

    await fotoHandler(ctx);

    expect(mockDownloadTelegramFile).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe responder error generico si el service falla', async () => {
    const ctx = createMockCtx() as any;

    mockQuery.mockResolvedValue([[{ id: 5 }]]);
    mockDownloadTelegramFile.mockResolvedValue({
      buffer: Buffer.from('test'),
      ext: '.jpg',
      tempPath: '/tmp/photo.jpg',
    });
    mockCreateMulterFile.mockReturnValue({
      fieldname: 'archivo',
      originalname: 'foto.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 4,
      path: '/tmp/photo.jpg',
    });
    mockSubirFoto.mockResolvedValue({ success: false, message: 'Error al subir foto' });

    await fotoHandler(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('error');
  });
});
