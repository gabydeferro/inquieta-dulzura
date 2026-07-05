import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';

describe('Bot webhook mounting in index.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    // Set required env vars for server startup
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_WEBHOOK_URL = 'https://example.com/webhook';
    process.env.BOT_CHAT_IDS = '12345';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret';

    // Prevent DB connection attempt — index.ts importa decenas de modulos
    vi.doMock('../config/database', () => ({
      pool: {
        getConnection: vi.fn().mockResolvedValue({ release: vi.fn() }),
        execute: vi.fn(),
      },
    }));
    vi.doMock('../db', () => ({ connection: { execute: vi.fn(), query: vi.fn() } }));
    vi.doMock('mysql2', () => ({ RowDataPacket: class {}, ResultSetHeader: class {} }));
    vi.doMock('./bot', () => ({
      setupBot: vi.fn(() => ({
        command: vi.fn(), hears: vi.fn(), on: vi.fn(), use: vi.fn(),
        api: { setWebhook: vi.fn() },
      })),
      configureWebhook: vi.fn(() => vi.fn()),
    }));
  });

  it('debe poder importar el modulo index sin errores', async () => {
    // Should not throw
    await expect(import('../../index')).resolves.toBeDefined();
  });
});
