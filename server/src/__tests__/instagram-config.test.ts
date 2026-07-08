import { describe, test, expect, beforeEach } from 'vitest';

describe('Instagram config', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    // Clear any cached module state by deleting relevant env vars
    delete process.env.META_APP_ID;
    delete process.env.META_APP_SECRET;
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.INSTAGRAM_BUSINESS_ID;

    // Invalidate cached config — require fresh module each time
    vi.resetModules();
  });

  describe('verificarConfiguracion', () => {
    test('returns false when all env vars are missing', async () => {
      const { verificarConfiguracion } = await import('../config/instagram');
      const result = verificarConfiguracion();
      expect(result).toBe(false);
    });

    test('returns false when only some env vars are present', async () => {
      process.env.META_APP_ID = 'test-app-id';
      process.env.META_APP_SECRET = 'test-app-secret';
      // Missing INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ID

      const { verificarConfiguracion } = await import('../config/instagram');
      const result = verificarConfiguracion();
      expect(result).toBe(false);
    });

    test('returns true when all env vars are present', async () => {
      process.env.META_APP_ID = 'test-app-id';
      process.env.META_APP_SECRET = 'test-app-secret';
      process.env.INSTAGRAM_ACCESS_TOKEN = 'test-access-token';
      process.env.INSTAGRAM_BUSINESS_ID = 'test-business-id';

      const { verificarConfiguracion } = await import('../config/instagram');
      const result = verificarConfiguracion();
      expect(result).toBe(true);
    });

    test('returns cached result on second call (caching behavior)', async () => {
      process.env.META_APP_ID = 'test-app-id';
      process.env.META_APP_SECRET = 'test-app-secret';
      process.env.INSTAGRAM_ACCESS_TOKEN = 'test-access-token';
      process.env.INSTAGRAM_BUSINESS_ID = 'test-business-id';

      const { verificarConfiguracion, getConfig } = await import('../config/instagram');

      // First call — should verify and return true
      expect(verificarConfiguracion()).toBe(true);

      // Wipe env vars (simulating a later config change)
      delete process.env.META_APP_ID;

      // Second call — should return CACHED value, not re-check
      expect(verificarConfiguracion()).toBe(true);

      // getConfig should also return the cached config
      const config = getConfig();
      expect(config.appId).toBe('test-app-id');
      expect(config.configured).toBe(true);
    });
  });

  describe('getConfig', () => {
    test('returns config object with env var values', async () => {
      process.env.META_APP_ID = 'app-123';
      process.env.META_APP_SECRET = 'secret-456';
      process.env.INSTAGRAM_ACCESS_TOKEN = 'token-789';
      process.env.INSTAGRAM_BUSINESS_ID = 'biz-000';

      const { getConfig } = await import('../config/instagram');
      const config = getConfig();

      expect(config.appId).toBe('app-123');
      expect(config.appSecret).toBe('secret-456');
      expect(config.accessToken).toBe('token-789');
      expect(config.businessId).toBe('biz-000');
    });

    test('configured is false when env vars are empty', async () => {
      const { getConfig } = await import('../config/instagram');
      const config = getConfig();

      expect(config.configured).toBe(false);
    });

    test('configured is true when all env vars are present', async () => {
      process.env.META_APP_ID = 'app-123';
      process.env.META_APP_SECRET = 'secret-456';
      process.env.INSTAGRAM_ACCESS_TOKEN = 'token-789';
      process.env.INSTAGRAM_BUSINESS_ID = 'biz-000';

      const { getConfig } = await import('../config/instagram');
      const config = getConfig();

      expect(config.configured).toBe(true);
    });
  });
});
