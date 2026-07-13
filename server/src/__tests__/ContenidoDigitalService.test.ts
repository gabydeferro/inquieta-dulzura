import { describe, test, expect, beforeEach, vi } from 'vitest';
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
    url: 'https://example.com/imagen.jpg',
    cloudinary_public_id: null,
    titulo: 'Torta de chocolate',
    descripcion: null,
    etiquetas: '["torta","chocolate"]',
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
    test('debe crear una nueva imagen correctamente', async () => {
      // INSERT returns insertId
      mockQuery.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]);
      // SELECT returns [rows] tuple
      mockQuery.mockResolvedValueOnce([[makeRow()]]);

      const nuevaImagen = {
        productoId: 1,
        url: 'https://example.com/imagen.jpg',
        titulo: 'Torta de chocolate',
        etiquetas: ['torta', 'chocolate'],
        fechaSubida: new Date(),
        tipo: 'imagen' as const,
      };

      const resultado = await service.crearImagen(nuevaImagen);

      expect(resultado).toHaveProperty('id');
      expect(resultado.titulo).toBe('Torta de chocolate');
      expect(resultado.etiquetas).toContain('torta');
    });
  });

  describe('obtenerImagenesPorEtiqueta', () => {
    test('debe filtrar imágenes por etiqueta', async () => {
      mockQuery.mockResolvedValueOnce([
        [
          makeRow({
            titulo: 'Imagen 1',
            etiquetas: '["chocolate"]',
          }),
        ],
      ]);

      const resultado = await service.obtenerImagenesPorEtiqueta('chocolate');
      expect(resultado).toHaveLength(1);
      expect(resultado[0].titulo).toBe('Imagen 1');
    });
  });

  describe('agregarEtiqueta', () => {
    test('debe agregar una etiqueta a una imagen existente', async () => {
      // SELECT to get the image
      mockQuery.mockResolvedValueOnce([[makeRow({ etiquetas: '["original"]' })]]);
      // UPDATE to persist the new etiquetas
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // SELECT to return the updated image
      mockQuery.mockResolvedValueOnce([[makeRow({ etiquetas: '["original","nueva"]' })]]);

      const actualizada = await service.agregarEtiqueta(1, 'nueva');
      expect(actualizada.etiquetas).toContain('nueva');
      expect(actualizada.etiquetas).toContain('original');
    });
  });

  describe('eliminarImagen', () => {
    test('debe eliminar una imagen correctamente', async () => {
      // DELETE returns affectedRows > 0
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await service.eliminarImagen(1);
      // Verify DELETE was called with the correct id
      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM contenido_digital WHERE id = ?', [1]);
    });
  });
});
