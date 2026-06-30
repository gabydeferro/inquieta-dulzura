import { z } from 'zod';

export const categoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre is required'),
  descripcion: z.string().optional(),
});

export const categoriaUpdateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre is required').optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

export const categoriaIdSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type CategoriaUpdateInput = z.infer<typeof categoriaUpdateSchema>;
