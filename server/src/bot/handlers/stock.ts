import { Context } from 'grammy';
import { connection } from '../../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface LowStockRow {
  producto_id: number;
  cantidad_disponible: number;
  producto_nombre: string;
  categoria_nombre: string;
}

/**
 * Handler para /stock [limite] — lista productos con stock bajo el limite
 */
export async function stockCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const parts = text.split(/\s+/);
    const limite = parts[1] ? parseInt(parts[1], 10) : 5;

    if (isNaN(limite) || limite < 1) {
      await ctx.reply('❌ El límite debe ser un número positivo. Ej: /stock 10');
      return;
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT s.producto_id, s.cantidad_disponible, p.nombre AS producto_nombre, c.nombre AS categoria_nombre
       FROM stock s
       JOIN productos p ON s.producto_id = p.id
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE s.cantidad_disponible < ?
       ORDER BY s.cantidad_disponible ASC`,
      [limite],
    );

    const stockRows = rows as LowStockRow[];

    if (stockRows.length === 0) {
      await ctx.reply('✅ Sin productos con stock bajo.');
      return;
    }

    const lines = stockRows.map(
      (r) => `\`${r.producto_id}\` • *${r.producto_nombre}* — ${r.categoria_nombre} | Stock: ${r.cantidad_disponible}`,
    );

    await ctx.reply(`📦 *Stock bajo* (< ${limite})\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error en stockCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}

/**
 * Handler para /stock set <producto_id> <cantidad> — actualiza stock de un producto
 */
export async function stockSetCommand(ctx: Context): Promise<void> {
  try {
    const text = ctx.message?.text || '';
    const match = text.match(/^\/stock set (\d+) (\d+)$/);

    if (!match) {
      await ctx.reply('❌ Formato: /stock set <producto_id> <cantidad>');
      return;
    }

    const productoId = Number(match[1]);
    const cantidad = Number(match[2]);

    // Verificar que el producto existe
    const [productos] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM productos WHERE id = ?',
      [productoId],
    );

    if (productos.length === 0) {
      await ctx.reply(`❌ Producto #${productoId} no encontrado.`);
      return;
    }

    // Actualizar stock (INSERT ON DUPLICATE KEY UPDATE para manejar si no existe registro)
    await connection.query(
      `INSERT INTO stock (producto_id, cantidad_disponible) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE cantidad_disponible = ?`,
      [productoId, cantidad, cantidad],
    );

    await ctx.reply(`✅ Stock del producto #${productoId} actualizado a ${cantidad}.`);
  } catch (error) {
    console.error('Error en stockSetCommand:', error);
    await ctx.reply('Error interno. Intentalo de nuevo.');
  }
}
