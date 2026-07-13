import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

interface MPItem {
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

    return {
      url: (result as any).init_point,
      preference_id: (result as any).id,
    };
  }

  async handleWebhook(paymentId: string): Promise<WebhookResult> {
    const payment = await this.payment.get({ id: paymentId });

    return {
      status: (payment as any).status,
      external_reference: (payment as any).external_reference,
      payment_id: paymentId,
      transaction_amount: (payment as any).transaction_amount,
    };
  }
}
