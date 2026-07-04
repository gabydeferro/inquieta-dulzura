import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('bot/index', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_WEBHOOK_URL;
  });

  it('setupBot() debe crear una instancia de Bot cuando hay token', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:test-token';
    const mockCommand = vi.fn();
    const mockOn = vi.fn();
    const mockUse = vi.fn();
    let capturedToken = '';
    vi.doMock('grammy', () => ({
      Bot: class {
        constructor(token: string) { capturedToken = token; }
        command = mockCommand;
        on = mockOn;
        use = mockUse;
        api = { setWebhook: vi.fn() };
      },
      webhookCallback: vi.fn(() => vi.fn()),
    }));

    const { setupBot } = await import('../../bot/index');
    const bot = setupBot();

    expect(capturedToken).toBe('123456:test-token');
    expect(bot.command).toBe(mockCommand);
  });

  it('setupBot() debe lanzar error si falta TELEGRAM_BOT_TOKEN', async () => {
    vi.doMock('grammy', () => ({
      Bot: class {},
      webhookCallback: vi.fn(() => vi.fn()),
    }));

    const { setupBot } = await import('../../bot/index');
    expect(() => setupBot()).toThrow('TELEGRAM_BOT_TOKEN');
  });

  it('setupBot() debe registrar authGuard como middleware', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:test-token';
    const mockUse = vi.fn();
    vi.doMock('grammy', () => ({
      Bot: class {
        command = vi.fn();
        on = vi.fn();
        use = mockUse;
        api = { setWebhook: vi.fn() };
      },
      webhookCallback: vi.fn(() => vi.fn()),
    }));

    const { setupBot } = await import('../../bot/index');
    setupBot();

    expect(mockUse).toHaveBeenCalledOnce();
  });

  it('setupBot() debe registrar los handlers de start y ayuda', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:test-token';
    const mockCommand = vi.fn();
    vi.doMock('grammy', () => ({
      Bot: class {
        command = mockCommand;
        on = vi.fn();
        use = vi.fn();
        api = { setWebhook: vi.fn() };
      },
      webhookCallback: vi.fn(() => vi.fn()),
    }));

    const { setupBot } = await import('../../bot/index');
    setupBot();

    expect(mockCommand).toHaveBeenCalledWith('start', expect.any(Function));
    expect(mockCommand).toHaveBeenCalledWith('ayuda', expect.any(Function));
  });

  it('setupBot() debe registrar catch-all para mensajes sin comando', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:test-token';
    const mockOn = vi.fn();
    vi.doMock('grammy', () => ({
      Bot: class {
        command = vi.fn();
        on = mockOn;
        use = vi.fn();
        api = { setWebhook: vi.fn() };
      },
      webhookCallback: vi.fn(() => vi.fn()),
    }));

    const { setupBot } = await import('../../bot/index');
    setupBot();

    expect(mockOn).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('configureWebhook() debe retornar un middleware de Express', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:test-token';
    const mockWebhookCallback = vi.fn(() => 'mock-middleware');
    const mockBotInstance = {
      command: vi.fn(), on: vi.fn(), use: vi.fn(), api: { setWebhook: vi.fn() },
    };
    vi.doMock('grammy', () => ({
      Bot: class {
        command = vi.fn();
        on = vi.fn();
        use = vi.fn();
        api = { setWebhook: vi.fn() };
      },
      webhookCallback: mockWebhookCallback,
    }));

    const { setupBot, configureWebhook } = await import('../../bot/index');
    const bot = setupBot();
    const middleware = configureWebhook(bot);

    expect(mockWebhookCallback).toHaveBeenCalledWith(bot, expect.any(Object));
    expect(middleware).toBe('mock-middleware');
  });
});
