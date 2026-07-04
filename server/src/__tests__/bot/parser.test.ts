import { describe, it, expect } from 'vitest';

// Import will resolve once implementation exists
import {
  parseCategoriaCrear,
  parseCategoriaEditar,
  parseCategoriaEliminar,
  parseProductosListar,
  parseProductoCrear,
  parseProductoEditar,
  parseIngredienteCrear,
  parseIngredienteEditar,
  parseStockSet,
  parseVenta,
} from '../../bot/parser';

// ───── categoria ─────

describe('parseCategoriaCrear', () => {
  it('debe extraer nombre y descripcion opcional', () => {
    const result = parseCategoriaCrear('/categoria crear Postres Tortas');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ nombre: 'Postres', descripcion: 'Tortas' });
    }
  });

  it('debe extraer solo nombre si no hay descripcion', () => {
    const result = parseCategoriaCrear('/categoria crear Postres');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ nombre: 'Postres', descripcion: undefined });
    }
  });

  it('debe fallar si falta el nombre', () => {
    const result = parseCategoriaCrear('/categoria crear');
    expect(result.success).toBe(false);
  });
});

describe('parseCategoriaEditar', () => {
  it('debe extraer id, nombre y descripcion opcional', () => {
    const result = parseCategoriaEditar('/categoria editar 5 Postres Tortas');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 5, nombre: 'Postres', descripcion: 'Tortas' });
    }
  });

  it('debe extraer id y nombre sin descripcion', () => {
    const result = parseCategoriaEditar('/categoria editar 3 Panes');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 3, nombre: 'Panes', descripcion: undefined });
    }
  });

  it('debe fallar si falta el id', () => {
    const result = parseCategoriaEditar('/categoria editar');
    expect(result.success).toBe(false);
  });
});

describe('parseCategoriaEliminar', () => {
  it('debe extraer id numerico', () => {
    const result = parseCategoriaEliminar('/categoria eliminar 7');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 7 });
    }
  });

  it('debe fallar si no hay id', () => {
    const result = parseCategoriaEliminar('/categoria eliminar');
    expect(result.success).toBe(false);
  });
});

// ───── productos ─────

describe('parseProductosListar', () => {
  it('debe extraer categoria opcional cuando se provee', () => {
    const result = parseProductosListar('/productos 3');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ categoria_id: 3 });
    }
  });

  it('debe funcionar sin categoria (undefined)', () => {
    const result = parseProductosListar('/productos');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ categoria_id: undefined });
    }
  });
});

describe('parseProductoCrear', () => {
  it('debe extraer cat_id, nombre, precio y costo opcional', () => {
    const result = parseProductoCrear('/producto crear 2 Torta CH 2500 1500');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ categoria_id: 2, nombre: 'Torta CH', precio: 2500, costo: 1500 });
    }
  });

  it('debe extraer sin costo', () => {
    const result = parseProductoCrear('/producto crear 1 Alfajor 800');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ categoria_id: 1, nombre: 'Alfajor', precio: 800, costo: undefined });
    }
  });

  it('debe manejar precio con decimales', () => {
    const result = parseProductoCrear('/producto crear 3 Brownie 450.50 200.75');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ categoria_id: 3, nombre: 'Brownie', precio: 450.5, costo: 200.75 });
    }
  });

  it('debe fallar si falta algun parametro requerido', () => {
    const result = parseProductoCrear('/producto crear 2 Torta');
    expect(result.success).toBe(false);
  });
});

describe('parseProductoEditar', () => {
  it('debe extraer id, campo y valor', () => {
    const result = parseProductoEditar('/producto editar 5 precio 1200');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 5, campo: 'precio', valor: '1200' });
    }
  });

  it('debe fallar si faltan parametros', () => {
    const result = parseProductoEditar('/producto editar 5');
    expect(result.success).toBe(false);
  });
});

// ───── ingrediente ─────

describe('parseIngredienteCrear', () => {
  it('debe extraer nombre y costo', () => {
    const result = parseIngredienteCrear('/ingrediente crear Harina 2500');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ nombre: 'Harina', costo: 2500 });
    }
  });

  it('debe manejar costo decimal', () => {
    const result = parseIngredienteCrear('/ingrediente crear Azucar impalpable 1200.50');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ nombre: 'Azucar impalpable', costo: 1200.5 });
    }
  });

  it('debe fallar si falta costo', () => {
    const result = parseIngredienteCrear('/ingrediente crear Harina');
    expect(result.success).toBe(false);
  });
});

describe('parseIngredienteEditar', () => {
  it('debe extraer id, nombre y costo', () => {
    const result = parseIngredienteEditar('/ingrediente editar 3 Harina 2500');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 3, nombre: 'Harina', costo: 2500 });
    }
  });

  it('debe extraer nombre compuesto y costo decimal', () => {
    const result = parseIngredienteEditar('/ingrediente editar 7 Azucar impalpable 1200.50');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 7, nombre: 'Azucar impalpable', costo: 1200.5 });
    }
  });

  it('debe fallar si falta costo', () => {
    const result = parseIngredienteEditar('/ingrediente editar 3 Harina');
    expect(result.success).toBe(false);
  });

  it('debe fallar si falta todo', () => {
    const result = parseIngredienteEditar('/ingrediente editar');
    expect(result.success).toBe(false);
  });
});

// ───── stock ─────

describe('parseStockSet', () => {
  it('debe extraer producto_id y cantidad', () => {
    const result = parseStockSet('/stock set 3 50');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ producto_id: 3, cantidad: 50 });
    }
  });

  it('debe fallar si falta cantidad', () => {
    const result = parseStockSet('/stock set 3');
    expect(result.success).toBe(false);
  });

  it('debe fallar si falta todo', () => {
    const result = parseStockSet('/stock set');
    expect(result.success).toBe(false);
  });
});

// ───── venta ─────

describe('parseVenta', () => {
  it('debe extraer items de venta multiple', () => {
    const result = parseVenta('/venta 1:2 2:1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('1:2 2:1');
    }
  });

  it('debe extraer venta de un solo item', () => {
    const result = parseVenta('/venta 5:3');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('5:3');
    }
  });

  it('debe fallar si no hay items', () => {
    const result = parseVenta('/venta');
    expect(result.success).toBe(false);
  });
});
