import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { InsufficientIngredientStockError } from '../errors/InsufficientIngredientStockError';
import { IncompatibleUnitsError } from '../errors/IncompatibleUnitsError';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

// --- Mock ProduccionService BEFORE importing routes ---
const mockProducir = vi.fn();
const mockListar = vi.fn();

vi.mock('../services/ProduccionService', () => ({
  ProduccionService: class {
    producir = mockProducir;
    listar = mockListar;
  },
}));

// --- JWT helpers ---
function signToken(payload: { userId: number; email: string; rol: 'admin' | 'usuario' }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = signToken({ userId: 1, email: 'admin@test.com', rol: 'admin' });
const usuarioToken = signToken({ userId: 2, email: 'user@test.com', rol: 'usuario' });

function buildApp(routePath: string, router: express.Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use(routePath, router);
  return app;
}

describe('produccion routes — integration', () => {
  let router: express.Router;

  beforeAll(async () => {
    const mod = await import('../routes/produccion');
    router = mod.default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduccionResponse = {
    id: 42,
    receta_id: 1,
    producto_id: 5,
    cantidad_producida: 2,
    tandas_ejecutadas: 2,
    ingredientes_consumidos: [
      { ingrediente_id: 1, nombre: 'Harina', cantidad_consumida: 1000 },
    ],
    created_by: 1,
    created_at: new Date('2026-07-29').toISOString(),
  };

  // ---- POST /api/produccion ----

  describe('POST /api/produccion', () => {
    it('should return 201 for successful production', async () => {
      mockProducir.mockResolvedValue(mockProduccionResponse);

      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ receta_id: 1, cantidad_producir: 2 });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(42);
      expect(res.body.cantidad_producida).toBe(2);
    });

    it('should return 400 for insufficient stock', async () => {
      const stockError = new InsufficientIngredientStockError(1, 'Harina', 2, 5);
      mockProducir.mockRejectedValue(stockError);

      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ receta_id: 1, cantidad_producir: 2 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toBeDefined();
      expect(res.body.details[0].ingrediente).toBe('Harina');
    });

    it('should return 400 for incompatible units', async () => {
      const unitError = new IncompatibleUnitsError('gramos', 'litros');
      mockProducir.mockRejectedValue(unitError);

      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ receta_id: 1, cantidad_producir: 2 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for recipe not found', async () => {
      mockProducir.mockRejectedValue(new Error('Receta no encontrada'));

      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ receta_id: 99, cantidad_producir: 2 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for recipe without linked product', async () => {
      mockProducir.mockRejectedValue(new Error('Receta sin producto vinculado'));

      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ receta_id: 1, cantidad_producir: 2 });

      expect(res.status).toBe(404);
    });

    it('should return 409 for multiple linked products', async () => {
      mockProducir.mockRejectedValue(
        new Error('La receta está vinculada a múltiples productos'),
      );

      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ receta_id: 1, cantidad_producir: 2 });

      expect(res.status).toBe(409);
    });

    it('should return 400 for invalid body (schema validation)', async () => {
      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}); // empty body

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .send({ receta_id: 1, cantidad_producir: 2 });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .post('/api/produccion')
        .set('Authorization', `Bearer ${usuarioToken}`)
        .send({ receta_id: 1, cantidad_producir: 2 });

      expect(res.status).toBe(403);
    });
  });

  // ---- GET /api/produccion ----

  describe('GET /api/produccion', () => {
    it('should return paginated results for admin', async () => {
      mockListar.mockResolvedValue({
        data: [mockProduccionResponse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .get('/api/produccion')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 401 without auth token', async () => {
      const app = buildApp('/api/produccion', router);
      const res = await request(app).get('/api/produccion');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const app = buildApp('/api/produccion', router);
      const res = await request(app)
        .get('/api/produccion')
        .set('Authorization', `Bearer ${usuarioToken}`);
      expect(res.status).toBe(403);
    });
  });
});
