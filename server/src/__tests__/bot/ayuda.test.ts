import { describe, it, expect, vi } from 'vitest';

// Import will resolve once implementation exists
import { startCommand, ayudaCommand } from '../../bot/handlers/ayuda';

function createMockCtx() {
  return {
    reply: vi.fn(),
  };
}

describe('startCommand', () => {
  it('debe responder con bienvenida', async () => {
    const ctx = createMockCtx() as any;

    await startCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('inquieta dulzura');
    expect(replyText.toLowerCase()).toContain('bot');
  });

  it('debe mencionar /ayuda para ver comandos', async () => {
    const ctx = createMockCtx() as any;

    await startCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('/ayuda');
  });
});

describe('ayudaCommand', () => {
  it('debe listar comandos disponibles', async () => {
    const ctx = createMockCtx() as any;

    await ayudaCommand(ctx);

    expect(ctx.reply).toHaveBeenCalledOnce();
    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('/start');
    expect(replyText.toLowerCase()).toContain('/ayuda');
  });

  it('debe incluir comandos de gestion', async () => {
    const ctx = createMockCtx() as any;

    await ayudaCommand(ctx);

    const replyText: string = ctx.reply.mock.calls[0][0];
    expect(replyText.toLowerCase()).toContain('/categoria');
    expect(replyText.toLowerCase()).toContain('/producto');
    expect(replyText.toLowerCase()).toContain('/ingrediente');
    expect(replyText.toLowerCase()).toContain('/stock');
    expect(replyText.toLowerCase()).toContain('/venta');
  });
});
