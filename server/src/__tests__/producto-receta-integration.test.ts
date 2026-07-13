import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import jwt from 'jsonwebtoken';

// ──────────────────────────────────────────────
// Mocks — hoisted by vitest before ALL imports
// ──────────────────────────────────────────────

const { mockGetRecetasByProducto, mockVincular, mockDesvincular } = vi.hoisted(() => ({
  mockGetRecetasByProducto: vi.fn(),
  mockVincular: vi.fn(),
  mockDesvincular: vi.fn(),
}));

vi.mock('../services/ProductoService', () => ({
  ProductoService: class MockProductoService {
    getRecetasByProducto = mockGetRecetasByProducto;
    vincular = mockVincular;
    desvincular = mockDesvincular;
  },
}));

// ──────────────────────────────────────────────
// Imports (after mocks)
// ──────────────────────────────────────────────

import productoRouter from '../routes/productos';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const JWT_SECRET = 'secret-key-change-in-production';
const ADMIN_TOKEN = jwt.sign({ userId: 1, email: 'admin@test.com', rol: 'admin' }, JWT_SECRET, {
  expiresIn: '15m',
});
const USER_TOKEN = jwt.sign({ userId: 2, email: 'user@test.com', rol: 'usuario' }, JWT_SECRET, {
  expiresIn: '15m',
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function buildApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/productos', productoRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
  });

  return app;
}

async function makeRequest(
  app: express.Application,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Promise<{ status: number; body: any }> {
  const server = app.listen(0);
  const addr = server.address() as AddressInfo;

  try {
    return await new Promise((resolve, reject) => {
      const jsonBody = body ? JSON.stringify(body) : undefined;

      const req = http.request(
        {
          hostname: 'localhost',
          port: addr.port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
            ...(jsonBody ? { 'Content-Length': Buffer.byteLength(jsonBody).toString() } : {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let parsed: any;
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = data;
            }
            resolve({ status: res.statusCode ?? 0, body: parsed });
          });
        },
      );

      req.on('error', reject);

      if (jsonBody) {
        req.write(jsonBody);
      }

      req.end();
    });
  } finally {
    server.close();
  }
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('Producto-Receta vinculación — integración HTTP', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/productos/:id/recetas', () => {
    test('debe crear vinculación y responder 201', async () => {
      mockVincular.mockResolvedValueOnce({
        producto_id: 5,
        receta_id: 3,
        cantidad_receta: 2,
      });

      const res = await makeRequest(
        app,
        'POST',
        '/api/productos/5/recetas',
        { Authorization: `Bearer ${ADMIN_TOKEN}` },
        { receta_id: 3, cantidad_receta: 2 },
      );

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        producto_id: 5,
        receta_id: 3,
        cantidad_receta: 2,
      });
      expect(mockVincular).toHaveBeenCalledWith(5, 3, 2);
    });

    test('debe rechazar vinculación duplicada con 409', async () => {
      const dupError = new Error('Duplicate entry');
      (dupError as any).code = 'ER_DUP_ENTRY';
      (dupError as any).errno = 1062;
      mockVincular.mockRejectedValueOnce(dupError);

      const res = await makeRequest(
        app,
        'POST',
        '/api/productos/5/recetas',
        { Authorization: `Bearer ${ADMIN_TOKEN}` },
        { receta_id: 3, cantidad_receta: 1 },
      );

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        success: false,
        error: expect.stringContaining('ya está vinculado'),
      });
    });

    test('debe rechazar sin token (401)', async () => {
      const res = await makeRequest(
        app,
        'POST',
        '/api/productos/5/recetas',
        {},
        { receta_id: 3, cantidad_receta: 1 },
      );

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/productos/:id/recetas/:recetaId', () => {
    test('debe eliminar vinculación y responder 204', async () => {
      mockDesvincular.mockResolvedValueOnce(true);

      const res = await makeRequest(app, 'DELETE', '/api/productos/5/recetas/3', {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      });

      expect(res.status).toBe(204);
      expect(mockDesvincular).toHaveBeenCalledWith(5, 3);
    });

    test('debe rechazar sin token (401)', async () => {
      const res = await makeRequest(app, 'DELETE', '/api/productos/5/recetas/3');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/productos/:id/recetas', () => {
    test('debe retornar lista de recetas vinculadas (200)', async () => {
      mockGetRecetasByProducto.mockResolvedValueOnce([
        { receta_id: 3, nombre: 'Bizcochuelo', cantidad_receta: 1 },
      ]);

      const res = await makeRequest(app, 'GET', '/api/productos/5/recetas', {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].nombre).toBe('Bizcochuelo');
    });

    test('debe rechazar sin token (401)', async () => {
      const res = await makeRequest(app, 'GET', '/api/productos/5/recetas');

      expect(res.status).toBe(401);
    });
  });
});
