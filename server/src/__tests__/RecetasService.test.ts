import { describe, test, expect, beforeEach } from 'vitest';
import { RecetasService } from '../services/RecetasService';

describe('RecetasService', () => {
    let service: RecetasService;

    beforeEach(() => {
        service = new RecetasService();
    });

    describe('crearReceta', () => {
        test('debe crear una receta correctamente', async () => {
            const receta = {
                nombre: 'Torta de Chocolate',
                ingredientes: [
                    { nombre: 'Harina', cantidad: 500, unidad: 'g' },
                    { nombre: 'Azúcar', cantidad: 300, unidad: 'g' }
                ],
                instrucciones: 'Mezclar y hornear',
                tiempoPreparacion: 60
            };

            const resultado = await service.crearReceta(receta);
            expect(resultado).toHaveProperty('id');
            expect(resultado.nombre).toBe('Torta de Chocolate');
            expect(resultado.ingredientes).toHaveLength(2);
        });
    });

    describe('calcularCostoReceta', () => {
        test('debe calcular el costo total de una receta', async () => {
            const receta = await service.crearReceta({
                nombre: 'Galletas',
                ingredientes: [
                    { nombre: 'Harina', cantidad: 200, unidad: 'g', precioUnitario: 0.05 },
                    { nombre: 'Azúcar', cantidad: 100, unidad: 'g', precioUnitario: 0.03 }
                ],
                instrucciones: 'Mezclar y hornear',
                tiempoPreparacion: 30
            });

            const costo = await service.calcularCostoReceta(receta.id);
            expect(costo).toBe(13); // (200 * 0.05) + (100 * 0.03)
        });
    });

    describe('buscarRecetasPorIngrediente', () => {
        test('debe encontrar recetas que contengan un ingrediente específico', async () => {
            await service.crearReceta({
                nombre: 'Receta 1',
                ingredientes: [{ nombre: 'Chocolate', cantidad: 100, unidad: 'g' }],
                instrucciones: 'Test',
                tiempoPreparacion: 30
            });

            await service.crearReceta({
                nombre: 'Receta 2',
                ingredientes: [{ nombre: 'Vainilla', cantidad: 50, unidad: 'g' }],
                instrucciones: 'Test',
                tiempoPreparacion: 20
            });

            const resultado = await service.buscarRecetasPorIngrediente('Chocolate');
            expect(resultado).toHaveLength(1);
            expect(resultado[0].nombre).toBe('Receta 1');
        });
    });
});
