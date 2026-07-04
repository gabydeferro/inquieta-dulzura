import { Bot, webhookCallback, Context } from 'grammy';
import { authGuard } from './auth';
import { startCommand, ayudaCommand } from './handlers/ayuda';

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

  // Catch-all: ignorar mensajes sin comando
  bot.on('message', (ctx: Context) => {
    // Ignorar silenciosamente mensajes sin comando
    console.log(`📩 Mensaje ignorado de ${ctx.from?.id}: ${ctx.message?.text?.slice(0, 50)}`);
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
  return webhookCallback(bot, {
    secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    timeoutMilliseconds: 10_000,
  });
}
