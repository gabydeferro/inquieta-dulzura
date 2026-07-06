import { Context } from 'grammy';
import { IngredienteService } from '../../services/IngredienteService';
import { parseIngredienteCrear, parseIngredienteEditar, parseIngredienteEliminar } from '../parser';

const ingredienteService = new IngredienteService();

/**
 * Handler para /ingredientes — lista todos los ingredientes
 */
export async function ingredientesCommand(ctx: Context): Promise<void> {
  try {
    const ingredientes = await ingredienteService.getAll();

    if (ingredientes.length === 0) {
      await ctx.reply('Sin ingredientes registrados.');
      return;
    }

    const lines = ingredientes.map((i) => {
      const costo = i.costo_unitario ? `$${i.costo_unitario}` : '—';
      return `\`${i.id}\` • *${i.nombre}* — ${costo} (${i.unidad_medida})`;
    });

    await ctx.reply(`🧂 *Ingredientes*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error en ingredientesCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /ingrediente crear <nombre> <costo>
 */
export async function ingredienteCrearCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseIngredienteCrear(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const ingrediente = await ingredienteService.create({
      nombre: parsed.data.nombre,
      costo_unitario: parsed.data.costo,
      unidad_medida: parsed.data.unidad,
      activo: true,
    });

    await ctx.reply(
      `✅ Ingrediente #${ingrediente.id} creado: *${ingrediente.nombre}* ($${ingrediente.costo_unitario})`,
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    console.error('Error en ingredienteCrearCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /ingrediente editar <id> <nombre> <costo>
 */
export async function ingredienteEditarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseIngredienteEditar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const result = await ingredienteService.update(parsed.data.id, {
      nombre: parsed.data.nombre,
      costo_unitario: parsed.data.costo,
      unidad_medida: parsed.data.unidad,
      activo: true,
    });

    if (!result) {
      await ctx.reply(`❌ Ingrediente #${parsed.data.id} no encontrado.`);
      return;
    }

    await ctx.reply(
      `✅ Ingrediente #${result.id} actualizado: *${result.nombre}* ($${result.costo_unitario})`,
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    console.error('Error en ingredienteEditarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /ingrediente eliminar <id>
 */
export async function ingredienteEliminarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseIngredienteEliminar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const deleted = await ingredienteService.delete(parsed.data.id);
    if (!deleted) {
      await ctx.reply(`❌ Ingrediente #${parsed.data.id} no encontrado.`);
      return;
    }

    await ctx.reply(`✅ Ingrediente #${parsed.data.id} eliminado.`);
  } catch (error) {
    console.error('Error en ingredienteEliminarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}
