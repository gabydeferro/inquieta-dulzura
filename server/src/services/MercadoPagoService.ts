import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { createHmac } from 'crypto';

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

    const result = await this.preference.create({
      body: {
        items: items.map((item, index) => ({
          id: item.id ?? String(index + 1),
          ...item,
          currency_id: 'ARS' as const,
        })),
        external_reference: String(ventaId),
        back_urls: {
          success: `${clientUrl}/ventas?pago=exito`,
          failure: `${clientUrl}/ventas?pago=fallo`,
          pending: `${clientUrl}/ventas?pago=pendiente`,
        },
        auto_return: 'approved' as const,
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
   * Verify Mercado Pago IPN webhook x-signature using HMAC-SHA256.
   * MP signs: "id:{paymentId};ts:{timestamp};" with the public key.
   */
  async verifySignature(
    headers: Record<string, string | undefined>,
    body: string,
  ): Promise<boolean> {
    const signatureHeader = headers['x-signature'];
    if (!signatureHeader) return false;

    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
    if (!publicKey) return false;

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

      // Parse body to get payment id
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const data = parsed.data as Record<string, string> | undefined;
      const paymentId = data?.id;
      if (!paymentId) return false;

      // Reconstruct manifest and verify HMAC
      const manifest = `id:${paymentId};ts:${ts};`;
      const hmac = createHmac('sha256', publicKey);
      hmac.update(manifest);
      const expectedV1 = hmac.digest('hex');

      return v1 === expectedV1;
    } catch {
      return false;
    }
  }
}
