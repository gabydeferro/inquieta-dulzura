import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContenidoDigitalService } from '../services/ContenidoDigitalService';

// Mock the db module
vi.mock('../db', () => ({
  connection: {
    query: vi.fn(),
  },
}));

import { connection } from '../db';
const mockQuery = vi.mocked(connection.query);

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    producto_id: 1,
    url: '/uploads/contenido-digital/test.jpg',
    cloudinary_public_id: null,
    titulo: 'Test Upload',
    descripcion: 'Integration test file',
    etiquetas: '["test"]',
    fecha_subida: new Date('2025-01-01'),
    tipo: 'imagen',
    tamaño: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

describe('ContenidoDigitalService', () => {
  let service: ContenidoDigitalService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ContenidoDigitalService();
  });

  describe('crearImagen', () => {
    it('should create an image and return it with an auto-assigned ID', async () => {
      // INSERT returns insertId
      mockQuery.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]);
      // SELECT returns [rows] tuple
      mockQuery.mockResolvedValueOnce([[makeRow()]]);

      const result = await service.crearImagen({
        productoId: 1,
        url: '/uploads/contenido-digital/test.jpg',
        titulo: 'Test Upload',
        descripcion: 'Integration test file',
        tipo: 'imagen',
        etiquetas: ['test'],
        fechaSubida: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.productoId).toBe(1);
      expect(result.titulo).toBe('Test Upload');
      expect(result.descripcion).toBe('Integration test file');
      expect(result.etiquetas).toContain('test');
      expect(result.url).toContain('/uploads/contenido-digital/');
    });

    it('should handle missing optional fields', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]);
      mockQuery.mockResolvedValueOnce([
        [
          {
            id: 1,
            producto_id: 1,
            url: '/uploads/contenido-digital/video.mp4',
            cloudinary_public_id: null,
            titulo: 'No desc',
            descripcion: null,
            etiquetas: '[]',
            fecha_subida: new Date('2025-01-01'),
            tipo: 'video',
            tamaño: null,
            created_at: new Date('2025-01-01'),
            updated_at: new Date('2025-01-01'),
          },
        ],
      ]);

      const result = await service.crearImagen({
        productoId: 1,
        url: '/uploads/contenido-digital/video.mp4',
        titulo: 'No desc',
        tipo: 'video',
        etiquetas: [],
        fechaSubida: new Date(),
      });

      expect(result.id).toBe(1);
      expect(result.descripcion).toBeUndefined();
      expect(result.tipo).toBe('video');
    });

    it('should auto-increment IDs for multiple images', async () => {
      // First create: INSERT → SELECT
      mockQuery.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]);
      mockQuery.mockResolvedValueOnce([[makeRow({ id: 1, titulo: 'First', url: '/img1.jpg' })]]);
      // Second create: INSERT → SELECT
      mockQuery.mockResolvedValueOnce([{ insertId: 2, affectedRows: 1 }]);
      mockQuery.mockResolvedValueOnce([[makeRow({ id: 2, titulo: 'Second', url: '/img2.jpg' })]]);

      const img1 = await service.crearImagen({
        productoId: 1,
        url: '/img1.jpg',
        titulo: 'First',
        tipo: 'imagen',
        etiquetas: [],
        fechaSubida: new Date(),
      });

      const img2 = await service.crearImagen({
        productoId: 1,
        url: '/img2.jpg',
        titulo: 'Second',
        tipo: 'imagen',
        etiquetas: [],
        fechaSubida: new Date(),
      });

      expect(img1.id).toBe(1);
      expect(img2.id).toBe(2);
    });
  });

  describe('eliminarImagen', () => {
    it('should delete an existing image', async () => {
      // DELETE returns affectedRows > 0
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await expect(service.eliminarImagen(1)).resolves.toBeUndefined();
      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM contenido_digital WHERE id = ?', [1]);
    });

    it('should throw when image does not exist', async () => {
      // DELETE returns affectedRows === 0
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await expect(service.eliminarImagen(999)).rejects.toThrow('Imagen no encontrada');
    });
  });

  describe('obtenerTodasLasImagenes', () => {
    it('should return all created images', async () => {
      mockQuery.mockResolvedValueOnce([
        [
          makeRow({ id: 1, titulo: 'One', producto_id: 1, url: '/img1.jpg' }),
          makeRow({ id: 2, titulo: 'Two', producto_id: 2, url: '/img2.jpg' }),
        ],
      ]);

      const all = await service.obtenerTodasLasImagenes();
      expect(all).toHaveLength(2);
    });
  });

  describe('obtenerImagenesPorEtiqueta', () => {
    it('should filter images by tag', async () => {
      mockQuery.mockResolvedValueOnce([
        [makeRow({ titulo: 'Choco', etiquetas: '["chocolate","torta"]' })],
      ]);

      const tagged = await service.obtenerImagenesPorEtiqueta('chocolate');
      expect(tagged).toHaveLength(1);
      expect(tagged[0].titulo).toBe('Choco');
    });
  });
});
