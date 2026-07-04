import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authGuard } from '../../bot/auth';

function createMockCtx(fromId?: number) {
  return {
    from: fromId ? { id: fromId, is_bot: false, first_name: 'Test' } : undefined,
    reply: vi.fn(),
  };
}

describe('authGuard', () => {
  beforeEach(() => {
    // Reset env before each test
    delete process.env.BOT_CHAT_IDS;
  });

  it('debe llamar a next() cuando el chatId esta en whitelist', async () => {
    process.env.BOT_CHAT_IDS = '12345,67890';
    const ctx = createMockCtx(12345) as any;
    const next = vi.fn();

    await authGuard(ctx, next);

    expect(next).toHaveBeenCalledOnce();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('debe rechazar silenciosamente chatId fuera de whitelist', async () => {
    process.env.BOT_CHAT_IDS = '12345,67890';
    const ctx = createMockCtx(99999) as any;
    const next = vi.fn();

    await authGuard(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('debe rechazar silenciosamente cuando no hay ctx.from', async () => {
    process.env.BOT_CHAT_IDS = '12345';
    const ctx = createMockCtx() as any;
    const next = vi.fn();

    await authGuard(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('debe rechazar cuando BOT_CHAT_IDS no esta configurado', async () => {
    const ctx = createMockCtx(12345) as any;
    const next = vi.fn();

    await authGuard(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('debe aceptar cuando hay espacio despues de la coma en whitelist', async () => {
    process.env.BOT_CHAT_IDS = '12345, 67890';
    const ctx = createMockCtx(67890) as any;
    const next = vi.fn();

    await authGuard(ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('debe soportar whitelist de un solo ID', async () => {
    process.env.BOT_CHAT_IDS = '111111';
    const ctx = createMockCtx(111111) as any;
    const next = vi.fn();

    await authGuard(ctx, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
