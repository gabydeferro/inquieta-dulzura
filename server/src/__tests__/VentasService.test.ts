import { describe, test, expect, beforeEach } from 'vitest';
import { VentasService } from '../services/VentasService';

describe('VentasService', () => {
    let service: VentasService;

    beforeEach(() => {
        service = new VentasService();
    });

    describe('registrarVenta', () => {
        test('debe registrar una venta correctamente', async () => {
            const venta = {
                productos: [
                    { id: 1, nombre: 'Torta', cantidad: 2, precio: 500 }
                ],
                total: 1000,
                fecha: new Date()
            };

            const resultado = await service.registrarVenta(venta);
            expect(resultado).toHaveProperty('id');
            expect(resultado.total).toBe(1000);
        });

        test('debe calcular el total correctamente', async () => {
            const venta = {
                productos: [
                    { id: 1, nombre: 'Torta', cantidad: 2, precio: 500 },
                    { id: 2, nombre: 'Galletas', cantidad: 3, precio: 100 }
                ],
                total: 0,
                fecha: new Date()
            };

            const resultado = await service.registrarVenta(venta);
            expect(resultado.total).toBe(1300); // (2*500) + (3*100)
        });
    });

    describe('obtenerVentasPorFecha', () => {
        test('debe filtrar ventas por rango de fechas', async () => {
            const hoy = new Date();
            const ayer = new Date(hoy);
            ayer.setDate(ayer.getDate() - 1);

            await service.registrarVenta({
                productos: [{ id: 1, nombre: 'Test', cantidad: 1, precio: 100 }],
                total: 100,
                fecha: hoy
            });

            await service.registrarVenta({
                productos: [{ id: 2, nombre: 'Test2', cantidad: 1, precio: 200 }],
                total: 200,
                fecha: ayer
            });

            const ventasHoy = await service.obtenerVentasPorFecha(hoy, hoy);
            expect(ventasHoy).toHaveLength(1);
            expect(ventasHoy[0].total).toBe(100);
        });
    });

    describe('calcularTotalVentas', () => {
        test('debe calcular el total de ventas en un período', async () => {
            const fecha = new Date();

            await service.registrarVenta({
                productos: [{ id: 1, nombre: 'Test', cantidad: 1, precio: 100 }],
                total: 100,
                fecha
            });

            await service.registrarVenta({
                productos: [{ id: 2, nombre: 'Test2', cantidad: 1, precio: 200 }],
                total: 200,
                fecha
            });

            const total = await service.calcularTotalVentas(fecha, fecha);
            expect(total).toBe(300);
        });
    });
});
