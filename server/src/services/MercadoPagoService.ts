import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { createHmac, timingSafeEqual } from 'crypto';

export interface MPItem {
  id?: string;
  title: string;
  quantity: number;
  unit_price: number;
}

interface PreferenceResult {
  url: string;
  preference_id: string;
}

interface WebhookResult {
  status: string;
  external_reference: string;
  payment_id: string;
  transaction_amount: number;
}

// MercadoPago SDK response types (untyped in the SDK)
interface MPPreferenceResponse {
  init_point?: string;
  id?: string;
}

interface MPPaymentResponse {
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
}

export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private preference: Preference;
  private payment: Payment;

  constructor() {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
    }
    this.client = new MercadoPagoConfig({ accessToken });
    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPreference(ventaId: number, items: MPItem[]): Promise<PreferenceResult> {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const notificationUrl = process.env.MERCADO_PAGO_NOTIFICATION_URL;

    const result = await this.preference.create({
      body: {
        items: items.map((item, index) => ({
          id: item.id ?? String(index + 1),
          ...item,
          currency_id: 'ARS' as const,
        })),
        external_reference: String(ventaId),
        statement_descriptor: 'INQUIETA DULZURA',
        binary_mode: true,
        payment_methods: {
          installments: 12,
        },
        back_urls: {
          success: `${clientUrl}/ventas?pago=exito`,
          failure: `${clientUrl}/ventas?pago=fallo`,
          pending: `${clientUrl}/ventas?pago=pendiente`,
        },
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      },
    });

    const typedResult = result as MPPreferenceResponse;
    return {
      url: typedResult.init_point ?? '',
      preference_id: typedResult.id ?? '',
    };
  }

  async handleWebhook(paymentId: string): Promise<WebhookResult> {
    const payment = await this.payment.get({ id: paymentId });

    const typedPayment = payment as MPPaymentResponse;
    return {
      status: typedPayment.status ?? 'unknown',
      external_reference: typedPayment.external_reference ?? '',
      payment_id: paymentId,
      transaction_amount: typedPayment.transaction_amount ?? 0,
    };
  }

  /**
   * Verify Mercado Pago webhook x-signature using HMAC-SHA256.
   * Canonical string: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
   * Signed with the webhook secret key from the MP dashboard.
   */
  verifySignature(headers: Record<string, string | undefined>, body: string): boolean {
    // Skip signature verification in development — verify only in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MP Webhook] Dev mode — skipping signature verification');
      return true;
    }

    const signatureHeader = headers['x-signature'];
    const requestId = headers['x-request-id'];
    if (!signatureHeader || !requestId) return false;

    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('MP_WEBHOOK_SECRET not configured — skipping signature verification');
      return true;
    }

    try {
      // Parse x-signature: "ts=123,v1=abcdef..."
      const parts = Object.fromEntries(
        signatureHeader.split(',').map((p) => {
          const [k, ...v] = p.split('=');
          return [k, v.join('=')];
        }),
      );
      const ts = parts['ts'];
      const v1 = parts['v1'];
      if (!ts || !v1) return false;

      // Parse body to get data.id
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const data = parsed.data as Record<string, string> | undefined;
      const dataId = data?.id;
      if (!dataId) return false;

      // Build canonical string per MP docs
      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      const hmac = createHmac('sha256', secret);
      hmac.update(manifest);
      const expectedV1 = hmac.digest('hex');

      // Timing-safe comparison
      const expectedBuf = Buffer.from(expectedV1, 'hex');
      const receivedBuf = Buffer.from(v1, 'hex');
      if (expectedBuf.length !== receivedBuf.length) return false;
      return timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      return false;
    }
  }
}
