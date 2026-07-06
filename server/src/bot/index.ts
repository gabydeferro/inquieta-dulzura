import { Bot, webhookCallback, Context } from 'grammy';
import { authGuard } from './auth';
import { startCommand, ayudaCommand } from './handlers/ayuda';
import { categoriasCommand, categoriaCrearCommand, categoriaEditarCommand, categoriaEliminarCommand } from './handlers/categorias';
import { productosCommand, productoCrearCommand, productoEditarCommand, productoEliminarCommand } from './handlers/productos';
import { ingredientesCommand, ingredienteCrearCommand, ingredienteEditarCommand, ingredienteEliminarCommand } from './handlers/ingredientes';
import { stockCommand, stockSetCommand } from './handlers/stock';
import { ventaCommand } from './handlers/ventas';
import { fotoHandler } from './handlers/fotos';

let botInstance: Bot | null = null;

/**
 * Inicializa y configura el bot de Telegram.
 * Lanza error si TELEGRAM_BOT_TOKEN no está definido.
 */
export function setupBot(): Bot {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN no está configurado');
  }

  const bot = new Bot(token);

  // Middleware de autenticación global
  bot.use(authGuard);

  // Handlers del bot
  bot.command('start', startCommand);
  bot.command('ayuda', ayudaCommand);

  // Comandos de gestión — Categorías
  bot.command('categorias', categoriasCommand);
  bot.hears(/^\/categor[ií]as$/i, (ctx: Context) => categoriasCommand(ctx));
  bot.hears(/^\/categor[ií]a (?:crear|editar|eliminar)/i, (ctx: Context) => {
    const text = ctx.message?.text || '';
    const normalized = text.replace(/í/g, 'i');
    if (normalized.startsWith('/categoria crear')) return categoriaCrearCommand(ctx);
    if (normalized.startsWith('/categoria editar')) return categoriaEditarCommand(ctx);
    if (normalized.startsWith('/categoria eliminar')) return categoriaEliminarCommand(ctx);
    return ctx.reply('❌ Comando no reconocido. Usá /ayuda para ver la sintaxis.');
  });

  // Comandos de gestión — Productos
  bot.command('productos', productosCommand);
  bot.hears(/^\/producto (?:crear|editar|eliminar)/, (ctx: Context) => {
    const text = ctx.message?.text || '';
    if (text.startsWith('/producto crear')) return productoCrearCommand(ctx);
    if (text.startsWith('/producto editar')) return productoEditarCommand(ctx);
    if (text.startsWith('/producto eliminar')) return productoEliminarCommand(ctx);
    return ctx.reply('❌ Comando no reconocido. Usá /ayuda para ver la sintaxis.');
  });

  // Comandos de gestión — Ingredientes
  bot.command('ingredientes', ingredientesCommand);
  bot.hears(/^\/ingrediente (?:crear|editar|eliminar)/, (ctx: Context) => {
    const text = ctx.message?.text || '';
    if (text.startsWith('/ingrediente crear')) return ingredienteCrearCommand(ctx);
    if (text.startsWith('/ingrediente editar')) return ingredienteEditarCommand(ctx);
    if (text.startsWith('/ingrediente eliminar')) return ingredienteEliminarCommand(ctx);
    return ctx.reply('❌ Comando no reconocido. Usá /ayuda para ver la sintaxis.');
  });

  // Comandos de gestión — Stock
  bot.command('stock', stockCommand);
  bot.hears(/^\/stock set/, stockSetCommand);

  // Comandos de gestión — Ventas
  bot.command('venta', ventaCommand);

  // Photos: manejar mensajes con foto (caption = producto ID)
  bot.on('message:photo', fotoHandler);

  // Catch-all: ignorar mensajes sin comando
  bot.on('message', (ctx: Context) => {
    // Ignorar silenciosamente mensajes sin comando
    const text = ctx.message?.text;
    if (text) {
      console.log(`📩 Mensaje ignorado de ${ctx.from?.id}: ${text.slice(0, 50)}`);
    }
  });

  botInstance = bot;
  return bot;
}

/**
 * Obtiene la instancia del bot (debe llamarse después de setupBot).
 */
export function getBot(): Bot {
  if (!botInstance) {
    throw new Error('Bot no inicializado. Llamá setupBot() primero.');
  }
  return botInstance;
}

/**
 * Configura el middleware de webhook para Express.
 * Retorna un middleware que puede montarse con app.use().
 */
export function configureWebhook(bot: Bot) {
  return webhookCallback(bot, 'express', {
    secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    timeoutMilliseconds: 10_000,
  });
}
