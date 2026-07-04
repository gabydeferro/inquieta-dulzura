import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetFile, mockFetch, mockMkdtemp, mockWriteFile } = vi.hoisted(() => ({
  mockGetFile: vi.fn(),
  mockFetch: vi.fn(),
  mockMkdtemp: vi.fn().mockResolvedValue('/tmp/bot-xxxxx'),
  mockWriteFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:fs/promises', () => ({
  mkdtemp: mockMkdtemp,
  writeFile: mockWriteFile,
}));

vi.stubGlobal('fetch', mockFetch);

import { downloadTelegramFile, createMulterFile } from '../../bot/telegram-file';

describe('downloadTelegramFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe descargar un archivo y retornar buffer, extension y ruta temporal', async () => {
    const bot = {
      api: {
        getFile: mockGetFile,
      },
      token: '123:abc',
    };

    mockGetFile.mockResolvedValue({ file_path: 'photos/photo_123.jpg' });
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
    });

    const result = await downloadTelegramFile(bot as any, 'file-id-123');

    expect(result).toHaveProperty('buffer');
    expect(result).toHaveProperty('ext');
    expect(result).toHaveProperty('tempPath');
    expect(result.ext).toBe('.jpg');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.tempPath).toContain('bot-');
    expect(mockGetFile).toHaveBeenCalledWith('file-id-123');
    expect(mockFetch).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(result.tempPath, result.buffer);
  });

  it('debe lanzar error si la descarga falla', async () => {
    const bot = {
      api: {
        getFile: mockGetFile,
      },
      token: '123:abc',
    };

    mockGetFile.mockResolvedValue({ file_path: 'photos/photo.jpg' });
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(downloadTelegramFile(bot as any, 'bad-id')).rejects.toThrow();
  });

  it('debe lanzar error si getFile falla', async () => {
    const bot = {
      api: {
        getFile: mockGetFile,
      },
      token: '123:abc',
    };

    mockGetFile.mockRejectedValue(new Error('File not found'));

    await expect(downloadTelegramFile(bot as any, 'invalid-id')).rejects.toThrow('File not found');
  });
});

describe('createMulterFile', () => {
  it('debe crear un objeto compatible con Express.Multer.File', () => {
    const buffer = Buffer.from('test-image-data');
    const result = createMulterFile(buffer, '/tmp/photo.jpg', 'foto.jpg', 'image/jpeg');

    expect(result).toHaveProperty('buffer');
    expect(result).toHaveProperty('originalname', 'foto.jpg');
    expect(result).toHaveProperty('mimetype', 'image/jpeg');
    expect(result).toHaveProperty('size', buffer.length);
    expect(result).toHaveProperty('fieldname', 'archivo');
    expect(result).toHaveProperty('path', '/tmp/photo.jpg');
    expect(result.buffer).toBe(buffer);
  });
});
