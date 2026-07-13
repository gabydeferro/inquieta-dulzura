import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreateVenta } = vi.hoisted(() => ({
  mockCreateVenta: vi.fn(),
}));

vi.mock('../../services/VentasService', () => ({
  VentasService: class {
    createVenta = mockCreateVenta;
  },
}));

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../../db', () => ({
  connection: { query: mockQuery },
}));

import { ventaCommand } from '../../bot/handlers/ventas';

function createMockCtx() {
  return {
    reply: vi.fn(),
    message: { text: '' },
  };
}

describe('ventaCommand', () => {
  beforeEach(() => {
    mockCreateVenta.mockReset();
    mockQuery.mockReset();
  });

  it('debe crear venta simple de un producto y confirmar con resumen', async () => {
    // Handler flow: product existence → stock check → stock update (after createVenta)
    mockQuery
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Torta CH', precio: 2500 }]]) // product existence
      .mockResolvedValueOnce([[{ producto_id: 5, cantidad: 10 }]]) // stock check
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // stock update
    mockCreateVenta.mockResolvedValue({
      id: 42,
      total: 2500,
      productos: [{ producto_id: 5, cantidad: 1, producto_nombre: 'Torta CH' }],
    });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/venta 5:1';
    await ventaCommand(ctx);

    // Verify queries: 1 product check + 1 stock check + 1 stock update = 3
    expect(mockQuery).toHaveBeenCalledTimes(3);
    // Verify createVenta was called
    expect(mockCreateVenta).toHaveBeenCalledOnce();
    const ventaData = mockCreateVenta.mock.calls[0][0];
    expect(ventaData.metodo_pago).toBe('efectivo');
    expect(ventaData.productos[0].producto_id).toBe(5);
    expect(ventaData.productos[0].cantidad).toBe(1);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#42');
    expect(replyText).toContain('$2500');
    expect(replyText.toLowerCase()).toContain('venta');
  });

  it('debe crear venta multiple y descuentar stock de cada producto', async () => {
    // Flow: existence(1) → existence(2) → stock(1) → stock(2) → update(1) → update(2)
    mockQuery
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Alfajor', precio: 800 }]])
      .mockResolvedValueOnce([[{ id: 2, nombre: 'Medialuna', precio: 300 }]])
      .mockResolvedValueOnce([[{ producto_id: 1, cantidad: 10 }]])
      .mockResolvedValueOnce([[{ producto_id: 2, cantidad: 20 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    mockCreateVenta.mockResolvedValue({
      id: 43,
      total: 2200,
      productos: [
        { producto_id: 1, cantidad: 2, producto_nombre: 'Alfajor' },
        { producto_id: 2, cantidad: 2, producto_nombre: 'Medialuna' },
      ],
    });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/venta 1:2 2:2';
    await ventaCommand(ctx);

    expect(mockQuery).toHaveBeenCalledTimes(6); // 2 existence + 2 stock checks + 2 stock updates
    expect(mockCreateVenta).toHaveBeenCalledOnce();
    const ventaData = mockCreateVenta.mock.calls[0][0];
    expect(ventaData.productos).toHaveLength(2);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#43');
    expect(replyText).toContain('$2200');
  });

  it('debe rechazar si un producto no existe (sin registro parcial)', async () => {
    // Flow: existence(1) → existence(999, not found) → stop
    mockQuery
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Alfajor', precio: 800 }]]) // product 1 exists
      .mockResolvedValueOnce([[]]); // product 999 NOT found

    const ctx = createMockCtx() as any;
    ctx.message.text = '/venta 1:1 999:1';
    await ventaCommand(ctx);

    // createVenta NO debe haber sido llamada
    expect(mockCreateVenta).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe rechazar si stock insuficiente para algun producto (sin registro parcial)', async () => {
    // Flow: existence(1) → existence(2) → stock(1, enough) → stock(2, NOT enough) → stop
    mockQuery
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Alfajor', precio: 800 }]]) // product 1 exists
      .mockResolvedValueOnce([[{ id: 2, nombre: 'Medialuna', precio: 300 }]]) // product 2 exists
      .mockResolvedValueOnce([[{ producto_id: 1, cantidad: 10 }]]) // stock 1: 10 (enough for 2)
      .mockResolvedValueOnce([[{ producto_id: 2, cantidad: 1 }]]); // stock 2: 1 (NOT enough for 5)

    const ctx = createMockCtx() as any;
    ctx.message.text = '/venta 1:2 2:5';
    await ventaCommand(ctx);

    expect(mockCreateVenta).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(4);
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('stock insuficiente');
    expect(replyText).toContain('#2');
  });

  it('debe responder formato invalido si no hay items', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/venta';
    await ventaCommand(ctx);

    expect(mockCreateVenta).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });

  it('debe rechazar formato invalido de item (falta :cant)', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/venta 5';
    await ventaCommand(ctx);

    expect(mockCreateVenta).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });

  it('debe responder error generico si el service falla', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Test', precio: 100 }]]) // product existence
      .mockResolvedValueOnce([[{ producto_id: 1, cantidad: 10 }]]) // stock check
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // stock update won't be reached
    mockCreateVenta.mockRejectedValue(new Error('DB error'));

    const ctx = createMockCtx() as any;
    ctx.message.text = '/venta 1:1';
    await ventaCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('error');
  });
});
