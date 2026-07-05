import { describe, it, expect, beforeEach } from 'vitest';
import { ContenidoDigitalService } from '../services/ContenidoDigitalService';

describe('ContenidoDigitalService', () => {
  let service: ContenidoDigitalService;

  beforeEach(() => {
    service = new ContenidoDigitalService();
  });

  describe('crearImagen', () => {
    it('should create an image and return it with an auto-assigned ID', () => {
      const result = service.crearImagen({
        productoId: 1,
        url: '/uploads/contenido-digital/test.jpg',
        titulo: 'Test Upload',
        descripcion: 'Integration test file',
        tipo: 'imagen',
        etiquetas: ['test'],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.productoId).toBe(1);
      expect(result.titulo).toBe('Test Upload');
      expect(result.descripcion).toBe('Integration test file');
      expect(result.etiquetas).toContain('test');
      expect(result.url).toContain('/uploads/contenido-digital/');
      expect(result.fechaSubida).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields', () => {
      const result = service.crearImagen({
        productoId: 1,
        url: '/uploads/contenido-digital/video.mp4',
        titulo: 'No desc',
        tipo: 'video',
        etiquetas: [],
      });

      expect(result.id).toBe(1);
      expect(result.descripcion).toBeUndefined();
      expect(result.tipo).toBe('video');
    });

    it('should auto-increment IDs for multiple images', () => {
      const img1 = service.crearImagen({
        productoId: 1,
        url: '/img1.jpg',
        titulo: 'First',
        tipo: 'imagen',
        etiquetas: [],
      });

      const img2 = service.crearImagen({
        productoId: 1,
        url: '/img2.jpg',
        titulo: 'Second',
        tipo: 'imagen',
        etiquetas: [],
      });

      expect(img1.id).toBe(1);
      expect(img2.id).toBe(2);
    });
  });

  describe('eliminarImagen', () => {
    it('should delete an existing image', () => {
      const created = service.crearImagen({
        productoId: 1,
        url: '/test.jpg',
        titulo: 'Test',
        tipo: 'imagen',
        etiquetas: [],
      });

      expect(() => service.eliminarImagen(created.id)).not.toThrow();
      expect(service.obtenerTodasLasImagenes()).toHaveLength(0);
    });

    it('should throw when image does not exist', () => {
      expect(() => service.eliminarImagen(999)).toThrow('Imagen no encontrada');
    });
  });

  describe('obtenerTodasLasImagenes', () => {
    it('should return all created images', () => {
      service.crearImagen({
        productoId: 1,
        url: '/img1.jpg',
        titulo: 'One',
        tipo: 'imagen',
        etiquetas: [],
      });
      service.crearImagen({
        productoId: 2,
        url: '/img2.jpg',
        titulo: 'Two',
        tipo: 'imagen',
        etiquetas: [],
      });

      const all = service.obtenerTodasLasImagenes();
      expect(all).toHaveLength(2);
    });
  });

  describe('obtenerImagenesPorEtiqueta', () => {
    it('should filter images by tag', () => {
      service.crearImagen({
        productoId: 1,
        url: '/img1.jpg',
        titulo: 'Choco',
        tipo: 'imagen',
        etiquetas: ['chocolate', 'torta'],
      });
      service.crearImagen({
        productoId: 2,
        url: '/img2.jpg',
        titulo: 'Promo',
        tipo: 'imagen',
        etiquetas: ['promo'],
      });

      const tagged = service.obtenerImagenesPorEtiqueta('chocolate');
      expect(tagged).toHaveLength(1);
      expect(tagged[0].titulo).toBe('Choco');
    });
  });
});
