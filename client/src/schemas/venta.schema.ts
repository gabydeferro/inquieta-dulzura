import { z } from 'zod';

// Schema Contract (from spec)
// ventaDetalleSchema: producto_id (positive int), cantidad (positive), precio_unitario (positive), subtotal (positive)
// ventaCreateSchema: metodo_pago (enum), descuento (min 0, default 0), productos (min 1)

export const ventaDetalleSchema = z.object({
  producto_id: z.coerce.number().int().positive('producto_id must be a positive integer'),
  cantidad: z.coerce.number().positive('cantidad must be positive'),
  precio_unitario: z.coerce.number().positive('precio_unitario must be positive'),
  subtotal: z.coerce.number().positive('subtotal must be positive'),
});

export const ventaCreateSchema = z.object({
  metodo_pago: z.enum(
    ['efectivo', 'tarjeta', 'transferencia', 'mercado_pago', 'cuenta_dni', 'modo', 'otro'],
    { message: 'Método de pago inválido' },
  ),
  descuento: z.coerce.number().min(0, 'El descuento debe ser mayor o igual a 0').default(0),
  productos: z.array(ventaDetalleSchema).min(1, 'Debe agregar al menos un producto'),
  cliente: z.string()
    .trim()
    .min(1, 'Cliente debe ser un nombre válido')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Cliente debe ser un nombre válido')
    .optional(),
});

// Inferred types
export type VentaDetalleInput = z.infer<typeof ventaDetalleSchema>;
export type VentaCreateInput = z.infer<typeof ventaCreateSchema>;

export const ventaSchema = z.object({
  id: z.number(),
  fecha_venta: z.string(),
  cliente: z.string().optional(),
  subtotal: z.number(),
  descuento: z.number(),
  impuestos: z.number(),
  total: z.number(),
  metodo_pago: ventaCreateSchema.shape.metodo_pago,
  estado: z.string(),
  productos: z.array(ventaDetalleSchema),
});

export type VentaResponse = z.infer<typeof ventaSchema>;
