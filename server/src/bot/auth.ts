import { Context, NextFunction } from 'grammy';

/**
 * Middleware que verifica si el chatId del usuario está en la whitelist.
 * Si no está autorizado, no responde (rechazo silencioso).
 */
export async function authGuard(ctx: Context, next: NextFunction): Promise<void> {
  const whitelist = process.env.BOT_CHAT_IDS;

  if (!whitelist || !ctx.from?.id) {
    // Sin whitelist configurada o sin chat ID: rechazar silenciosamente
    return;
  }

  const allowedIds = whitelist.split(',').map((id) => id.trim());

  if (!allowedIds.includes(String(ctx.from.id))) {
    // Chat no autorizado: no responder
    return;
  }

  await next();
}
