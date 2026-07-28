import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

// --- Mock all services BEFORE importing routes/controllers ---

const mockIngredienteGetAll = vi.fn().mockResolvedValue([]);
const mockIngredienteGetById = vi.fn().mockResolvedValue(null);
const mockIngredienteCreate = vi.fn().mockResolvedValue({ id: 1 });
const mockIngredienteUpdate = vi.fn().mockResolvedValue({ id: 1 });
const mockIngredienteDelete = vi.fn().mockResolvedValue(true);

vi.mock('../services/IngredienteService', () => ({
  IngredienteService: class {
    getAll = mockIngredienteGetAll;
    getById = mockIngredienteGetById;
    create = mockIngredienteCreate;
    update = mockIngredienteUpdate;
    delete = mockIngredienteDelete;
  },
}));

const mockVentaGetVentas = vi.fn().mockResolvedValue([]);
const mockVentaGetById = vi.fn().mockResolvedValue(null);
const mockVentaCreate = vi.fn().mockResolvedValue({ id: 1 });
const mockVentaGetHistorial = vi.fn().mockResolvedValue([]);
const mockVentaUpdateStatus = vi.fn().mockResolvedValue(true);
const mockVentaDecrementStock = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/VentasService', () => ({
  VentasService: class {
    getVentas = mockVentaGetVentas;
    getById = mockVentaGetById;
    create = mockVentaCreate;
    getHistorial = mockVentaGetHistorial;
    updateStatus = mockVentaUpdateStatus;
    decrementStock = mockVentaDecrementStock;
  },
}));

const mockPagosGetByVentaId = vi.fn().mockResolvedValue([]);
const mockPagosUpdateByVentaId = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/PagosService', () => ({
  PagosService: class {
    getByVentaId = mockPagosGetByVentaId;
    updateByVentaId = mockPagosUpdateByVentaId;
  },
}));

const mockRecetaGetAll = vi.fn().mockResolvedValue([]);
const mockRecetaGetById = vi.fn().mockResolvedValue(null);
const mockRecetaCreate = vi.fn().mockResolvedValue({ id: 1 });
const mockRecetaUpdate = vi.fn().mockResolvedValue({ id: 1 });
const mockRecetaDelete = vi.fn().mockResolvedValue(true);
const mockRecetaGetProductos = vi.fn().mockResolvedValue([]);

vi.mock('../services/RecetaService', () => ({
  RecetaService: class {
    getAll = mockRecetaGetAll;
    getById = mockRecetaGetById;
    create = mockRecetaCreate;
    update = mockRecetaUpdate;
    delete = mockRecetaDelete;
    getProductosByReceta = mockRecetaGetProductos;
  },
}));

const mockDashboardGetStats = vi.fn().mockResolvedValue({ totalVentas: 0 });

vi.mock('../services/DashboardService', () => ({
  DashboardService: class {
    getStats = mockDashboardGetStats;
  },
}));

const mockCreatePreference = vi.fn().mockResolvedValue({ init_point: 'https://mp.me' });
const mockVerifySignature = vi.fn().mockResolvedValue(true);

vi.mock('../services/MercadoPagoService', () => ({
  MercadoPagoService: class {
    createPreference = mockCreatePreference;
    verifySignature = mockVerifySignature;
    handleWebhook = vi.fn().mockResolvedValue({ status: 'approved', external_reference: '0' });
  },
  MPItem: {},
}));

// --- Helpers to generate tokens ---
function signToken(payload: { userId: number; email: string; rol: 'admin' | 'usuario' }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = signToken({ userId: 1, email: 'admin@test.com', rol: 'admin' });
const usuarioToken = signToken({ userId: 2, email: 'user@test.com', rol: 'usuario' });

// --- Helper to build a mini app with a route ---
function buildApp(routePath: string, router: express.Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use(routePath, router);
  return app;
}

// =============================================
// Phase 1: Backend Route Hardening
// =============================================

describe('RBAC Route Hardening', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  // ------ INGREDIENTES ------
  describe('ingredientes routes', () => {
    let router: express.Router;

    beforeAll(async () => {
      const mod = await import('../routes/ingredientes');
      router = mod.default;
    });

    it('GET / — no token returns 401', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app).get('/api/ingredientes');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET / — usuario token returns 200', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app)
        .get('/api/ingredientes')
        .set('Authorization', `Bearer ${usuarioToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /:id — no token returns 401', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app).get('/api/ingredientes/1');
      expect(res.status).toBe(401);
    });

    it('GET /:id — admin token returns 200', async () => {
      mockIngredienteGetById.mockResolvedValueOnce({ id: 1, nombre: 'Harina' });
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app)
        .get('/api/ingredientes/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('POST / — no token returns 401', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app).post('/api/ingredientes').send({});
      expect(res.status).toBe(401);
    });

    it('POST / — usuario token returns 403', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app)
        .post('/api/ingredientes')
        .set('Authorization', `Bearer ${usuarioToken}`)
        .send({ nombre: 'Test', unidad_medida: 'kg', costo_unitario: 1 });
      expect(res.status).toBe(403);
    });

    it('POST / — admin token returns 201', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app)
        .post('/api/ingredientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Test', unidad_medida: 'kg', costo_unitario: 1 });
      expect(res.status).toBe(201);
    });

    it('PUT /:id — usuario token returns 403', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app)
        .put('/api/ingredientes/1')
        .set('Authorization', `Bearer ${usuarioToken}`)
        .send({ costo_unitario: 2 });
      expect(res.status).toBe(403);
    });

    it('DELETE /:id — usuario token returns 403', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app)
        .delete('/api/ingredientes/1')
        .set('Authorization', `Bearer ${usuarioToken}`);
      expect(res.status).toBe(403);
    });

    it('DELETE /:id — admin token returns 204', async () => {
      const app = buildApp('/api/ingredientes', router);
      const res = await request(app)
        .delete('/api/ingredientes/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });

  // ------ VENTAS ------
  describe('ventas routes', () => {
    let router: express.Router;

    beforeAll(async () => {
      const mod = await import('../routes/ventas');
      router = mod.default;
    });

    it('GET / — no token returns 401', async () => {
      const app = buildApp('/api/ventas', router);
      const res = await request(app).get('/api/ventas');
      expect(res.status).toBe(401);
    });

    it('GET / — usuario token returns 403 (admin-only)', async () => {
      const app = buildApp('/api/ventas', router);
      const res = await request(app)
        .get('/api/ventas')
        .set('Authorization', `Bearer ${usuarioToken}`);
      expect(res.status).toBe(403);
    });

    it('GET / — admin token returns 200', async () => {
      const app = buildApp('/api/ventas', router);
      const res = await request(app)
        .get('/api/ventas')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /:id — no token returns 401', async () => {
      const app = buildApp('/api/ventas', router);
      const res = await request(app).get('/api/ventas/1');
      expect(res.status).toBe(401);
    });

    it('POST / — no token returns 401', async () => {
      const app = buildApp('/api/ventas', router);
      const res = await request(app).post('/api/ventas').send({});
      expect(res.status).toBe(401);
    });
  });

  // ------ PAGOS ------
  describe('pagos routes', () => {
    let router: express.Router;

    beforeAll(async () => {
      const mod = await import('../routes/pagos');
      router = mod.default;
    });

    it('GET /:id/pagos — no token returns 401', async () => {
      const app = buildApp('/api/ventas', router);
      const res = await request(app).get('/api/ventas/1/pagos');
      expect(res.status).toBe(401);
    });

    it('GET /:id/pagos — admin token returns 200', async () => {
      const app = buildApp('/api/ventas', router);
      const res = await request(app)
        .get('/api/ventas/1/pagos')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ------ MERCADO-PAGO ------
  describe('mercado-pago routes', () => {
    let router: express.Router;

    beforeAll(async () => {
      const mod = await import('../routes/mercado-pago');
      router = mod.default;
    });

    it('POST /preferencia — no token returns 401', async () => {
      const app = buildApp('/api/mercado-pago', router);
      const res = await request(app)
        .post('/api/mercado-pago/preferencia')
        .send({ ventaId: 1, items: [] });
      expect(res.status).toBe(401);
    });

    it('POST /preferencia — admin token proceeds (not 401/403)', async () => {
      const app = buildApp('/api/mercado-pago', router);
      const res = await request(app)
        .post('/api/mercado-pago/preferencia')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ventaId: 1, items: [{ title: 'Test', quantity: 1, unit_price: 10 }] });
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });

    it('POST /webhook — no token stays public (not 401)', async () => {
      const app = buildApp('/api/mercado-pago', router);
      const res = await request(app)
        .post('/api/mercado-pago/webhook')
        .send({ type: 'payment', data: { id: '123' } });
      expect(res.status).not.toBe(401);
    });
  });

  // ------ RECETAS ------
  describe('recetas routes', () => {
    let router: express.Router;

    beforeAll(async () => {
      const mod = await import('../routes/recetas');
      router = mod.default;
    });

    it('GET / — no token returns 401', async () => {
      const app = buildApp('/api/recetas', router);
      const res = await request(app).get('/api/recetas');
      expect(res.status).toBe(401);
    });

    it('GET / — usuario token returns 200', async () => {
      const app = buildApp('/api/recetas', router);
      const res = await request(app)
        .get('/api/recetas')
        .set('Authorization', `Bearer ${usuarioToken}`);
      expect(res.status).toBe(200);
    });

    it('GET /:id — no token returns 401', async () => {
      const app = buildApp('/api/recetas', router);
      const res = await request(app).get('/api/recetas/1');
      expect(res.status).toBe(401);
    });

    it('POST / — no token returns 401', async () => {
      const app = buildApp('/api/recetas', router);
      const res = await request(app).post('/api/recetas').send({});
      expect(res.status).toBe(401);
    });

    it('POST / — usuario token returns 403', async () => {
      const app = buildApp('/api/recetas', router);
      const res = await request(app)
        .post('/api/recetas')
        .set('Authorization', `Bearer ${usuarioToken}`)
        .send({ nombre: 'Test' });
      expect(res.status).toBe(403);
    });

    it('PUT /:id — usuario token returns 403', async () => {
      const app = buildApp('/api/recetas', router);
      const res = await request(app)
        .put('/api/recetas/1')
        .set('Authorization', `Bearer ${usuarioToken}`)
        .send({ nombre: 'Updated' });
      expect(res.status).toBe(403);
    });

    it('DELETE /:id — usuario token returns 403', async () => {
      const app = buildApp('/api/recetas', router);
      const res = await request(app)
        .delete('/api/recetas/1')
        .set('Authorization', `Bearer ${usuarioToken}`);
      expect(res.status).toBe(403);
    });

    it('DELETE /:id — admin token returns 204', async () => {
      const app = buildApp('/api/recetas', router);
      const res = await request(app)
        .delete('/api/recetas/1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });

  // ------ DASHBOARD ------
  describe('dashboard routes', () => {
    let router: express.Router;

    beforeAll(async () => {
      const mod = await import('../routes/dashboard');
      router = mod.default;
    });

    it('GET /stats — no token returns 401', async () => {
      const app = buildApp('/api/dashboard', router);
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.status).toBe(401);
    });

    it('GET /stats — usuario token returns 403', async () => {
      const app = buildApp('/api/dashboard', router);
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${usuarioToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /stats — admin token returns 200', async () => {
      const app = buildApp('/api/dashboard', router);
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
