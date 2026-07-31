import { z } from 'zod';

export const produccionBodySchema = z.object({
  receta_id: z.number().int('receta_id debe ser entero').positive('receta_id debe ser positivo'),
  cantidad_producir: z.number().positive('cantidad_producir debe ser positivo'),
});

export const produccionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ProduccionBodyInput = z.infer<typeof produccionBodySchema>;
export type ProduccionQueryInput = z.infer<typeof produccionQuerySchema>;
