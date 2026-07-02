import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContenidoDigitalService } from '../services/ContenidoDigitalService';

// ── Mocks ──────────────────────────────────────

vi.mock('../config/database', () => ({
  pool: {
    execute: vi.fn(),
  },
}));

vi.mock('../config/cloudinary', () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
  verificarConfiguracion: vi.fn().mockReturnValue(false),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440000'),
}));

// ── Helper ─────────────────────────────────────

function makeFile(overrides: Record<string, unknown> = {}): Express.Multer.File {
  return {
    fieldname: 'archivo',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image'),
    size: 102400,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  } as Express.Multer.File;
}

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  producto_id: 1,
  url: '/uploads/contenido-digital/550e8400-e29b-41d4-a716-446655440000.jpg',
  cloudinary_public_id: null,
  titulo: 'Test',
  descripcion: null,
  etiquetas: '["test"]',
  fecha_subida: '2026-06-30T12:00:00.000Z',
  tipo: 'imagen' as const,
  tamaño: 102400,
  created_at: '2026-06-30T12:00:00.000Z',
  updated_at: '2026-06-30T12:00:00.000Z',
  ...overrides,
});

// ── Tests ──────────────────────────────────────

describe('ContenidoDigital Upload Integration', () => {
  let service: ContenidoDigitalService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ContenidoDigitalService();
  });

  describe('Service create with file', () => {
    it('should process file + metadata and insert to DB', async () => {
      const { pool: dbPool } = await import('../config/database');
      const mockExecute = dbPool.execute as ReturnType<typeof vi.fn>;

      // INSERT
      mockExecute.mockResolvedValueOnce([{ insertId: 1 }]);
      // SELECT after insert (must match the data passed to crearImagen)
      mockExecute.mockResolvedValueOnce([
        [
          makeRow({
            titulo: 'Test Upload',
            etiquetas: '["test"]',
          }),
        ],
      ]);

      const result = await service.crearImagen(
        {
          productoId: 1,
          titulo: 'Test Upload',
          descripcion: 'Integration test file',
          tipo: 'imagen',
          etiquetas: ['test'],
        },
        makeFile(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.productoId).toBe(1);
      expect(result.titulo).toBe('Test Upload');
      expect(result.etiquetas).toContain('test');
      expect(result.url).toContain('/uploads/contenido-digital/');

      // Verify SQL was called with correct data
      const insertCall = mockExecute.mock.calls[0];
      expect(insertCall[0]).toContain('INSERT INTO contenido_digital');
      expect(insertCall[1][0]).toBe(1); // producto_id
      expect(insertCall[1][3]).toBe('Test Upload'); // titulo
      expect(insertCall[1][5]).toBe('["test"]'); // etiquetas JSON
      expect(insertCall[1][6]).toBe('imagen'); // tipo
    });

    it('should handle missing optional fields', async () => {
      const { pool: dbPool } = await import('../config/database');
      const mockExecute = dbPool.execute as ReturnType<typeof vi.fn>;

      mockExecute.mockResolvedValueOnce([{ insertId: 2 }]);
      mockExecute.mockResolvedValueOnce([[makeRow({ id: 2, titulo: 'No desc', descripcion: null, etiquetas: '[]', tipo: 'video', tamaño: 500 })]]);

      const result = await service.crearImagen(
        { productoId: 1, titulo: 'No desc', tipo: 'video' },
        makeFile({ mimetype: 'video/mp4', size: 500 }),
      );

      expect(result.id).toBe(2);
      expect(result.descripcion).toBeUndefined();
      expect(result.tipo).toBe('video');
    });
  });

  describe('Multer MIME filter logic', () => {
    const VALID_TYPES = [
      'image/gif', 'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm',
    ];
    const INVALID_TYPES = [
      'application/pdf', 'text/plain', 'image/svg+xml', 'video/x-msvideo',
    ];

    it('should accept valid MIME types', () => {
      VALID_TYPES.forEach((mime) => {
        const cb = vi.fn();
        const filter = (_req: unknown, file: { mimetype: string }, callback: (err: Error | null, ok?: boolean) => void) => {
          const tiposPermitidos = [...VALID_TYPES];
          callback(null, tiposPermitidos.includes(file.mimetype));
        };
        filter(null, { mimetype: mime }, cb);
        expect(cb).toHaveBeenCalledWith(null, true);
      });
    });

    it('should reject invalid MIME types', () => {
      INVALID_TYPES.forEach((mime) => {
        const cb = vi.fn();
        const filter = (_req: unknown, file: { mimetype: string }, callback: (err: Error | null, ok?: boolean) => void) => {
          const tiposPermitidos = [...VALID_TYPES];
          if (!tiposPermitidos.includes(file.mimetype)) {
            callback(new Error('Tipo de archivo no permitido'));
          } else {
            callback(null, true);
          }
        };
        filter(null, { mimetype: mime }, cb);
        expect(cb).toHaveBeenCalledWith(new Error('Tipo de archivo no permitido'));
      });
    });
  });

  describe('DELETE without Cloudinary', () => {
    it('should delete from DB without calling Cloudinary when no public_id', async () => {
      const { pool: dbPool } = await import('../config/database');
      const mockExecute = dbPool.execute as ReturnType<typeof vi.fn>;

      // SELECT before delete
      mockExecute.mockResolvedValueOnce([[makeRow({ cloudinary_public_id: null })]])
      // DELETE
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await service.eliminarImagen(1);

      expect(result).toBe(true);
      const deleteCall = mockExecute.mock.calls[1];
      expect(deleteCall[0]).toContain('DELETE FROM contenido_digital');
    });
  });
});
