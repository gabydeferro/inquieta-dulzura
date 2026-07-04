import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAll, mockGetByCategoriaId, mockGetById, mockCreate, mockUpdate } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockGetByCategoriaId: vi.fn(),
  mockGetById: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('../../services/ProductoService', () => ({
  ProductoService: class {
    getAll = mockGetAll;
    getByCategoriaId = mockGetByCategoriaId;
    getById = mockGetById;
    create = mockCreate;
    update = mockUpdate;
  },
}));

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../../db', () => ({
  connection: { query: mockQuery },
}));

import { productosCommand, productoCrearCommand, productoEditarCommand } from '../../bot/handlers/productos';

function createMockCtx() {
  return {
    reply: vi.fn(),
    message: { text: '' },
  };
}

describe('productosCommand', () => {
  beforeEach(() => {
    mockGetAll.mockReset();
    mockGetByCategoriaId.mockReset();
    mockQuery.mockReset();
  });

  it('debe listar todos los productos con stock si no hay filtro', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, categoria_id: 1, nombre: 'Torta CH', precio: 2500, activo: true },
      { id: 2, categoria_id: 1, nombre: 'Alfajor', precio: 800, activo: true },
    ]);
    mockQuery.mockResolvedValue([
      [{ producto_id: 1, cantidad: 10 }, { producto_id: 2, cantidad: 5 }],
    ]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/productos';
    await productosCommand(ctx);

    expect(mockGetAll).toHaveBeenCalledOnce();
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Torta CH');
    expect(replyText).toContain('Alfajor');
    expect(replyText).toContain('Stock:');
    expect(replyText).toContain('$2500');
  });

  it('debe filtrar productos por categoria_id', async () => {
    mockGetByCategoriaId.mockResolvedValue([
      { id: 3, categoria_id: 2, nombre: 'Medialuna', precio: 300, activo: true },
    ]);
    mockQuery.mockResolvedValue([[{ producto_id: 3, cantidad: 20 }]]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/productos 2';
    await productosCommand(ctx);

    expect(mockGetByCategoriaId).toHaveBeenCalledWith(2);
    expect(mockGetAll).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Medialuna');
  });

  it('debe responder "Sin productos" si no hay resultados', async () => {
    mockGetAll.mockResolvedValue([]);
    mockQuery.mockResolvedValue([[]]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/productos';
    await productosCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('sin producto');
  });

  it('debe mostrar stock 0 si no hay registro en tabla stock', async () => {
    mockGetAll.mockResolvedValue([
      { id: 5, categoria_id: 1, nombre: 'Test', precio: 100, activo: true },
    ]);
    mockQuery.mockResolvedValue([[]]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/productos';
    await productosCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Stock: 0');
  });

  it('debe responder error generico si el service falla', async () => {
    mockGetAll.mockRejectedValue(new Error('DB error'));

    const ctx = createMockCtx() as any;
    ctx.message.text = '/productos';
    await productosCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('error');
  });
});

describe('productoCrearCommand', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockGetById.mockReset();
  });

  it('debe crear producto y confirmar', async () => {
    mockCreate.mockResolvedValue({ id: 15, categoria_id: 1, nombre: 'Torta CH', precio: 2500, activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/producto crear 1 Torta CH 2500';
    await productoCrearCommand(ctx);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      categoria_id: 1,
      nombre: 'Torta CH',
      precio: 2500,
    }));
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#15');
    expect(replyText.toLowerCase()).toContain('creado');
  });

  it('debe crear producto con costo opcional', async () => {
    mockCreate.mockResolvedValue({ id: 16, categoria_id: 2, nombre: 'Brownie', precio: 500, costo: 300, activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/producto crear 2 Brownie 500 300';
    await productoCrearCommand(ctx);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      categoria_id: 2,
      nombre: 'Brownie',
      precio: 500,
      costo: 300,
    }));
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#16');
  });

  it('debe responder formato invalido si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/producto crear';
    await productoCrearCommand(ctx);

    expect(mockCreate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('productoEditarCommand', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockGetById.mockReset();
  });

  it('debe editar producto y confirmar', async () => {
    mockUpdate.mockResolvedValue({ id: 5, categoria_id: 1, nombre: 'Torta CH', precio: 3000, activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/producto editar 5 precio 3000';
    await productoEditarCommand(ctx);

    expect(mockUpdate).toHaveBeenCalledWith(5, expect.objectContaining({ precio: 3000 }));
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#5');
    expect(replyText.toLowerCase()).toContain('actualizado');
  });

  it('debe responder si el producto no existe', async () => {
    mockUpdate.mockResolvedValue(null);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/producto editar 999 nombre Test';
    await productoEditarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe responder formato invalido si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/producto editar';
    await productoEditarCommand(ctx);

    expect(mockUpdate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});
