import { z } from 'zod';

export const ventaDetalleSchema = z.object({
  producto_id: z.coerce.number().int().positive('El ID del producto debe ser un número positivo'),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  precio_unitario: z.coerce.number().positive('El precio unitario debe ser mayor a 0'),
  subtotal: z.coerce.number().positive('El subtotal debe ser mayor a 0'),
});

export const ventaCreateSchema = z.object({
  cliente_id: z.coerce.number().int().positive().optional(),
  metodo_pago: z.enum(['efectivo', 'tarjeta', 'transferencia', 'otro'], {
    message: 'Selecciona un método de pago válido',
  }),
  descuento: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
  productos: z.array(ventaDetalleSchema).min(1, 'Agrega al menos un producto'),
});

export type CreateVentaInput = z.infer<typeof ventaCreateSchema>;
export type VentaDetalleInput = z.infer<typeof ventaDetalleSchema>;
