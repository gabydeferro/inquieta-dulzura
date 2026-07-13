import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// ──────────────────────────────────────────────
// Mocks — hoisted before ALL imports
// ──────────────────────────────────────────────

const mockPreferenceCreate = vi.fn();
const mockPaymentGet = vi.fn();

vi.mock('mercadopago', () => {
  return {
    MercadoPagoConfig: vi.fn().mockImplementation(function () {
      return {};
    }),
    Preference: vi.fn().mockImplementation(function () {
      return { create: mockPreferenceCreate };
    }),
    Payment: vi.fn().mockImplementation(function () {
      return { get: mockPaymentGet };
    }),
  };
});

// ──────────────────────────────────────────────
// Imports (use mocked modules)
// ──────────────────────────────────────────────

import { MercadoPagoService } from '../services/MercadoPagoService';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const MockedMercadoPagoConfig = vi.mocked(MercadoPagoConfig);
const MockedPreference = vi.mocked(Preference);
const MockedPayment = vi.mocked(Payment);

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('MercadoPagoService', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'test-access-token';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe('constructor', () => {
    test('initializes SDK clients when access token is provided', () => {
      const service = new MercadoPagoService();

      expect(MockedMercadoPagoConfig).toHaveBeenCalledWith({
        accessToken: 'test-access-token',
      });
      expect(MockedPreference).toHaveBeenCalledOnce();
      expect(MockedPayment).toHaveBeenCalledOnce();
      expect(service).toBeDefined();
    });

    test('throws when MERCADO_PAGO_ACCESS_TOKEN is missing', () => {
      delete process.env.MERCADO_PAGO_ACCESS_TOKEN;

      expect(() => new MercadoPagoService()).toThrow(
        'MERCADO_PAGO_ACCESS_TOKEN not configured',
      );
    });
  });

  describe('createPreference', () => {
    test('creates preference with items and returns URL and preference ID', async () => {
      mockPreferenceCreate.mockResolvedValueOnce({
        init_point: 'https://mercadopago.com/checkout/v1/redirect?pref_id=12345',
        id: '12345',
      });

      const service = new MercadoPagoService();
      const items = [
        { title: 'Torta Red Velvet', quantity: 2, unit_price: 5000 },
        { title: 'Alfajor x6', quantity: 1, unit_price: 3000 },
      ];

      const result = await service.createPreference(42, items);

      expect(result).toEqual({
        url: 'https://mercadopago.com/checkout/v1/redirect?pref_id=12345',
        preference_id: '12345',
      });
      expect(mockPreferenceCreate).toHaveBeenCalledOnce();
      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: {
          items: [
            { title: 'Torta Red Velvet', quantity: 2, unit_price: 5000, currency_id: 'ARS' },
            { title: 'Alfajor x6', quantity: 1, unit_price: 3000, currency_id: 'ARS' },
          ],
          external_reference: '42',
          back_urls: {
            success: 'http://localhost:5173/ventas?pago=exito',
            failure: 'http://localhost:5173/ventas?pago=fallo',
            pending: 'http://localhost:5173/ventas?pago=pendiente',
          },
          auto_return: 'approved',
        },
      });
    });

    test('uses default FRONTEND_URL when env var is not set', async () => {
      delete process.env.FRONTEND_URL;

      mockPreferenceCreate.mockResolvedValueOnce({
        init_point: 'https://mercadopago.com/checkout?pref_id=99',
        id: '99',
      });

      const service = new MercadoPagoService();
      await service.createPreference(1, [{ title: 'Item', quantity: 1, unit_price: 100 }]);

      expect(mockPreferenceCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            back_urls: {
              success: 'http://localhost:5173/ventas?pago=exito',
              failure: 'http://localhost:5173/ventas?pago=fallo',
              pending: 'http://localhost:5173/ventas?pago=pendiente',
            },
          }),
        }),
      );
    });

    test('propagates SDK errors from preference creation', async () => {
      mockPreferenceCreate.mockRejectedValueOnce(new Error('MP API timeout'));

      const service = new MercadoPagoService();

      await expect(
        service.createPreference(1, [{ title: 'Item', quantity: 1, unit_price: 100 }]),
      ).rejects.toThrow('MP API timeout');
    });
  });

  describe('handleWebhook', () => {
    test('returns payment details when webhook payment ID is valid', async () => {
      mockPaymentGet.mockResolvedValueOnce({
        status: 'approved',
        external_reference: '42',
        id: 'MP-PAY-123',
        transaction_amount: 14000,
      });

      const service = new MercadoPagoService();
      const result = await service.handleWebhook('MP-PAY-123');

      expect(result).toEqual({
        status: 'approved',
        external_reference: '42',
        payment_id: 'MP-PAY-123',
        transaction_amount: 14000,
      });
      expect(mockPaymentGet).toHaveBeenCalledWith({ id: 'MP-PAY-123' });
    });

    test('propagates SDK errors when payment lookup fails', async () => {
      mockPaymentGet.mockRejectedValueOnce(new Error('Payment not found'));

      const service = new MercadoPagoService();

      await expect(service.handleWebhook('INVALID-ID')).rejects.toThrow(
        'Payment not found',
      );
    });

    test('handles pending payment status correctly', async () => {
      mockPaymentGet.mockResolvedValueOnce({
        status: 'pending',
        external_reference: '55',
        id: 'MP-PAY-456',
        transaction_amount: 8000,
      });

      const service = new MercadoPagoService();
      const result = await service.handleWebhook('MP-PAY-456');

      expect(result.status).toBe('pending');
      expect(result.external_reference).toBe('55');
      expect(result.transaction_amount).toBe(8000);
    });
  });
});
