import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';

describe('Bot webhook mounting in index.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    // Set required env vars for server startup
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_WEBHOOK_URL = 'https://example.com/webhook';
    process.env.BOT_CHAT_IDS = '12345';
    // Prevent DB connection attempt
    vi.doMock('../config/database', () => ({
      pool: {
        getConnection: vi.fn().mockResolvedValue({ release: vi.fn() }),
        execute: vi.fn(),
      },
    }));
  });

  it('debe poder importar el modulo index sin errores', async () => {
    // Mock grammy to prevent actual API calls
    vi.doMock('grammy', () => ({
      Bot: class {
        command = vi.fn();
        hears = vi.fn();
        on = vi.fn();
        use = vi.fn();
        api = { setWebhook: vi.fn() };
      },
      webhookCallback: vi.fn(() => vi.fn()),
    }));

    // Should not throw
    await expect(import('../../index')).resolves.toBeDefined();
  });
});
