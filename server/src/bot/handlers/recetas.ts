import { Context } from 'grammy';
import { RecetaService } from '../../services/RecetaService';
import { connection } from '../../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  parseRecetasListar,
  parseRecetaVer,
  parseRecetaCrear,
  parseRecetaEditar,
  parseRecetaEliminar,
  parseRecetaIngredienteAgregar,
  parseRecetaIngredienteQuitar,
  parseRecetaIngredienteEditar,
} from '../parser';

const recetaService = new RecetaService();

/**
 * Helper: builds a field update object for RecetaService.update
 */
function buildUpdatePayload(campo: string, valor: string): Record<string, unknown> {
  switch (campo) {
    case 'nombre':
    case 'descripcion':
    case 'instrucciones':
      return { [campo]: valor };
    case 'tiempo_preparacion':
    case 'porciones':
      return { [campo]: Number(valor) };
    default:
      return {};
  }
}

/**
 * Handler para /recetas — lista todas las recetas activas
 */
export async function recetasCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseRecetasListar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const recetas = await recetaService.getAll();

    if (recetas.length === 0) {
      await ctx.reply('Sin recetas registradas.');
      return;
    }

    const lines = recetas.map((r) => {
      const tiempo = r.tiempo_preparacion ? `${r.tiempo_preparacion}min` : '—';
      const porciones = r.porciones ? `${r.porciones} porc.` : '—';
      return `\`${r.id}\` • *${r.nombre}* — ${tiempo} | ${porciones}`;
    });

    await ctx.reply(`📖 *Recetas*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error en recetasCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /receta <id> — muestra detalle de una receta con ingredientes
 */
export async function recetaVerCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseRecetaVer(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const receta = await recetaService.getById(parsed.data.id);

    if (!receta) {
      await ctx.reply(`❌ Receta #${parsed.data.id} no encontrada.`);
      return;
    }

    const tiempo = receta.tiempo_preparacion ? `${receta.tiempo_preparacion} min` : '—';
    const porciones = receta.porciones ? `${receta.porciones}` : '—';
    const descripcion = receta.descripcion ? `\n_${receta.descripcion}_` : '';
    const instrucciones = receta.instrucciones ? `\n\n📝 *Instrucciones:*\n${receta.instrucciones}` : '';

    let ingredientesText = '';
    if (receta.ingredientes && receta.ingredientes.length > 0) {
      const ingLines = receta.ingredientes.map((ing) => {
        const nombre = ing.ingrediente?.nombre || `#${ing.ingrediente_id}`;
        return `  • ${nombre}: ${ing.cantidad} ${ing.unidad_medida}`;
      });
      ingredientesText = `\n\n🥄 *Ingredientes:*\n${ingLines.join('\n')}`;
    }

    await ctx.reply(
      `🍽 *${receta.nombre}*${descripcion}\n⏱ ${tiempo} | 🍕 ${porciones} porc.${instrucciones}${ingredientesText}`,
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    console.error('Error en recetaVerCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /receta crear <nombre> <desc> <tiempo> <porciones>
 */
export async function recetaCrearCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseRecetaCrear(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const receta = await recetaService.create({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion,
      tiempo_preparacion: parsed.data.tiempo_preparacion,
      porciones: parsed.data.porciones,
    });

    await ctx.reply(
      `✅ Receta #${receta.id} creada: *${receta.nombre}*`,
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    console.error('Error en recetaCrearCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /receta editar <id> <campo> <valor>
 */
export async function recetaEditarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseRecetaEditar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const payload = buildUpdatePayload(parsed.data.campo, parsed.data.valor);
    const result = await recetaService.update(parsed.data.id, payload);

    if (!result) {
      await ctx.reply(`❌ Receta #${parsed.data.id} no encontrada.`);
      return;
    }

    await ctx.reply(
      `✅ Receta #${result.id} actualizada: *${result.nombre}*`,
      { parse_mode: 'Markdown' },
    );
  } catch (error) {
    console.error('Error en recetaEditarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /receta eliminar <id> — soft-delete (activo = false)
 */
export async function recetaEliminarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseRecetaEliminar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const receta = await recetaService.getById(parsed.data.id);

    if (!receta) {
      await ctx.reply(`❌ Receta #${parsed.data.id} no encontrada.`);
      return;
    }

    if (receta.activo === false) {
      await ctx.reply(`ℹ️ La receta #${parsed.data.id} ya está inactiva.`);
      return;
    }

    await recetaService.update(parsed.data.id, { activo: false });
    await ctx.reply(`✅ Receta #${parsed.data.id} eliminada.`);
  } catch (error) {
    console.error('Error en recetaEliminarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /receta ingrediente agregar <receta_id> <ingrediente_id> <cantidad> <unidad>
 */
export async function recetaIngredienteAgregarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseRecetaIngredienteAgregar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const { receta_id, ingrediente_id, cantidad, unidad_medida } = parsed.data;

    // Check recipe exists
    const [recetas] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM recetas WHERE id = ?',
      [receta_id],
    );
    if (recetas.length === 0) {
      await ctx.reply(`❌ Receta #${receta_id} no encontrada.`);
      return;
    }

    // Check ingredient exists
    const [ingredientes] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM ingredientes WHERE id = ?',
      [ingrediente_id],
    );
    if (ingredientes.length === 0) {
      await ctx.reply(`❌ Ingrediente #${ingrediente_id} no encontrado.`);
      return;
    }

    // Check if link already exists
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT receta_id FROM receta_ingrediente WHERE receta_id = ? AND ingrediente_id = ?',
      [receta_id, ingrediente_id],
    );

    if (existing.length > 0) {
      await ctx.reply(`❌ El ingrediente #${ingrediente_id} ya está vinculado a la receta #${receta_id}. Usá "editar" para modificar cantidad.`);
      return;
    }

    await connection.query(
      'INSERT INTO receta_ingrediente (receta_id, ingrediente_id, cantidad, unidad_medida) VALUES (?, ?, ?, ?)',
      [receta_id, ingrediente_id, cantidad, unidad_medida],
    );

    await ctx.reply(`✅ Ingrediente #${ingrediente_id} agregado a receta #${receta_id} (${cantidad} ${unidad_medida}).`);
  } catch (error) {
    console.error('Error en recetaIngredienteAgregarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /receta ingrediente quitar <receta_id> <ingrediente_id>
 */
export async function recetaIngredienteQuitarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseRecetaIngredienteQuitar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const { receta_id, ingrediente_id } = parsed.data;
    const [result] = await connection.query<ResultSetHeader>(
      'DELETE FROM receta_ingrediente WHERE receta_id = ? AND ingrediente_id = ?',
      [receta_id, ingrediente_id],
    );

    if (result.affectedRows === 0) {
      await ctx.reply(`❌ Vínculo entre receta #${receta_id} e ingrediente #${ingrediente_id} no encontrado.`);
      return;
    }

    await ctx.reply(`✅ Ingrediente #${ingrediente_id} quitado de receta #${receta_id}.`);
  } catch (error) {
    console.error('Error en recetaIngredienteQuitarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /receta ingrediente editar <receta_id> <ingrediente_id> <cantidad> <unidad>
 */
export async function recetaIngredienteEditarCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parsed = parseRecetaIngredienteEditar(text);

    if (!parsed.success) {
      await ctx.reply(`❌ ${parsed.error}`);
      return;
    }

    const { receta_id, ingrediente_id, cantidad, unidad_medida } = parsed.data;
    const [result] = await connection.query<ResultSetHeader>(
      'UPDATE receta_ingrediente SET cantidad = ?, unidad_medida = ? WHERE receta_id = ? AND ingrediente_id = ?',
      [cantidad, unidad_medida, receta_id, ingrediente_id],
    );

    if (result.affectedRows === 0) {
      await ctx.reply(`❌ Vínculo entre receta #${receta_id} e ingrediente #${ingrediente_id} no encontrado.`);
      return;
    }

    await ctx.reply(`✅ Ingrediente #${ingrediente_id} actualizado en receta #${receta_id} (${cantidad} ${unidad_medida}).`);
  } catch (error) {
    console.error('Error en recetaIngredienteEditarCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}
