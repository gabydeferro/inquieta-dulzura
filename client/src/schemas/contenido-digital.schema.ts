import { z } from 'zod';

export const contenidoDigitalCreateSchema = z.object({
  productoId: z.coerce.number().int().positive('Selecciona un producto'),
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['imagen', 'video'], {
    error: 'Selecciona un tipo válido (imagen o video)',
  }),
});

export type ContenidoDigitalCreateInput = z.infer<typeof contenidoDigitalCreateSchema>;
