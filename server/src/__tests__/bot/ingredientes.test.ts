import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAll, mockGetById, mockCreate, mockUpdate } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockGetById: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('../../services/IngredienteService', () => ({
  IngredienteService: class {
    getAll = mockGetAll;
    getById = mockGetById;
    create = mockCreate;
    update = mockUpdate;
  },
}));

import { ingredientesCommand, ingredienteCrearCommand, ingredienteEditarCommand } from '../../bot/handlers/ingredientes';

function createMockCtx() {
  return {
    reply: vi.fn(),
    message: { text: '' },
  };
}

describe('ingredientesCommand', () => {
  beforeEach(() => {
    mockGetAll.mockReset();
  });

  it('debe listar ingredientes si existen', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, nombre: 'Harina', costo_unitario: 1500, unidad_medida: 'kg', activo: true },
      { id: 2, nombre: 'Azucar', costo_unitario: 1200, unidad_medida: 'kg', activo: true },
    ]);

    const ctx = createMockCtx() as any;
    await ingredientesCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Harina');
    expect(replyText).toContain('Azucar');
    expect(replyText).toContain('$1500');
    expect(replyText).toContain('$1200');
  });

  it('debe responder "Sin ingredientes" si no hay', async () => {
    mockGetAll.mockResolvedValue([]);

    const ctx = createMockCtx() as any;
    await ingredientesCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('sin ingrediente');
  });

  it('debe responder error generico si el service falla', async () => {
    mockGetAll.mockRejectedValue(new Error('DB error'));

    const ctx = createMockCtx() as any;
    await ingredientesCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('error');
  });
});

describe('ingredienteCrearCommand', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('debe crear ingrediente y confirmar con costo', async () => {
    mockCreate.mockResolvedValue({ id: 10, nombre: 'Harina', costo_unitario: 2500, unidad_medida: 'unidades', activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/ingrediente crear Harina 2500';
    await ingredienteCrearCommand(ctx);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Harina',
      costo_unitario: 2500,
    }));
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#10');
    expect(replyText).toContain('Harina');
    expect(replyText).toContain('$2500');
    expect(replyText.toLowerCase()).toContain('creado');
  });

  it('debe crear ingrediente con nombre compuesto', async () => {
    mockCreate.mockResolvedValue({ id: 11, nombre: 'Azucar impalpable', costo_unitario: 1200.5, unidad_medida: 'unidades', activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/ingrediente crear Azucar impalpable 1200.50';
    await ingredienteCrearCommand(ctx);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Azucar impalpable',
      costo_unitario: 1200.5,
    }));
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('$1200.5');
  });

  it('debe responder formato invalido si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/ingrediente crear';
    await ingredienteCrearCommand(ctx);

    expect(mockCreate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('ingredienteEditarCommand', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  it('debe editar ingrediente y confirmar', async () => {
    mockUpdate.mockResolvedValue({ id: 3, nombre: 'Harina integral', costo_unitario: 1800, unidad_medida: 'kg', activo: true });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/ingrediente editar 3 Harina integral 1800';
    await ingredienteEditarCommand(ctx);

    expect(mockUpdate).toHaveBeenCalledWith(3, expect.objectContaining({
      nombre: 'Harina integral',
      costo_unitario: 1800,
    }));
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#3');
    expect(replyText.toLowerCase()).toContain('actualizado');
  });

  it('debe responder si ingrediente no existe', async () => {
    mockUpdate.mockResolvedValue(null);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/ingrediente editar 999 Inexistente 1000';
    await ingredienteEditarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe responder formato invalido si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/ingrediente editar';
    await ingredienteEditarCommand(ctx);

    expect(mockUpdate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});
