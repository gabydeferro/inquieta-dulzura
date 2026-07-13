import { Bot } from 'grammy';

let botInstance: Bot | null = null;

function getBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  if (!botInstance) {
    botInstance = new Bot(token);
  }
  return botInstance;
}

/**
 * Envía un mensaje de notificación al primer chat autorizado en BOT_CHAT_IDS.
 * Si BOT_CHAT_IDS no está configurado o no hay token, no hace nada (fail silent).
 */
export async function notifyTelegram(message: string): Promise<void> {
  const bot = getBot();
  if (!bot) return;

  const chatIds = process.env.BOT_CHAT_IDS;
  if (!chatIds) return;

  // Tomar el primer chat ID de la whitelist (separada por comas)
  const primaryChatId = chatIds.split(',')[0].trim();
  if (!primaryChatId) return;

  try {
    await bot.api.sendMessage(primaryChatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error enviando notificación a Telegram:', error);
  }
}
