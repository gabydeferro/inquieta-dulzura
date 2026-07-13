import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetAll,
  mockGetById,
  mockCreate,
  mockUpdate,
  mockGetProductosByReceta,
  mockVincular,
  mockDesvincular,
  mockQuery,
} = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockGetById: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockGetProductosByReceta: vi.fn(),
  mockVincular: vi.fn(),
  mockDesvincular: vi.fn(),
  mockQuery: vi.fn(),
}));

vi.mock('../../services/RecetaService', () => ({
  RecetaService: class {
    getAll = mockGetAll;
    getById = mockGetById;
    create = mockCreate;
    update = mockUpdate;
    getProductosByReceta = mockGetProductosByReceta;
  },
}));

vi.mock('../../services/ProductoService', () => ({
  ProductoService: class {
    vincular = mockVincular;
    desvincular = mockDesvincular;
  },
}));

vi.mock('../../db', () => ({
  connection: { query: mockQuery },
}));

import {
  recetasCommand,
  recetaVerCommand,
  recetaCrearCommand,
  recetaEditarCommand,
  recetaEliminarCommand,
  recetaIngredienteAgregarCommand,
  recetaIngredienteQuitarCommand,
  recetaIngredienteEditarCommand,
  recetaProductosListarCommand,
  recetaProductoVincularCommand,
  recetaProductoDesvincularCommand,
} from '../../bot/handlers/recetas';

function createMockCtx() {
  return {
    reply: vi.fn(),
    message: { text: '' },
  };
}

describe('recetasCommand', () => {
  beforeEach(() => {
    mockGetAll.mockReset();
  });

  it('debe listar recetas si existen', async () => {
    mockGetAll.mockResolvedValue([
      {
        id: 1,
        nombre: 'Pastel de Chocolate',
        descripcion: 'pastel con cobertura',
        tiempo_preparacion: 45,
        porciones: 8,
        activo: true,
      },
      {
        id: 2,
        nombre: 'Torta de Zanahoria',
        descripcion: 'torta clasica',
        tiempo_preparacion: 60,
        porciones: 12,
        activo: true,
      },
    ]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/recetas';
    await recetasCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Pastel de Chocolate');
    expect(replyText).toContain('Torta de Zanahoria');
    expect(replyText).toContain('45min');
    expect(replyText).toContain('60min');
  });

  it('debe responder "Sin recetas" si no hay', async () => {
    mockGetAll.mockResolvedValue([]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/recetas';
    await recetasCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('sin recetas');
  });

  it('debe responder error generico si el service falla', async () => {
    mockGetAll.mockRejectedValue(new Error('DB error'));

    const ctx = createMockCtx() as any;
    ctx.message.text = '/recetas';
    await recetasCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('error');
  });
});

describe('recetaVerCommand', () => {
  beforeEach(() => {
    mockGetById.mockReset();
  });

  it('debe mostrar detalle de receta con ingredientes', async () => {
    mockGetById.mockResolvedValue({
      id: 5,
      nombre: 'Pastel de Chocolate',
      descripcion: 'pastel con cobertura',
      instrucciones: 'Mezclar y hornear',
      tiempo_preparacion: 45,
      porciones: 8,
      activo: true,
      ingredientes: [
        {
          ingrediente_id: 1,
          cantidad: 200,
          unidad_medida: 'gramos',
          ingrediente: { id: 1, nombre: 'Harina' },
        },
        {
          ingrediente_id: 2,
          cantidad: 3,
          unidad_medida: 'unidades',
          ingrediente: { id: 2, nombre: 'Huevos' },
        },
      ],
    });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta 5';
    await recetaVerCommand(ctx);

    expect(mockGetById).toHaveBeenCalledWith(5);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Pastel de Chocolate');
    expect(replyText).toContain('200');
    expect(replyText).toContain('Harina');
    expect(replyText).toContain('Huevos');
  });

  it('debe responder si receta no existe', async () => {
    mockGetById.mockResolvedValue(null);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta 999';
    await recetaVerCommand(ctx);

    expect(mockGetById).toHaveBeenCalledWith(999);
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('999');
    expect(replyText.toLowerCase()).toContain('no encontrada');
  });

  it('debe responder error de parseo si id no es numerico', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta abc';
    await recetaVerCommand(ctx);

    expect(mockGetById).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('recetaCrearCommand', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('debe crear receta y confirmar', async () => {
    mockCreate.mockResolvedValue({
      id: 10,
      nombre: 'Pastel de Chocolate',
      descripcion: 'pastel con cobertura',
      tiempo_preparacion: 45,
      porciones: 8,
      activo: true,
    });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta crear Pastel de Chocolate Delicioso pastel con cobertura 45 8';
    await recetaCrearCommand(ctx);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Pastel',
        descripcion: 'de Chocolate Delicioso pastel con cobertura',
        tiempo_preparacion: 45,
        porciones: 8,
      }),
    );
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#10');
    expect(replyText.toLowerCase()).toContain('creada');
  });

  it('debe responder formato invalido si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta crear Pastel 30';
    await recetaCrearCommand(ctx);

    expect(mockCreate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('recetaEditarCommand', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  it('debe editar receta y confirmar', async () => {
    mockUpdate.mockResolvedValue({
      id: 5,
      nombre: 'New Name',
      descripcion: 'desc',
      tiempo_preparacion: 30,
      porciones: 8,
      activo: true,
    });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta editar 5 nombre New Name';
    await recetaEditarCommand(ctx);

    expect(mockUpdate).toHaveBeenCalledWith(5, { nombre: 'New Name' });
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#5');
    expect(replyText.toLowerCase()).toContain('actualizada');
  });

  it('debe editar campo numerico tiempo_preparacion', async () => {
    mockUpdate.mockResolvedValue({
      id: 5,
      nombre: 'Pastel',
      descripcion: 'desc',
      tiempo_preparacion: 45,
      porciones: 8,
      activo: true,
    });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta editar 5 tiempo_preparacion 45';
    await recetaEditarCommand(ctx);

    expect(mockUpdate).toHaveBeenCalledWith(5, { tiempo_preparacion: 45 });
  });

  it('debe responder si receta no existe', async () => {
    mockUpdate.mockResolvedValue(null);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta editar 999 nombre X';
    await recetaEditarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('no encontrada');
  });

  it('debe rechazar campo invalido en editar', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta editar 5 invalidField value';
    await recetaEditarCommand(ctx);

    expect(mockUpdate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('campo inv');
  });
});

describe('recetaEliminarCommand', () => {
  beforeEach(() => {
    mockGetById.mockReset();
    mockUpdate.mockReset();
  });

  it('debe eliminar receta (soft-delete) y confirmar', async () => {
    mockGetById.mockResolvedValue({ id: 5, nombre: 'Pastel', activo: true });
    mockUpdate.mockResolvedValue({ id: 5, nombre: 'Pastel', activo: false });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta eliminar 5';
    await recetaEliminarCommand(ctx);

    expect(mockGetById).toHaveBeenCalledWith(5);
    expect(mockUpdate).toHaveBeenCalledWith(5, { activo: false });
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#5');
    expect(replyText.toLowerCase()).toContain('eliminada');
  });

  it('debe responder si receta no existe', async () => {
    mockGetById.mockResolvedValue(null);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta eliminar 999';
    await recetaEliminarCommand(ctx);

    expect(mockGetById).toHaveBeenCalledWith(999);
    expect(mockUpdate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('no encontrada');
  });

  it('debe responder si la receta ya esta inactiva', async () => {
    mockGetById.mockResolvedValue({ id: 5, nombre: 'Pastel', activo: false });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta eliminar 5';
    await recetaEliminarCommand(ctx);

    expect(mockGetById).toHaveBeenCalledWith(5);
    expect(mockUpdate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('ya está inactiva');
  });

  it('debe responder formato invalido si no hay id', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta eliminar';
    await recetaEliminarCommand(ctx);

    expect(mockGetById).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('recetaIngredienteAgregarCommand', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('debe agregar ingrediente a receta y confirmar', async () => {
    // Mock: recipe exists, ingredient exists, not yet linked
    mockQuery
      .mockResolvedValueOnce([[{ id: 5 }]]) // recipe exists
      .mockResolvedValueOnce([[{ id: 3 }]]) // ingredient exists
      .mockResolvedValueOnce([[]]) // no existing link
      .mockResolvedValueOnce([{ affectedRows: 1 }] as any); // INSERT

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente agregar 5 3 200 gramos';
    await recetaIngredienteAgregarCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('agregado');
    expect(replyText).toContain('#5');
    expect(replyText).toContain('#3');
  });

  it('debe rechazar si el ingrediente ya esta vinculado', async () => {
    // Mock: recipe exists, ingredient exists, existing link
    mockQuery
      .mockResolvedValueOnce([[{ id: 5 }]]) // recipe exists
      .mockResolvedValueOnce([[{ id: 3 }]]) // ingredient exists
      .mockResolvedValueOnce([[{ receta_id: 5, ingrediente_id: 3 }]]); // existing link

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente agregar 5 3 100 ml';
    await recetaIngredienteAgregarCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('ya');
    expect(replyText.toLowerCase()).toContain('editar');
  });

  it('debe responder si la receta no existe', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // recipe not found

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente agregar 999 3 200 gramos';
    await recetaIngredienteAgregarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('receta');
    expect(replyText.toLowerCase()).toContain('no encontrada');
  });

  it('debe responder si el ingrediente no existe', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 5 }]]) // recipe exists
      .mockResolvedValueOnce([[]]); // ingredient not found

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente agregar 5 999 200 gramos';
    await recetaIngredienteAgregarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#999');
    expect(replyText.toLowerCase()).toContain('ingrediente');
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe responder error de parseo si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente agregar 5 3';
    await recetaIngredienteAgregarCommand(ctx);

    expect(mockQuery).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('recetaIngredienteQuitarCommand', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('debe quitar ingrediente de receta y confirmar', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente quitar 5 3';
    await recetaIngredienteQuitarCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('quitado');
    expect(replyText).toContain('#5');
    expect(replyText).toContain('#3');
  });

  it('debe responder si el vinculo no existe', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }] as any);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente quitar 5 999';
    await recetaIngredienteQuitarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe responder error de parseo si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente quitar 5';
    await recetaIngredienteQuitarCommand(ctx);

    expect(mockQuery).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('recetaIngredienteEditarCommand', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('debe editar ingrediente de receta y confirmar', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente editar 5 3 500 ml';
    await recetaIngredienteEditarCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('actualizado');
    expect(replyText).toContain('#5');
    expect(replyText).toContain('#3');
  });

  it('debe responder si el vinculo no existe', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }] as any);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente editar 5 999 100 gramos';
    await recetaIngredienteEditarCommand(ctx);

    expect(mockQuery).toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe responder error de parseo si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta ingrediente editar 5 3 ml';
    await recetaIngredienteEditarCommand(ctx);

    expect(mockQuery).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

// ───── receta producto ─────

describe('recetaProductosListarCommand', () => {
  beforeEach(() => {
    mockGetProductosByReceta.mockReset();
  });

  it('debe listar productos vinculados a una receta', async () => {
    mockGetProductosByReceta.mockResolvedValue([
      { producto_id: 1, nombre: 'Pan de masa madre', cantidad_receta: 2 },
      { producto_id: 3, nombre: 'Medialunas', cantidad_receta: 6 },
    ]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta producto listar 5';
    await recetaProductosListarCommand(ctx);

    expect(mockGetProductosByReceta).toHaveBeenCalledWith(5);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('Pan de masa madre');
    expect(replyText).toContain('Medialunas');
    expect(replyText).toContain('2');
    expect(replyText).toContain('6');
  });

  it('debe responder si la receta no tiene productos', async () => {
    mockGetProductosByReceta.mockResolvedValue([]);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta producto listar 5';
    await recetaProductosListarCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('sin productos');
  });

  it('debe responder error de parseo si falta id', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta producto listar';
    await recetaProductosListarCommand(ctx);

    expect(mockGetProductosByReceta).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('recetaProductoVincularCommand', () => {
  beforeEach(() => {
    mockVincular.mockReset();
  });

  it('debe vincular producto a receta y confirmar', async () => {
    mockVincular.mockResolvedValue({ producto_id: 3, receta_id: 5, cantidad_receta: 200 });

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta producto vincular 5 3 200';
    await recetaProductoVincularCommand(ctx);

    expect(mockVincular).toHaveBeenCalledWith(3, 5, 200);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#3');
    expect(replyText).toContain('#5');
    expect(replyText).toContain('200');
    expect(replyText.toLowerCase()).toContain('vinculado');
  });

  it('debe responder error de parseo si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta producto vincular 5 3';
    await recetaProductoVincularCommand(ctx);

    expect(mockVincular).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});

describe('recetaProductoDesvincularCommand', () => {
  beforeEach(() => {
    mockDesvincular.mockReset();
  });

  it('debe desvincular producto de receta y confirmar', async () => {
    mockDesvincular.mockResolvedValue(true);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta producto desvincular 5 3';
    await recetaProductoDesvincularCommand(ctx);

    expect(mockDesvincular).toHaveBeenCalledWith(3, 5);
    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText).toContain('#3');
    expect(replyText).toContain('#5');
    expect(replyText.toLowerCase()).toContain('desvinculado');
  });

  it('debe responder si el vinculo no existe', async () => {
    mockDesvincular.mockResolvedValue(false);

    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta producto desvincular 999 888';
    await recetaProductoDesvincularCommand(ctx);

    expect(mockDesvincular).toHaveBeenCalledWith(888, 999);
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('no encontrado');
  });

  it('debe responder error de parseo si faltan parametros', async () => {
    const ctx = createMockCtx() as any;
    ctx.message.text = '/receta producto desvincular 5';
    await recetaProductoDesvincularCommand(ctx);

    expect(mockDesvincular).not.toHaveBeenCalled();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('formato');
  });
});
