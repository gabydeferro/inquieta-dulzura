import { z } from 'zod';

const unidadMedidaValues = ['kg', 'litros', 'unidades', 'gramos', 'ml'] as const;

export const ingredienteSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre is required'),
  descripcion: z.string().optional(),
  unidad_medida: z.enum(unidadMedidaValues, {
    error: () => 'Unidad de medida must be one of: kg, litros, unidades, gramos, ml',
  }),
  costo_unitario: z.number().positive('Costo unitario must be positive').optional(),
  activo: z.boolean().optional(),
});

export const ingredienteUpdateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre is required').optional(),
  descripcion: z.string().optional(),
  unidad_medida: z
    .enum(unidadMedidaValues, {
      error: () => 'Unidad de medida must be one of: kg, litros, unidades, gramos, ml',
    })
    .optional(),
  costo_unitario: z.number().positive('Costo unitario must be positive').optional(),
  activo: z.boolean().optional(),
});

export type IngredienteInput = z.infer<typeof ingredienteSchema>;
export type IngredienteUpdateInput = z.infer<typeof ingredienteUpdateSchema>;
