import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAll, mockCreate, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('../../services/CategoriaService', () => ({
  CategoriaService: class {
    getAll = mockGetAll;
    getById = vi.fn();
    create = mockCreate;
    update = mockUpdate;
    delete = mockDelete;
  },
}));

import { categoriasCommand, categoriaCrearCommand, categoriaEditarCommand, categoriaEliminarCommand } from '../../bot/handlers/categorias';

function createMockCtx() {
  return {
    reply: vi.fn(),
    message: { text: '' },
  };
}

describe('categoriasCommand', () => {
  beforeEach(() => {
    mockGetAll.mockReset();
  });

  it('debe listar categorias como tabla si existen', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, nombre: 'Tortas', descripcion: 'Tortas y postres', activo: true },
      { id: 2, nombre: 'Panes', descripcion: 'Panaderia', activo: true },
    ]);

    const ctx = createMockCtx() as any;
    await categoriasCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('`1`');
    expect(replyText).toContain('Tortas');
    expect(replyText).toContain('Panes');
    expect(replyText).toContain('Tortas y postres');
  });

  it('debe responder "Sin categorias" si no hay categorias', async () => {
    mockGetAll.mockResolvedValue([]);

    const ctx = createMockCtx() as any;
    await categoriasCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('sin categor');
  });

  it('debe responder error generico si el service falla', async () => {
    mockGetAll.mockRejectedValue(new Error('DB error'));

    const ctx = createMockCtx() as any;
    await categoriasCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('error');
  });
});

describe('categoriaCrearCommand', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('debe crear categoria y responder con ID', async () => {
    mockCreate.mockResolvedValue({ id: 5, nombre: 'Galletas', descripcion: undefined, activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria crear Galletas';
    await categoriaCrearCommand(ctx);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Galletas' }));
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#5');
    expect(replyText.toLowerCase()).toContain('creada');
  });

  it('debe crear categoria con descripcion opcional', async () => {
    mockCreate.mockResolvedValue({ id: 10, nombre: 'Galletas', descripcion: 'Finas', activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria crear Galletas Finas';
    await categoriaCrearCommand(ctx);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Galletas', descripcion: 'Finas' }));
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#10');
  });

  it('debe responder con sintaxis si falta el nombre', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria crear';
    await categoriaCrearCommand(ctx);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('categoriaEditarCommand', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  it('debe editar categoria y confirmar', async () => {
    mockUpdate.mockResolvedValue({ id: 3, nombre: 'Panaderia', descripcion: 'Pan artesanal', activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria editar 3 Panaderia Pan artesanal';
    await categoriaEditarCommand(ctx);

    expect(mockUpdate).toHaveBeenCalledWith(3, expect.objectContaining({ nombre: 'Panaderia', descripcion: 'Pan artesanal' }));
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#3');
    expect(replyText.toLowerCase()).toContain('actualizada');
  });

  it('debe responder si categoria no existe', async () => {
    mockUpdate.mockResolvedValue(null);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria editar 999 Inexistente';
    await categoriaEditarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('no encontrada');
  });

  it('debe responder formato invalido si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria editar';
    await categoriaEditarCommand(ctx);

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('categoriaEliminarCommand', () => {
  beforeEach(() => {
    mockDelete.mockReset();
  });

  it('debe eliminar categoria y confirmar', async () => {
    mockDelete.mockResolvedValue(true);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria eliminar 7';
    await categoriaEliminarCommand(ctx);

    expect(mockDelete).toHaveBeenCalledWith(7);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#7');
    expect(replyText.toLowerCase()).toContain('eliminada');
  });

  it('debe responder "tiene productos asociados" si el delete falla por FK', async () => {
    mockDelete.mockRejectedValue(new Error('Cannot delete or update a parent row'));

    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria eliminar 5';
    await categoriaEliminarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('productos');
  });

  it('debe responder formato invalido si no hay id', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/categoria eliminar';
    await categoriaEliminarCommand(ctx);

    expect(mockDelete).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});
