import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export interface MPItem {
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const result = await this.preference.create({
      body: {
        items: items.map((item) => ({
          ...item,
          currency_id: 'ARS' as const,
        })),
        external_reference: String(ventaId),
        back_urls: {
          success: `${frontendUrl}/ventas?pago=exito`,
          failure: `${frontendUrl}/ventas?pago=fallo`,
          pending: `${frontendUrl}/ventas?pago=pendiente`,
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
}
