import { z } from 'zod';

export const ventaDetalleSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive(),
  precio_unitario: z.coerce.number().positive(),
  subtotal: z.coerce.number().positive(),
});

export const ventaCreateSchema = z.object({
  cliente_id: z.coerce.number().int().positive().optional(),
  metodo_pago: z.enum([
    'efectivo',
    'tarjeta',
    'transferencia',
    'mercado_pago',
    'cuenta_dni',
    'modo',
    'otro',
  ]),
  descuento: z.coerce.number().min(0).default(0),
  productos: z.array(ventaDetalleSchema).min(1, 'Agrega al menos un producto'),
});

export type VentaCreateInput = z.infer<typeof ventaCreateSchema>;
