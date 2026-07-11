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
  parseIngredienteEliminar,
  parseStockSet,
  parseVenta,
  parseRecetasListar,
  parseRecetaVer,
  parseRecetaCrear,
  parseRecetaEditar,
  parseRecetaEliminar,
  parseRecetaIngredienteAgregar,
  parseRecetaIngredienteQuitar,
  parseRecetaIngredienteEditar,
  parseRecetaProductosListar,
  parseRecetaProductoVincular,
  parseRecetaProductoDesvincular,
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
  it('debe extraer nombre, costo y unidad', () => {
    const result = parseIngredienteCrear('/ingrediente crear Harina 2500 kg');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ nombre: 'Harina', costo: 2500, unidad: 'kg' });
    }
  });

  it('debe extraer nombre compuesto, costo decimal y unidad', () => {
    const result = parseIngredienteCrear('/ingrediente crear Azucar impalpable 1200.50 gramos');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ nombre: 'Azucar impalpable', costo: 1200.5, unidad: 'gramos' });
    }
  });

  it('debe aceptar todas las unidades validas', () => {
    const units = ['kg', 'gramos', 'litros', 'ml', 'unidades'];
    for (const unit of units) {
      const result = parseIngredienteCrear(`/ingrediente crear Test 100 ${unit}`);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unidad).toBe(unit);
      }
    }
  });

  it('debe fallar si falta la unidad', () => {
    const result = parseIngredienteCrear('/ingrediente crear Harina 2500');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.toLowerCase()).toContain('unidad');
    }
  });

  it('debe fallar si la unidad es invalida', () => {
    const result = parseIngredienteCrear('/ingrediente crear Harina 2500 litro');
    expect(result.success).toBe(false);
  });

  it('debe fallar si falta costo', () => {
    const result = parseIngredienteCrear('/ingrediente crear Harina kg');
    expect(result.success).toBe(false);
  });
});

describe('parseIngredienteEditar', () => {
  it('debe extraer id, nombre, costo y unidad', () => {
    const result = parseIngredienteEditar('/ingrediente editar 3 Harina 2500 kg');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 3, nombre: 'Harina', costo: 2500, unidad: 'kg' });
    }
  });

  it('debe extraer nombre compuesto, costo decimal y unidad', () => {
    const result = parseIngredienteEditar('/ingrediente editar 7 Azucar impalpable 1200.50 litros');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 7, nombre: 'Azucar impalpable', costo: 1200.5, unidad: 'litros' });
    }
  });

  it('debe aceptar todas las unidades validas en editar', () => {
    const units = ['kg', 'gramos', 'litros', 'ml', 'unidades'];
    for (const unit of units) {
      const result = parseIngredienteEditar(`/ingrediente editar 1 Test 100 ${unit}`);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unidad).toBe(unit);
      }
    }
  });

  it('debe fallar si falta la unidad', () => {
    const result = parseIngredienteEditar('/ingrediente editar 3 Harina 2500');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.toLowerCase()).toContain('unidad');
    }
  });

  it('debe fallar si la unidad es invalida', () => {
    const result = parseIngredienteEditar('/ingrediente editar 3 Harina 2500 kilo');
    expect(result.success).toBe(false);
  });

  it('debe fallar si falta todo', () => {
    const result = parseIngredienteEditar('/ingrediente editar');
    expect(result.success).toBe(false);
  });
});

describe('parseIngredienteEliminar', () => {
  it('debe extraer id numerico', () => {
    const result = parseIngredienteEliminar('/ingrediente eliminar 5');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 5 });
    }
  });

  it('debe fallar si no hay id', () => {
    const result = parseIngredienteEliminar('/ingrediente eliminar');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.toLowerCase()).toContain('formato');
      expect(result.error).toContain('eliminar');
    }
  });

  it('debe fallar si id no es numerico', () => {
    const result = parseIngredienteEliminar('/ingrediente eliminar abc');
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

// ───── recetas ─────

describe('parseRecetasListar', () => {
  it('debe aceptar /recetas sin argumentos', () => {
    const result = parseRecetasListar('/recetas');
    expect(result.success).toBe(true);
  });

  it('debe fallar si hay argumentos extra', () => {
    const result = parseRecetasListar('/recetas 5');
    expect(result.success).toBe(false);
  });
});

describe('parseRecetaVer', () => {
  it('debe extraer id numerico', () => {
    const result = parseRecetaVer('/receta 5');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 5 });
    }
  });

  it('debe fallar si el id no es numerico', () => {
    const result = parseRecetaVer('/receta abc');
    expect(result.success).toBe(false);
  });

  it('debe fallar si falta el id', () => {
    const result = parseRecetaVer('/receta');
    expect(result.success).toBe(false);
  });
});

describe('parseRecetaCrear', () => {
  it('debe extraer nombre (primer palabra), descripcion y ultimos dos numeros', () => {
    const result = parseRecetaCrear('/receta crear Pastel de Chocolate Delicioso pastel con cobertura 45 8');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        nombre: 'Pastel',
        descripcion: 'de Chocolate Delicioso pastel con cobertura',
        tiempo_preparacion: 45,
        porciones: 8,
      });
    }
  });

  it('debe extraer con nombre corto y descripcion simple', () => {
    const result = parseRecetaCrear('/receta crear Torta receta clasica 30 12');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        nombre: 'Torta',
        descripcion: 'receta clasica',
        tiempo_preparacion: 30,
        porciones: 12,
      });
    }
  });

  it('debe fallar si faltan argumentos (menos de 4 tokens tras crear)', () => {
    const result = parseRecetaCrear('/receta crear Pastel 30');
    expect(result.success).toBe(false);
  });

  it('debe fallar si los valores numericos no son numeros', () => {
    const result = parseRecetaCrear('/receta crear Pastel Desc abc ocho');
    expect(result.success).toBe(false);
  });
});

describe('parseRecetaEditar', () => {
  it('debe extraer id, campo y valor', () => {
    const result = parseRecetaEditar('/receta editar 5 nombre New Name');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 5, campo: 'nombre', valor: 'New Name' });
    }
  });

  it('debe aceptar campo tiempo_preparacion', () => {
    const result = parseRecetaEditar('/receta editar 5 tiempo_preparacion 45');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 5, campo: 'tiempo_preparacion', valor: '45' });
    }
  });

  it('debe fallar si el campo no es valido', () => {
    const result = parseRecetaEditar('/receta editar 5 invalidField value');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('nombre');
      expect(result.error).toContain('descripcion');
      expect(result.error).toContain('instrucciones');
      expect(result.error).toContain('tiempo_preparacion');
      expect(result.error).toContain('porciones');
    }
  });

  it('debe fallar si faltan parametros', () => {
    const result = parseRecetaEditar('/receta editar 5');
    expect(result.success).toBe(false);
  });
});

describe('parseRecetaEliminar', () => {
  it('debe extraer id numerico', () => {
    const result = parseRecetaEliminar('/receta eliminar 7');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 7 });
    }
  });

  it('debe fallar si no hay id', () => {
    const result = parseRecetaEliminar('/receta eliminar');
    expect(result.success).toBe(false);
  });

  it('debe fallar si id no es numerico', () => {
    const result = parseRecetaEliminar('/receta eliminar abc');
    expect(result.success).toBe(false);
  });
});

// ───── receta ingrediente ─────

describe('parseRecetaIngredienteAgregar', () => {
  it('debe extraer receta_id, ingrediente_id, cantidad y unidad', () => {
    const result = parseRecetaIngredienteAgregar('/receta ingrediente agregar 5 3 200 gramos');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ receta_id: 5, ingrediente_id: 3, cantidad: 200, unidad_medida: 'gramos' });
    }
  });

  it('debe aceptar todas las unidades validas', () => {
    const units = ['kg', 'gramos', 'litros', 'ml', 'unidades'];
    for (const unit of units) {
      const result = parseRecetaIngredienteAgregar(`/receta ingrediente agregar 1 2 100 ${unit}`);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unidad_medida).toBe(unit);
      }
    }
  });

  it('debe fallar si la unidad es invalida', () => {
    const result = parseRecetaIngredienteAgregar('/receta ingrediente agregar 5 3 200 litro');
    expect(result.success).toBe(false);
  });

  it('debe fallar si falta cantidad', () => {
    const result = parseRecetaIngredienteAgregar('/receta ingrediente agregar 5 3 gramos');
    expect(result.success).toBe(false);
  });

  it('debe fallar si faltan todos los argumentos', () => {
    const result = parseRecetaIngredienteAgregar('/receta ingrediente agregar');
    expect(result.success).toBe(false);
  });
});

describe('parseRecetaIngredienteQuitar', () => {
  it('debe extraer receta_id e ingrediente_id', () => {
    const result = parseRecetaIngredienteQuitar('/receta ingrediente quitar 5 3');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ receta_id: 5, ingrediente_id: 3 });
    }
  });

  it('debe fallar si falta algun id', () => {
    const result = parseRecetaIngredienteQuitar('/receta ingrediente quitar 5');
    expect(result.success).toBe(false);
  });

  it('debe fallar si los ids no son numericos', () => {
    const result = parseRecetaIngredienteQuitar('/receta ingrediente quitar abc def');
    expect(result.success).toBe(false);
  });
});

describe('parseRecetaIngredienteEditar', () => {
  it('debe extraer receta_id, ingrediente_id, cantidad y unidad', () => {
    const result = parseRecetaIngredienteEditar('/receta ingrediente editar 5 3 500 ml');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ receta_id: 5, ingrediente_id: 3, cantidad: 500, unidad_medida: 'ml' });
    }
  });

  it('debe aceptar todas las unidades validas en editar', () => {
    const units = ['kg', 'gramos', 'litros', 'ml', 'unidades'];
    for (const unit of units) {
      const result = parseRecetaIngredienteEditar(`/receta ingrediente editar 1 2 100 ${unit}`);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unidad_medida).toBe(unit);
      }
    }
  });

  it('debe fallar si la unidad es invalida', () => {
    const result = parseRecetaIngredienteEditar('/receta ingrediente editar 5 3 200 litro');
    expect(result.success).toBe(false);
  });

  it('debe fallar si falta cantidad', () => {
    const result = parseRecetaIngredienteEditar('/receta ingrediente editar 5 3 ml');
    expect(result.success).toBe(false);
  });

  it('debe fallar si falta todo', () => {
    const result = parseRecetaIngredienteEditar('/receta ingrediente editar');
    expect(result.success).toBe(false);
  });
});

// ───── receta producto ─────

describe('parseRecetaProductosListar', () => {
  it('debe parsear /receta producto listar <id>', () => {
    const result = parseRecetaProductosListar('/receta producto listar 5');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.receta_id).toBe(5);
    }
  });

  it('debe fallar sin id', () => {
    const result = parseRecetaProductosListar('/receta producto listar');
    expect(result.success).toBe(false);
  });

  it('debe fallar con id no numerico', () => {
    const result = parseRecetaProductosListar('/receta producto listar abc');
    expect(result.success).toBe(false);
  });
});

describe('parseRecetaProductoVincular', () => {
  it('debe parsear /receta producto vincular <receta_id> <producto_id> <cantidad>', () => {
    const result = parseRecetaProductoVincular('/receta producto vincular 5 3 200');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.receta_id).toBe(5);
      expect(result.data.producto_id).toBe(3);
      expect(result.data.cantidad_receta).toBe(200);
    }
  });

  it('debe aceptar cantidad decimal', () => {
    const result = parseRecetaProductoVincular('/receta producto vincular 1 2 1.5');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cantidad_receta).toBe(1.5);
    }
  });

  it('debe fallar si faltan parametros', () => {
    const result = parseRecetaProductoVincular('/receta producto vincular 5 3');
    expect(result.success).toBe(false);
  });

  it('debe fallar con id no numerico', () => {
    const result = parseRecetaProductoVincular('/receta producto vincular abc 3 200');
    expect(result.success).toBe(false);
  });
});

describe('parseRecetaProductoDesvincular', () => {
  it('debe parsear /receta producto desvincular <receta_id> <producto_id>', () => {
    const result = parseRecetaProductoDesvincular('/receta producto desvincular 5 3');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.receta_id).toBe(5);
      expect(result.data.producto_id).toBe(3);
    }
  });

  it('debe fallar si faltan parametros', () => {
    const result = parseRecetaProductoDesvincular('/receta producto desvincular 5');
    expect(result.success).toBe(false);
  });

  it('debe fallar con ids no numericos', () => {
    const result = parseRecetaProductoDesvincular('/receta producto desvincular abc def');
    expect(result.success).toBe(false);
  });
});
