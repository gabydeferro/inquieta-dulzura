import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import jwt from 'jsonwebtoken';

// ──────────────────────────────────────────────
// Mocks — hoisted by vitest before ALL imports
// ──────────────────────────────────────────────

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: (err: any) => err?.isAxiosError === true,
  },
}));

vi.mock('../config/instagram', () => ({
  verificarConfiguracion: vi.fn(),
  getConfig: vi.fn(() => ({
    appId: 'test-app-id',
    appSecret: 'test-app-secret',
    accessToken: 'test-token',
    businessId: 'test-business-id',
    webhookVerifyToken: 'test-verify-token',
    configured: true,
  })),
}));

// ──────────────────────────────────────────────
// Imports (use mocked modules)
// ──────────────────────────────────────────────

import axios from 'axios';
import { verificarConfiguracion } from '../config/instagram';
import instagramRouter from '../routes/instagram';

const mockedGet = vi.mocked(axios.get);

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const AUTH_SECRET = 'secret-key-change-in-production';
const VALID_TOKEN = jwt.sign({ userId: 1, email: 'admin@test.com', rol: 'admin' }, AUTH_SECRET, {
  expiresIn: '15m',
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Build a minimal Express app that mirrors the Instagram mounting logic
 * from server/src/index.ts.
 */
function buildApp(configured: boolean): express.Application {
  const app = express();
  app.use(express.json());

  if (configured) {
    app.use('/api/instagram', instagramRouter);
  }

  // 404 handler — same as real server
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
  });

  return app;
}

/**
 * Start an Express app on a random port and make a real HTTP request.
 * Returns { status, body }.
 */
async function makeRequest(
  app: express.Application,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: string,
): Promise<{ status: number; body: any }> {
  const server = app.listen(0);
  const addr = server.address() as AddressInfo;

  try {
    return await new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: 'localhost',
        port: addr.port,
        path,
        method,
        headers,
      };

      if (body) {
        options.headers = {
          ...options.headers,
          'Content-Length': Buffer.byteLength(body).toString(),
        };
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode!, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode!, body: data });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  } catch (e) {
    server.close();
    throw e;
  }
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('Instagram Routes — conditional mount integration', () => {
  // Cleanup between tests
  afterEach(() => {
    vi.resetAllMocks();
  });

  // ── Suite 1: Instagram IS configured ──

  describe('when Instagram env vars ARE set', () => {
    beforeEach(() => {
      vi.mocked(verificarConfiguracion).mockReturnValue(true);
      // Provide a valid token refresh response so the service doesn't crash
      mockedGet.mockResolvedValue({
        data: { access_token: 'refreshed-token', expires_in: 5177249 },
      });
    });

    test('1. routes are mounted — endpoints respond (not 404)', async () => {
      const app = buildApp(true);
      const res = await makeRequest(
        app,
        'GET',
        '/api/instagram/products/1/metrics?instagramPostId=ig-test',
        { Authorization: `Bearer ${VALID_TOKEN}` },
      );

      // The route is mounted, so we should NOT get a 404.
      // We may get 400 (missing params), 500 (service error), etc.
      // but crucially NOT 404.
      expect(res.status).not.toBe(404);
      expect(res.body).toHaveProperty('success');
    });

    test('2. returns 401 when no Authorization header is provided', async () => {
      const app = buildApp(true);
      const res = await makeRequest(
        app,
        'GET',
        '/api/instagram/products/1/metrics?instagramPostId=ig-test',
      );

      // The authenticateToken middleware should reject before reaching the handler
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
    });

    test('3. returns 403 with an invalid/expired token (Token presente pero inválido)', async () => {
      const app = buildApp(true);
      const res = await makeRequest(
        app,
        'GET',
        '/api/instagram/products/1/metrics?instagramPostId=ig-test',
        { Authorization: 'Bearer invalid-token-123' },
      );

      // authenticateToken devuelve 401 sin token, 403 con token inválido
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('success', false);
    });

    test('4. POST /api/instagram/upload-media is also mounted (non-GET route)', async () => {
      const app = buildApp(true);
      const res = await makeRequest(app, 'POST', '/api/instagram/upload-media', {
        Authorization: `Bearer ${VALID_TOKEN}`,
        'Content-Type': 'application/json',
      });

      // Should respond, not 404. Likely 400 (missing body) or 500
      expect(res.status).not.toBe(404);
    });
  });

  // ── Suite 2: Instagram NOT configured ──

  describe('when Instagram env vars are NOT set', () => {
    beforeEach(() => {
      vi.mocked(verificarConfiguracion).mockReturnValue(false);
    });

    test('5. routes are NOT mounted — all endpoints return 404', async () => {
      const app = buildApp(false);

      const res1 = await makeRequest(app, 'GET', '/api/instagram/products/1/metrics');
      expect(res1.status).toBe(404);

      const res2 = await makeRequest(app, 'POST', '/api/instagram/upload-media');
      expect(res2.status).toBe(404);

      const res3 = await makeRequest(app, 'GET', '/api/instagram/products/1/post');
      expect(res3.status).toBe(404);

      const res4 = await makeRequest(app, 'GET', '/api/instagram/posts/ig-test/comments');
      expect(res4.status).toBe(404);
    });

    test('6. even with valid auth, routes are still 404 when not configured', async () => {
      const app = buildApp(false);
      const res = await makeRequest(app, 'GET', '/api/instagram/products/1/metrics', {
        Authorization: `Bearer ${VALID_TOKEN}`,
      });

      expect(res.status).toBe(404);
    });
  });

  // ── Suite 3: Webhook endpoints (public) ──

  describe('Instagram Webhook — public endpoints', () => {
    test('GET /api/instagram/webhook verifies with correct token', async () => {
      const app = buildApp(true);
      const res = await makeRequest(
        app,
        'GET',
        '/api/instagram/webhook?hub.mode=subscribe&hub.challenge=abc123&hub.verify_token=test-verify-token',
      );

      expect(res.status).toBe(200);
      expect(typeof res.body).toBe('string');
    });

    test('GET /api/instagram/webhook rejects with wrong token', async () => {
      const app = buildApp(true);
      const res = await makeRequest(
        app,
        'GET',
        '/api/instagram/webhook?hub.mode=subscribe&hub.challenge=abc123&hub.verify_token=wrong-token',
      );

      expect(res.status).toBe(403);
    });

    test('GET /api/instagram/webhook rejects missing params', async () => {
      const app = buildApp(true);
      const res = await makeRequest(app, 'GET', '/api/instagram/webhook');

      expect(res.status).toBe(400);
    });

    test('POST /api/instagram/webhook accepts notification and returns 200', async () => {
      const app = buildApp(true);
      const notificationPayload = {
        object: 'instagram',
        entry: [
          {
            id: '123',
            time: 1234567890,
            changes: [
              {
                field: 'comments',
                value: {
                  text: 'Qué rico se ve!',
                  username: 'test_user',
                  media_id: 'ig-media-1',
                },
              },
            ],
          },
        ],
      };

      const res = await makeRequest(
        app,
        'POST',
        '/api/instagram/webhook',
        { 'Content-Type': 'application/json' },
        JSON.stringify(notificationPayload),
      );

      expect(res.status).toBe(200);
      expect(res.body).toBe('EVENT_RECEIVED');
    });

    test('POST /api/instagram/webhook returns 200 even with unknown object type', async () => {
      const app = buildApp(true);
      const payload = {
        object: 'page',
        entry: [],
      };

      const res = await makeRequest(
        app,
        'POST',
        '/api/instagram/webhook',
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      );

      expect(res.status).toBe(200);
    });
  });
});
