import { Router, Request, Response } from 'express';
import { MercadoPagoService, MPItem } from '../services/MercadoPagoService';
import { PagosService } from '../services/PagosService';
import { VentasService } from '../services/VentasService';

const router = Router();

// --- Simple in-memory rate limiter for the webhook endpoint ---
const webhookHits = new Map<string, { count: number; resetTime: number }>();
const WEBHOOK_LIMIT = 30;
const WEBHOOK_WINDOW_MS = 60_000;

function checkWebhookRate(ip: string): boolean {
  const now = Date.now();
  const entry = webhookHits.get(ip);
  if (!entry || now > entry.resetTime) {
    webhookHits.set(ip, { count: 1, resetTime: now + WEBHOOK_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= WEBHOOK_LIMIT;
}
// --- End rate limiter ---

interface PreferenciaBody {
  ventaId?: number;
  items?: MPItem[];
}

interface WebhookBody {
  type?: string;
  data?: { id?: string };
}

/**
 * @route   POST /api/mercado-pago/preferencia
 * @desc    Create a Mercado Pago payment preference for a venta
 * @access  Private
 */
router.post('/preferencia', async (req: Request, res: Response) => {
  try {
    const body = req.body as PreferenciaBody;
    const { ventaId, items } = body;

    if (!ventaId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'ventaId and items array are required',
      });
      return;
    }

    const service = new MercadoPagoService();
    const result = await service.createPreference(Number(ventaId), items);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating MP preference:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error creating payment preference',
    });
  }
});

/**
 * @route   POST /api/mercado-pago/webhook
 * @desc    Receive Mercado Pago IPN webhook notifications
 * @access  Public (MP servers call this)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  if (!checkWebhookRate(ip)) {
    res.status(429).json({ success: false, message: 'Too Many Requests' });
    return;
  }

  try {
    const mpService = new MercadoPagoService();

    // 1. Verify IPN signature
    const validSignature = await mpService.verifySignature(
      req.headers as Record<string, string | undefined>,
      JSON.stringify(req.body),
    );

    if (!validSignature) {
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    const body = req.body as WebhookBody;
    const { type, data } = body;

    if (type !== 'payment' || !data?.id) {
      res.sendStatus(200);
      return;
    }

    // 2. Get payment details from MP
    const paymentDetails = await mpService.handleWebhook(String(data.id));
    const ventaId = Number(paymentDetails.external_reference);

    if (!ventaId || isNaN(ventaId)) {
      res.sendStatus(200);
      return;
    }

    // 3. Check idempotency — skip if pago already has referencia_externa
    const pagosService = new PagosService();
    const existingPagos = await pagosService.getByVentaId(ventaId);
    const existingPago = existingPagos[0];

    if (existingPago?.referencia_externa) {
      res.sendStatus(200);
      return;
    }

    // 4. Update pago with payment details
    await pagosService.updateByVentaId(ventaId, {
      estado: paymentDetails.status === 'approved' ? 'aprobado'
        : paymentDetails.status === 'rejected' ? 'rechazado'
        : paymentDetails.status,
      referencia_externa: paymentDetails.payment_id,
      datos_json: JSON.stringify(paymentDetails),
    });

    // 5. Update venta estado based on payment status
    const ventasService = new VentasService();

    if (paymentDetails.status === 'approved') {
      await ventasService.updateStatus(ventaId, 'completada');
      await ventasService.decrementStock(ventaId);
    } else if (paymentDetails.status === 'rejected') {
      await ventasService.updateStatus(ventaId, 'cancelada');
    }
    // in_process / pending → keep current estado (pendiente)

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing MP webhook:', error);
    // Always return 200 to MP — they retry on non-200
    res.sendStatus(200);
  }
});

export default router;
