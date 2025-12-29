import { describe, test, expect, beforeEach } from 'vitest';
import { InventarioService } from '../services/InventarioService';

describe('InventarioService', () => {
    let service: InventarioService;

    beforeEach(() => {
        service = new InventarioService();
    });

    describe('agregarProducto', () => {
        test('debe agregar un producto correctamente', async () => {
            const producto = {
                nombre: 'Harina',
                cantidad: 100,
                unidad: 'kg',
                precioUnitario: 50
            };

            const resultado = await service.agregarProducto(producto);
            expect(resultado).toHaveProperty('id');
            expect(resultado.nombre).toBe('Harina');
        });

        test('debe generar alerta cuando stock es bajo', async () => {
            const producto = {
                nombre: 'Azúcar',
                cantidad: 5,
                unidad: 'kg',
                precioUnitario: 30,
                stockMinimo: 10
            };

            const resultado = await service.agregarProducto(producto);
            expect(resultado.alertaStockBajo).toBe(true);
        });
    });

    describe('actualizarStock', () => {
        test('debe actualizar el stock correctamente', async () => {
            const producto = await service.agregarProducto({
                nombre: 'Mantequilla',
                cantidad: 50,
                unidad: 'kg',
                precioUnitario: 80
            });

            await service.actualizarStock(producto.id, 30);
            const actualizado = await service.obtenerProductoPorId(producto.id);
            expect(actualizado?.cantidad).toBe(30);
        });
    });

    describe('obtenerProductosBajoStock', () => {
        test('debe retornar productos con stock bajo', async () => {
            await service.agregarProducto({
                nombre: 'Producto 1',
                cantidad: 5,
                unidad: 'kg',
                precioUnitario: 10,
                stockMinimo: 10
            });

            await service.agregarProducto({
                nombre: 'Producto 2',
                cantidad: 50,
                unidad: 'kg',
                precioUnitario: 10,
                stockMinimo: 10
            });

            const bajoStock = await service.obtenerProductosBajoStock();
            expect(bajoStock).toHaveLength(1);
            expect(bajoStock[0].nombre).toBe('Producto 1');
        });
    });
});
