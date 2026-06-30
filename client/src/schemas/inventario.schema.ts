import { z } from 'zod';

const unidadMedidaValues = ['unidades', 'kg', 'litros', 'docenas'] as const;

export const inventarioCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  costo: z.coerce.number().positive('El costo debe ser mayor a 0').optional(),
  sku: z.string().optional(),
  categoria_id: z.coerce.number().int().positive('Selecciona una categoría'),
  cantidad_disponible: z.coerce.number().int().min(0, 'La cantidad disponible no puede ser negativa'),
  cantidad_minima: z.coerce.number().int().min(0, 'La cantidad mínima no puede ser negativa'),
  unidad_medida: z.enum(unidadMedidaValues, {
    error: 'Selecciona una unidad de medida válida',
  }).optional(),
});

export const inventarioUpdateSchema = inventarioCreateSchema.partial();

export type InventarioCreateInput = z.infer<typeof inventarioCreateSchema>;
export type InventarioUpdateInput = z.infer<typeof inventarioUpdateSchema>;
