import { z } from 'zod';

export const productoSchema = z.object({
  categoria_id: z.number().int().positive('Categoria ID must be a positive integer'),
  nombre: z.string().trim().min(1, 'Nombre is required'),
  descripcion: z.string().optional(),
  precio: z.number().positive('Precio must be positive'),
  costo: z.number().positive('Costo must be positive').optional(),
  sku: z.string().optional(),
  imagen: z.string().optional(),
  activo: z.boolean().optional(),
});

export const productoUpdateSchema = z.object({
  categoria_id: z.number().int().positive('Categoria ID must be a positive integer').optional(),
  nombre: z.string().trim().min(1, 'Nombre is required').optional(),
  descripcion: z.string().optional(),
  precio: z.number().positive('Precio must be positive').optional(),
  costo: z.number().positive('Costo must be positive').optional(),
  sku: z.string().optional(),
  imagen: z.string().optional(),
  activo: z.boolean().optional(),
});

export const productoIdSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const vinculoSchema = z.object({
  receta_id: z.number().int().positive('Receta ID must be a positive integer'),
  cantidad_receta: z.number().positive('Cantidad must be positive').default(1),
});

export type ProductoInput = z.infer<typeof productoSchema>;
export type ProductoUpdateInput = z.infer<typeof productoUpdateSchema>;
export type VinculoInput = z.infer<typeof vinculoSchema>;
