import { describe, test, expect, beforeEach } from 'vitest';
import { ContenidoDigitalService } from '../services/ContenidoDigitalService';

describe('ContenidoDigitalService', () => {
    let service: ContenidoDigitalService;

    beforeEach(() => {
        service = new ContenidoDigitalService();
    });

    describe('crearImagen', () => {
        test('debe crear una nueva imagen correctamente', async () => {
            const nuevaImagen = {
                productoId: 1,
                url: 'https://example.com/imagen.jpg',
                titulo: 'Torta de chocolate',
                etiquetas: ['torta', 'chocolate'],
                tipo: 'imagen' as const
            };

            const resultado = await service.crearImagen(nuevaImagen);

            expect(resultado).toHaveProperty('id');
            expect(resultado.titulo).toBe('Torta de chocolate');
            expect(resultado.etiquetas).toContain('torta');
        });
    });

    describe('obtenerImagenesPorEtiqueta', () => {
        test('debe filtrar imágenes por etiqueta', async () => {
            await service.crearImagen({
                productoId: 1,
                url: 'img1.jpg',
                titulo: 'Imagen 1',
                etiquetas: ['chocolate'],
                tipo: 'imagen'
            });

            await service.crearImagen({
                productoId: 2,
                url: 'img2.jpg',
                titulo: 'Imagen 2',
                etiquetas: ['vainilla'],
                tipo: 'imagen'
            });

            const resultado = await service.obtenerImagenesPorEtiqueta('chocolate');
            expect(resultado).toHaveLength(1);
            expect(resultado[0].titulo).toBe('Imagen 1');
        });
    });

    describe('agregarEtiqueta', () => {
        test('debe agregar una etiqueta a una imagen existente', async () => {
            const imagen = await service.crearImagen({
                productoId: 1,
                url: 'img.jpg',
                titulo: 'Test',
                etiquetas: ['original'],
                tipo: 'imagen'
            });

            const actualizada = await service.agregarEtiqueta(imagen.id, 'nueva');
            expect(actualizada.etiquetas).toContain('nueva');
            expect(actualizada.etiquetas).toContain('original');
        });
    });

    describe('eliminarImagen', () => {
        test('debe eliminar una imagen correctamente', async () => {
            const imagen = await service.crearImagen({
                productoId: 1,
                url: 'img.jpg',
                titulo: 'Test',
                etiquetas: [],
                tipo: 'imagen'
            });

            await service.eliminarImagen(imagen.id);
            const todas = await service.obtenerTodasLasImagenes();
            expect(todas).toHaveLength(0);
        });
    });
});
