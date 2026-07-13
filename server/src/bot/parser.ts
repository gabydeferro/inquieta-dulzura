import { ParseResult } from './types';
import { UnidadMedidaIngrediente } from '../dtos/IngredienteDTO';

/**
 * Extrae parámetros de /categoria crear <nombre> [desc]
 */
export function parseCategoriaCrear(
  text: string,
): ParseResult<{ nombre: string; descripcion?: string }> {
  const normalized = text.replace(/í/g, 'i');
  const match = normalized.match(/^\/categoria crear (.+?)(?:\s+(.+))?$/);
  if (!match) return { success: false, error: 'Formato: /categoria crear <nombre> [descripción]' };
  return { success: true, data: { nombre: match[1], descripcion: match[2] } };
}

/**
 * Extrae parámetros de /categoria editar <id> <nombre> [desc]
 */
export function parseCategoriaEditar(
  text: string,
): ParseResult<{ id: number; nombre: string; descripcion?: string }> {
  const normalized = text.replace(/í/g, 'i');
  const match = normalized.match(/^\/categoria editar (\d+) (.+?)(?:\s+(.+))?$/);
  if (!match)
    return { success: false, error: 'Formato: /categoria editar <id> <nombre> [descripción]' };
  return { success: true, data: { id: Number(match[1]), nombre: match[2], descripcion: match[3] } };
}

/**
 * Extrae parámetros de /categoria eliminar <id>
 */
export function parseCategoriaEliminar(text: string): ParseResult<{ id: number }> {
  const normalized = text.replace(/í/g, 'i');
  const match = normalized.match(/^\/categoria eliminar (\d+)$/);
  if (!match) return { success: false, error: 'Formato: /categoria eliminar <id>' };
  return { success: true, data: { id: Number(match[1]) } };
}

/**
 * Extrae el filtro opcional de /productos [cat_id]
 */
export function parseProductosListar(text: string): ParseResult<{ categoria_id?: number }> {
  const match = text.match(/^\/productos\s*(\d+)?$/);
  if (!match) return { success: false, error: 'Formato: /productos [id_categoría]' };
  return { success: true, data: { categoria_id: match[1] ? Number(match[1]) : undefined } };
}

/**
 * Extrae parámetros de /producto crear <cat_id> <nombre> <precio> [costo]
 */
export function parseProductoCrear(
  text: string,
): ParseResult<{ categoria_id: number; nombre: string; precio: number; costo?: number }> {
  const match = text.match(/^\/producto crear (\d+) (.+?) (\d+(?:\.\d+)?)(?:\s+(\d+(?:\.\d+)?))?$/);
  if (!match)
    return { success: false, error: 'Formato: /producto crear <cat_id> <nombre> <precio> [costo]' };
  return {
    success: true,
    data: {
      categoria_id: Number(match[1]),
      nombre: match[2],
      precio: Number(match[3]),
      costo: match[4] ? Number(match[4]) : undefined,
    },
  };
}

/**
 * Extrae parámetros de /producto editar <id> <campo> <valor>
 */
export function parseProductoEditar(
  text: string,
): ParseResult<{ id: number; campo: string; valor: string }> {
  const match = text.match(/^\/producto editar (\d+) (\w+) (.+)$/);
  if (!match) return { success: false, error: 'Formato: /producto editar <id> <campo> <valor>' };
  return { success: true, data: { id: Number(match[1]), campo: match[2], valor: match[3] } };
}

/**
 * Extrae parámetros de /producto eliminar <id>
 */
export function parseProductoEliminar(text: string): ParseResult<{ id: number }> {
  const match = text.match(/^\/producto eliminar (\d+)$/);
  if (!match) return { success: false, error: 'Formato: /producto eliminar <id>' };
  return { success: true, data: { id: Number(match[1]) } };
}

const VALID_UNITS = '(kg|gramos|litros|ml|unidades)';

/**
 * Extrae parámetros de /ingrediente crear <nombre> <costo> <unidad>
 */
export function parseIngredienteCrear(
  text: string,
): ParseResult<{ nombre: string; costo: number; unidad: UnidadMedidaIngrediente }> {
  const match = text.match(
    new RegExp(`^\\/ingrediente crear (.+?) (\\d+(?:\\.\\d+)?) ${VALID_UNITS}$`),
  );
  if (!match)
    return {
      success: false,
      error:
        'Formato: /ingrediente crear <nombre> <costo> <unidad>. Opciones: kg, gramos, litros, ml, unidades',
    };
  return {
    success: true,
    data: {
      nombre: match[1],
      costo: Number(match[2]),
      unidad: match[3] as UnidadMedidaIngrediente,
    },
  };
}

/**
 * Extrae parámetros de /ingrediente editar <id> <nombre> <costo> <unidad>
 */
export function parseIngredienteEditar(
  text: string,
): ParseResult<{ id: number; nombre: string; costo: number; unidad: UnidadMedidaIngrediente }> {
  const match = text.match(
    new RegExp(`^\\/ingrediente editar (\\d+) (.+?) (\\d+(?:\\.\\d+)?) ${VALID_UNITS}$`),
  );
  if (!match)
    return {
      success: false,
      error:
        'Formato: /ingrediente editar <id> <nombre> <costo> <unidad>. Opciones: kg, gramos, litros, ml, unidades',
    };
  return {
    success: true,
    data: {
      id: Number(match[1]),
      nombre: match[2],
      costo: Number(match[3]),
      unidad: match[4] as UnidadMedidaIngrediente,
    },
  };
}

/**
 * Extrae parámetros de /ingrediente eliminar <id>
 */
export function parseIngredienteEliminar(text: string): ParseResult<{ id: number }> {
  const match = text.match(/^\/ingrediente eliminar (\d+)$/);
  if (!match) return { success: false, error: 'Formato: /ingrediente eliminar <id>' };
  return { success: true, data: { id: Number(match[1]) } };
}

/**
 * Extrae parámetros de /stock set <producto_id> <cantidad>
 */
export function parseStockSet(
  text: string,
): ParseResult<{ producto_id: number; cantidad: number }> {
  const match = text.match(/^\/stock set (\d+) (\d+)$/);
  if (!match) return { success: false, error: 'Formato: /stock set <producto_id> <cantidad>' };
  return { success: true, data: { producto_id: Number(match[1]), cantidad: Number(match[2]) } };
}

// ───── recetas ─────

const VALID_CAMPOS_RECETA = [
  'nombre',
  'descripcion',
  'instrucciones',
  'tiempo_preparacion',
  'porciones',
];

/**
 * Extrae parámetros de /recetas (listar)
 */
export function parseRecetasListar(text: string): ParseResult<Record<string, never>> {
  const match = text.match(/^\/recetas$/);
  if (!match) return { success: false, error: 'Formato: /recetas' };
  return { success: true, data: {} };
}

/**
 * Extrae parámetros de /receta <id>
 */
export function parseRecetaVer(text: string): ParseResult<{ id: number }> {
  const match = text.match(/^\/receta (\d+)$/);
  if (!match) return { success: false, error: 'Formato: /receta <id>' };
  return { success: true, data: { id: Number(match[1]) } };
}

/**
 * Extrae parámetros de /receta crear <nombre> <descripcion> <tiempo_preparacion> <porciones>
 * Primera palabra = nombre, resto antes de los 2 últimos números = descripción
 */
export function parseRecetaCrear(text: string): ParseResult<{
  nombre: string;
  descripcion: string;
  tiempo_preparacion: number;
  porciones: number;
}> {
  const match = text.match(/^\/receta crear (\S+) (.+) (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)$/);
  if (!match)
    return {
      success: false,
      error: 'Formato: /receta crear <nombre> <descripción> <tiempo_preparacion> <porciones>',
    };
  return {
    success: true,
    data: {
      nombre: match[1],
      descripcion: match[2],
      tiempo_preparacion: Number(match[3]),
      porciones: Number(match[4]),
    },
  };
}

/**
 * Extrae parámetros de /receta editar <id> <campo> <valor>
 */
export function parseRecetaEditar(
  text: string,
): ParseResult<{ id: number; campo: string; valor: string }> {
  const match = text.match(/^\/receta editar (\d+) (\w+) (.+)$/);
  if (!match) return { success: false, error: 'Formato: /receta editar <id> <campo> <valor>' };
  const campo = match[2];
  if (!VALID_CAMPOS_RECETA.includes(campo)) {
    return {
      success: false,
      error: `Campo inválido: "${campo}". Opciones: ${VALID_CAMPOS_RECETA.join(', ')}`,
    };
  }
  return { success: true, data: { id: Number(match[1]), campo, valor: match[3] } };
}

/**
 * Extrae parámetros de /receta eliminar <id>
 */
export function parseRecetaEliminar(text: string): ParseResult<{ id: number }> {
  const match = text.match(/^\/receta eliminar (\d+)$/);
  if (!match) return { success: false, error: 'Formato: /receta eliminar <id>' };
  return { success: true, data: { id: Number(match[1]) } };
}

const RECETA_UNITS = '(kg|gramos|litros|ml|unidades)';

/**
 * Extrae parámetros de /receta ingrediente agregar <receta_id> <ingrediente_id> <cantidad> <unidad>
 */
export function parseRecetaIngredienteAgregar(text: string): ParseResult<{
  receta_id: number;
  ingrediente_id: number;
  cantidad: number;
  unidad_medida: string;
}> {
  const match = text.match(
    new RegExp(`^\\/receta ingrediente agregar (\\d+) (\\d+) (\\d+(?:\\.\\d+)?) ${RECETA_UNITS}$`),
  );
  if (!match)
    return {
      success: false,
      error:
        'Formato: /receta ingrediente agregar <receta_id> <ingrediente_id> <cantidad> <unidad>. Opciones: kg, gramos, litros, ml, unidades',
    };
  return {
    success: true,
    data: {
      receta_id: Number(match[1]),
      ingrediente_id: Number(match[2]),
      cantidad: Number(match[3]),
      unidad_medida: match[4],
    },
  };
}

/**
 * Extrae parámetros de /receta ingrediente quitar <receta_id> <ingrediente_id>
 */
export function parseRecetaIngredienteQuitar(
  text: string,
): ParseResult<{ receta_id: number; ingrediente_id: number }> {
  const match = text.match(/^\/receta ingrediente quitar (\d+) (\d+)$/);
  if (!match)
    return {
      success: false,
      error: 'Formato: /receta ingrediente quitar <receta_id> <ingrediente_id>',
    };
  return {
    success: true,
    data: {
      receta_id: Number(match[1]),
      ingrediente_id: Number(match[2]),
    },
  };
}

/**
 * Extrae parámetros de /receta ingrediente editar <receta_id> <ingrediente_id> <cantidad> <unidad>
 */
export function parseRecetaIngredienteEditar(text: string): ParseResult<{
  receta_id: number;
  ingrediente_id: number;
  cantidad: number;
  unidad_medida: string;
}> {
  const match = text.match(
    new RegExp(`^\\/receta ingrediente editar (\\d+) (\\d+) (\\d+(?:\\.\\d+)?) ${RECETA_UNITS}$`),
  );
  if (!match)
    return {
      success: false,
      error:
        'Formato: /receta ingrediente editar <receta_id> <ingrediente_id> <cantidad> <unidad>. Opciones: kg, gramos, litros, ml, unidades',
    };
  return {
    success: true,
    data: {
      receta_id: Number(match[1]),
      ingrediente_id: Number(match[2]),
      cantidad: Number(match[3]),
      unidad_medida: match[4],
    },
  };
}

/**
 * Extrae parámetros de /receta producto listar <receta_id>
 */
export function parseRecetaProductosListar(text: string): ParseResult<{ receta_id: number }> {
  const match = text.match(/^\/receta producto listar (\d+)$/);
  if (!match) return { success: false, error: 'Formato: /receta producto listar <receta_id>' };
  return { success: true, data: { receta_id: Number(match[1]) } };
}

/**
 * Extrae parámetros de /receta producto vincular <receta_id> <producto_id> <cantidad>
 */
export function parseRecetaProductoVincular(
  text: string,
): ParseResult<{ receta_id: number; producto_id: number; cantidad_receta: number }> {
  const match = text.match(/^\/receta producto vincular (\d+) (\d+) (\d+(?:\.\d+)?)$/);
  if (!match)
    return {
      success: false,
      error: 'Formato: /receta producto vincular <receta_id> <producto_id> <cantidad>',
    };
  return {
    success: true,
    data: {
      receta_id: Number(match[1]),
      producto_id: Number(match[2]),
      cantidad_receta: Number(match[3]),
    },
  };
}

/**
 * Extrae parámetros de /receta producto desvincular <receta_id> <producto_id>
 */
export function parseRecetaProductoDesvincular(
  text: string,
): ParseResult<{ receta_id: number; producto_id: number }> {
  const match = text.match(/^\/receta producto desvincular (\d+) (\d+)$/);
  if (!match)
    return {
      success: false,
      error: 'Formato: /receta producto desvincular <receta_id> <producto_id>',
    };
  return { success: true, data: { receta_id: Number(match[1]), producto_id: Number(match[2]) } };
}

/**
 * Extrae la cadena de items de /venta <id:cant> [id:cant...]
 */
export function parseVenta(text: string): ParseResult<string> {
  const match = text.match(/^\/venta (.+)$/);
  if (!match) return { success: false, error: 'Formato: /venta <id>:<cant> [id:cant...]' };
  return { success: true, data: match[1] };
}
