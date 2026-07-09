import { z } from 'zod';

export const recetaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'Nombre debe tener al menos 2 caracteres'),
  descripcion: z
    .string()
    .trim()
    .min(1, 'Descripción es requerida'),
  tiempo_preparacion: z
    .number()
    .int('Debe ser un número entero')
    .positive('Debe ser un número positivo'),
  porciones: z
    .number()
    .int('Debe ser un número entero')
    .positive('Debe ser un número positivo'),
  instrucciones: z.string().optional(),
  ingredientes: z
    .array(
      z.object({
        ingrediente_id: z.number(),
        cantidad: z.number().positive(),
        unidad_medida: z.string(),
      }),
    )
    .optional(),
});

export const recetaUpdateSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre debe tener al menos 2 caracteres').optional(),
  descripcion: z.string().trim().min(1, 'Descripción es requerida').optional(),
  tiempo_preparacion: z
    .number()
    .int('Debe ser un número entero')
    .positive('Debe ser un número positivo')
    .optional(),
  porciones: z
    .number()
    .int('Debe ser un número entero')
    .positive('Debe ser un número positivo')
    .optional(),
  instrucciones: z.string().optional(),
  ingredientes: z
    .array(
      z.object({
        ingrediente_id: z.number(),
        cantidad: z.number().positive(),
        unidad_medida: z.string(),
      }),
    )
    .optional(),
});

export type RecetaInput = z.infer<typeof recetaSchema>;
export type RecetaUpdateInput = z.infer<typeof recetaUpdateSchema>;
