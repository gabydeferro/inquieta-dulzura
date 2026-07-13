import { describe, test, expect, beforeEach, afterEach } from 'vitest';

describe('Mercado Pago config — verificarConfiguracion (real)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    delete process.env.MERCADO_PAGO_PUBLIC_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('returns false when both env vars are missing', async () => {
    const { verificarConfiguracion } = await import('../config/mercado-pago');
    expect(verificarConfiguracion()).toBe(false);
  });

  test('returns false when only ACCESS_TOKEN is set', async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'test-token';
    const { verificarConfiguracion } = await import('../config/mercado-pago');
    expect(verificarConfiguracion()).toBe(false);
  });

  test('returns false when only PUBLIC_KEY is set', async () => {
    process.env.MERCADO_PAGO_PUBLIC_KEY = 'test-key';
    const { verificarConfiguracion } = await import('../config/mercado-pago');
    expect(verificarConfiguracion()).toBe(false);
  });

  test('returns true when both env vars are set', async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'test-token';
    process.env.MERCADO_PAGO_PUBLIC_KEY = 'test-key';
    const { verificarConfiguracion } = await import('../config/mercado-pago');
    expect(verificarConfiguracion()).toBe(true);
  });
});
