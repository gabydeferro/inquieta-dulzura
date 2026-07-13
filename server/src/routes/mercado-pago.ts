import { Router, Request, Response } from 'express';
import { MercadoPagoService } from '../services/MercadoPagoService';

const router = Router();

/**
 * @route   POST /api/mercado-pago/preferencia
 * @desc    Create a Mercado Pago payment preference for a venta
 * @access  Private
 */
router.post('/preferencia', async (req: Request, res: Response) => {
  try {
    const { ventaId, items } = req.body;

    if (!ventaId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'ventaId and items array are required',
      });
      return;
    }

    const service = new MercadoPagoService();
    const result = await service.createPreference(ventaId, items);

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
  try {
    const signature = req.headers['x-signature'] as string | undefined;

    // Log webhook for future IPN signature verification
    if (signature) {
      console.log('MP webhook received with signature:', signature);
    }

    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const service = new MercadoPagoService();
      const paymentDetails = await service.handleWebhook(String(data.id));
      console.log('MP payment webhook processed:', paymentDetails);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing MP webhook:', error);
    // Always return 200 to MP — they retry on non-200
    res.sendStatus(200);
  }
});

export default router;
