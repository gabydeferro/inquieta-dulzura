import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../../db', () => ({
  connection: { query: mockQuery },
}));

import { stockCommand, stockSetCommand } from '../../bot/handlers/stock';

function createMockCtx() {
  return {
    reply: vi.fn(),
    message: { text: '' },
  };
}

describe('stockCommand', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('debe listar productos con stock bajo el limite por defecto (5)', async () => {
    mockQuery.mockResolvedValueOnce([
      [
        { producto_id: 3, cantidad: 2, producto_nombre: 'Torta CH', categoria_nombre: 'Tortas' },
        { producto_id: 7, cantidad: 1, producto_nombre: 'Alfajor', categoria_nombre: 'Pastelería' },
      ],
    ]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/stock';
    await stockCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Torta CH');
    expect(replyText).toContain('Alfajor');
    expect(replyText).toContain('Tortas');
    expect(replyText).toContain('Pastelería');
    expect(replyText).toContain('Stock');
    expect(replyText).toContain('bajo');
  });

  it('debe usar el limite personalizado si se pasa como argumento', async () => {
    mockQuery.mockResolvedValueOnce([
      [
        { producto_id: 9, cantidad: 8, producto_nombre: 'Medialuna', categoria_nombre: 'Panadería' },
      ],
    ]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/stock 10';
    await stockCommand(ctx);

    expect(mockQuery).toHaveBeenCalled();
    // Verify the query uses the custom limit as bound param
    const params: number[] = mockQuery.mock.calls[0][1];
    expect(params).toContain(10);
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Medialuna');
  });

  it('debe responder "Sin productos con stock bajo" si no hay resultados', async () => {
    mockQuery.mockResolvedValueOnce([[]]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/stock';
    await stockCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('sin producto');
  });

  it('debe responder error generico si la query falla', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const ctx = createMockCtx() as any;
    ctx.message.text = '/stock';
    await stockCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('error');
  });
});

describe('stockSetCommand', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('debe actualizar stock y confirmar', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 5 }]]) // producto existe
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // update stock

    const ctx = createMockCtx() as any;
    ctx.message.text = '/stock set 5 15';
    await stockSetCommand(ctx);

    expect(mockQuery).toHaveBeenCalledTimes(2);
    // First call: verify product exists
    expect(mockQuery.mock.calls[0][1]).toEqual([5]);
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#5');
    expect(replyText).toContain('15');
    expect(replyText.toLowerCase()).toContain('actualizado');
  });

  it('debe rechazar si el producto no existe', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // producto no existe

    const ctx = createMockCtx() as any;
    ctx.message.text = '/stock set 999 10';
    await stockSetCommand(ctx);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe rechazar si la cantidad es negativa', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/stock set 5 -1';
    await stockSetCommand(ctx);

    expect(mockQuery).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });

  it('debe responder formato invalido si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/stock set';
    await stockSetCommand(ctx);

    expect(mockQuery).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});
