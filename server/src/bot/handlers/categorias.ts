import { Context } from 'grammy';
import { CategoriaService } from '../../services/CategoriaService';
import { parseCategoriaCrear, parseCategoriaEditar, parseCategoriaEliminar } from '../parser';

const categoriaService = new CategoriaService();

/**
 * Handler para /categorias — lista todas las categorías
 */
export async function categoriasCommand(ctx: Context): Promise<void> {
  try {
    const categorias = await categoriaService.getAll();

    if (categorias.length === 0) {
      await ctx.reply('Sin categorías registradas.');
      return;
    }

    const lines = categorias.map((c) => {
      const desc = c.descripcion ? ` — ${c.descripcion}` : '';
      return `\`${c.id}\` • *${c.nombre}*${desc}`;
    });

    await ctx.reply(`📂 *Categorías*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error en categoriasCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /categoria crear <nombre> [desc]
 */
export async function categoriaCrearCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseCategoriaCrear(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const categoria = await categoriaService.create({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion,
    });

    await ctx.reply(`✅ Categoría #${categoria.id} creada: *${categoria.nombre}*`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error en categoriaCrearCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /categoria editar <id> <nombre> [desc]
 */
export async function categoriaEditarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseCategoriaEditar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const result = await categoriaService.update(parsed.data.id, {
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion,
    });

    if (!result) {
      await ctx.reply(`❌ Categoría #${parsed.data.id} no encontrada.`);
      return;
    }

    await ctx.reply(`✅ Categoría #${result.id} actualizada: *${result.nombre}*`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error en categoriaEditarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /categoria eliminar <id>
 */
export async function categoriaEliminarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseCategoriaEliminar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const deleted = await categoriaService.delete(parsed.data.id);
    await ctx.reply(`✅ Categoría #${parsed.data.id} eliminada.`);
  } catch (error: any) {
    if (error?.message?.toLowerCase().includes('foreign key') ||
        error?.message?.toLowerCase().includes('cannot delete') ||
        error?.message?.toLowerCase().includes('parent row')) {
      await ctx.reply('❌ No se puede eliminar: tiene productos asociados.');
      return;
    }
    console.error('Error en categoriaEliminarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}
