import { Context } from 'grammy';

/**
 * Handler para /start — mensaje de bienvenida
 */
export async function startCommand(ctx: Context): Promise<void> {
  await ctx.reply(
    '🤖 *Hola! Soy el bot de Inquieta Dulzura*\n\n' +
      'Te ayudo a gestionar categorías, productos, ingredientes, stock y ventas ' +
      'directamente desde Telegram.\n\n' +
      'Usá /ayuda para ver los comandos disponibles.',
    { parse_mode: 'Markdown' },
  );
}

/**
 * Handler para /ayuda — lista de comandos disponibles
 */
export async function ayudaCommand(ctx: Context): Promise<void> {
  const helpText = [
    '*Comandos disponibles:*',
    '',
    '📂 *Categorías*',
    '`/categorias` — Listar categorías',
    '`/categoria crear <nombre> [desc]` — Crear categoría',
    '`/categoria editar <id> <nombre> [desc]` — Editar categoría',
    '`/categoria eliminar <id>` — Eliminar categoría',
    '',
    '🥐 *Productos*',
    '`/productos [cat_id]` — Listar productos (filtro por categoría)',
    '`/producto crear <cat_id> <nombre> <precio> [costo]` — Crear producto',
    '`/producto editar <id> <campo> <valor>` — Editar producto',
    '',
    '🧂 *Ingredientes*',
    '`/ingredientes` — Listar ingredientes',
    '`/ingrediente crear <nombre> <costo> <unidad>` — Crear ingrediente (kg, gramos, litros, ml, unidades)',
    '`/ingrediente editar <id> <nombre> <costo> <unidad>` — Editar ingrediente',
    '`/ingrediente eliminar <id>` — Eliminar ingrediente',
    '',
    '📦 *Stock*',
    '`/stock [limite]` — Ver stock bajo (default: < 5)',
    '`/stock set <id> <cant>` — Actualizar stock',
    '',
    '🧾 *Ventas*',
    '`/venta <id>:<cant> [id:cant...]` — Registrar venta rápida',
    '',
    '📸 *Fotos*',
    '`Enviá una foto con el ID del producto como caption` — Agregar foto',
    '',
    '❓ *Ayuda*',
    '`/start` — Ver mensaje de bienvenida',
    '`/ayuda` — Mostrar esta lista',
  ].join('\n');

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
}
