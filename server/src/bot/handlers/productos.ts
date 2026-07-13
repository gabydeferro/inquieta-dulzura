import { Context } from 'grammy';
import { ProductoService } from '../../services/ProductoService';
import {
  parseProductosListar,
  parseProductoCrear,
  parseProductoEditar,
  parseProductoEliminar,
} from '../parser';
import { connection } from '../../db';
import { RowDataPacket } from 'mysql2';

const productoService = new ProductoService();

interface StockRow {
  producto_id: number;
  cantidad_disponible: number;
}

/**
 * Obtiene el stock actual de todos los productos desde la tabla stock
 */
async function getStockMap(): Promise<Map<number, number>> {
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT producto_id, cantidad_disponible FROM stock',
    );
    const map = new Map<number, number>();
    for (const row of rows as StockRow[]) {
      map.set(row.producto_id, row.cantidad_disponible);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Handler para /productos [cat_id] — lista productos con stock
 */
export async function productosCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseProductosListar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const productos = parsed.data.categoria_id
      ? await productoService.getByCategoriaId(parsed.data.categoria_id)
      : await productoService.getAll();

    if (productos.length === 0) {
      await ctx.reply('Sin productos registrados.');
      return;
    }

    const stockMap = await getStockMap();

    const lines = productos.map((p) => {
      const stock = stockMap.get(p.id) ?? 0;
      return `\`${p.id}\` • *${p.nombre}* — $${p.precio} | Stock: ${stock}`;
    });

    await ctx.reply(`🥐 *Productos*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error en productosCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /producto crear <cat_id> <nombre> <precio> [costo]
 */
export async function productoCrearCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseProductoCrear(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const producto = await productoService.create({
      categoria_id: parsed.data.categoria_id,
      nombre: parsed.data.nombre,
      precio: parsed.data.precio,
      costo: parsed.data.costo,
    });

    await ctx.reply(`✅ Producto #${producto.id} creado: *${producto.nombre}*`, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('Error en productoCrearCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

const VALID_PRODUCTO_FIELDS = ['nombre', 'precio', 'costo', 'categoria_id', 'descripcion', 'sku'];

/**
 * Construye el partial update basado en campo:valor.
 * Valida que el campo sea una columna real de productos.
 */
function buildProductoUpdate(
  campo: string,
  valor: string,
): { ok: true; data: Record<string, any> } | { ok: false; error: string } {
  if (!VALID_PRODUCTO_FIELDS.includes(campo)) {
    const fields = VALID_PRODUCTO_FIELDS.map((f) => `\`${f}\``).join(', ');
    return {
      ok: false,
      error: `Campo inválido: \`${campo}\`. Campos válidos: ${fields}. Ej: \`/producto editar 15 nombre Chocotorta\``,
    };
  }

  const numericFields = ['precio', 'costo', 'categoria_id'];
  if (numericFields.includes(campo)) {
    return { ok: true, data: { [campo]: Number(valor) } };
  }
  return { ok: true, data: { [campo]: valor } };
}

/**
 * Handler para /producto editar <id> <campo> <valor>
 */
export async function productoEditarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseProductoEditar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const buildResult = buildProductoUpdate(parsed.data.campo, parsed.data.valor);
    if (!buildResult.ok) {
      await ctx.reply(`❌ ${buildResult.error}`);
      return;
    }

    const result = await productoService.update(parsed.data.id, buildResult.data);

    if (!result) {
      await ctx.reply(`❌ Producto #${parsed.data.id} no encontrado.`);
      return;
    }

    await ctx.reply(`✅ Producto #${result.id} actualizado: *${result.nombre}*`, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('Error en productoEditarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /producto eliminar <id>
 */
export async function productoEliminarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseProductoEliminar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const deleted = await productoService.delete(parsed.data.id);
    if (!deleted) {
      await ctx.reply(`❌ Producto #${parsed.data.id} no encontrado.`);
      return;
    }

    await ctx.reply(`✅ Producto #${parsed.data.id} eliminado.`);
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (
      errMsg.includes('foreign key') ||
      errMsg.includes('cannot delete') ||
      errMsg.includes('parent row')
    ) {
      await ctx.reply('❌ No se puede eliminar: tiene stock, fotos o ventas asociadas.');
      return;
    }
    console.error('Error en productoEliminarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}
