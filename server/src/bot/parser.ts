import { ParseResult } from './types';
import { UnidadMedidaIngrediente } from '../dtos/IngredienteDTO';

/**
 * Extrae parámetros de /categoria crear <nombre> [desc]
 */
export function parseCategoriaCrear(text: string): ParseResult<{ nombre: string; descripcion?: string }> {
  const match = text.match(/^\/categoria crear (.+?)(?:\s+(.+))?$/);
  if (!match) return { success: false, error: 'Formato: /categoria crear <nombre> [descripción]' };
  return { success: true, data: { nombre: match[1], descripcion: match[2] } };
}

/**
 * Extrae parámetros de /categoria editar <id> <nombre> [desc]
 */
export function parseCategoriaEditar(text: string): ParseResult<{ id: number; nombre: string; descripcion?: string }> {
  const match = text.match(/^\/categoria editar (\d+) (.+?)(?:\s+(.+))?$/);
  if (!match) return { success: false, error: 'Formato: /categoria editar <id> <nombre> [descripción]' };
  return { success: true, data: { id: Number(match[1]), nombre: match[2], descripcion: match[3] } };
}

/**
 * Extrae parámetros de /categoria eliminar <id>
 */
export function parseCategoriaEliminar(text: string): ParseResult<{ id: number }> {
  const match = text.match(/^\/categoria eliminar (\d+)$/);
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
  if (!match) return { success: false, error: 'Formato: /producto crear <cat_id> <nombre> <precio> [costo]' };
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
export function parseProductoEditar(text: string): ParseResult<{ id: number; campo: string; valor: string }> {
  const match = text.match(/^\/producto editar (\d+) (\w+) (.+)$/);
  if (!match) return { success: false, error: 'Formato: /producto editar <id> <campo> <valor>' };
  return { success: true, data: { id: Number(match[1]), campo: match[2], valor: match[3] } };
}

const VALID_UNITS = '(kg|gramos|litros|ml|unidades)';

/**
 * Extrae parámetros de /ingrediente crear <nombre> <costo> <unidad>
 */
export function parseIngredienteCrear(text: string): ParseResult<{ nombre: string; costo: number; unidad: UnidadMedidaIngrediente }> {
  const match = text.match(new RegExp(`^\\/ingrediente crear (.+?) (\\d+(?:\\.\\d+)?) ${VALID_UNITS}$`));
  if (!match) return { success: false, error: 'Formato: /ingrediente crear <nombre> <costo> <unidad>. Opciones: kg, gramos, litros, ml, unidades' };
  return { success: true, data: { nombre: match[1], costo: Number(match[2]), unidad: match[3] as UnidadMedidaIngrediente } };
}

/**
 * Extrae parámetros de /ingrediente editar <id> <nombre> <costo> <unidad>
 */
export function parseIngredienteEditar(text: string): ParseResult<{ id: number; nombre: string; costo: number; unidad: UnidadMedidaIngrediente }> {
  const match = text.match(new RegExp(`^\\/ingrediente editar (\\d+) (.+?) (\\d+(?:\\.\\d+)?) ${VALID_UNITS}$`));
  if (!match) return { success: false, error: 'Formato: /ingrediente editar <id> <nombre> <costo> <unidad>. Opciones: kg, gramos, litros, ml, unidades' };
  return { success: true, data: { id: Number(match[1]), nombre: match[2], costo: Number(match[3]), unidad: match[4] as UnidadMedidaIngrediente } };
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
export function parseStockSet(text: string): ParseResult<{ producto_id: number; cantidad: number }> {
  const match = text.match(/^\/stock set (\d+) (\d+)$/);
  if (!match) return { success: false, error: 'Formato: /stock set <producto_id> <cantidad>' };
  return { success: true, data: { producto_id: Number(match[1]), cantidad: Number(match[2]) } };
}

/**
 * Extrae la cadena de items de /venta <id:cant> [id:cant...]
 */
export function parseVenta(text: string): ParseResult<string> {
  const match = text.match(/^\/venta (.+)$/);
  if (!match) return { success: false, error: 'Formato: /venta <id>:<cant> [id:cant...]' };
  return { success: true, data: match[1] };
}
