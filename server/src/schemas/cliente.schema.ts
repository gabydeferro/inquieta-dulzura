import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre es requerido'),
  telefono: z.string().trim().optional(),
  email: z.string().trim().email('Email inválido').optional(),
  direccion: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

export const clienteUpdateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre es requerido').optional(),
  telefono: z.string().trim().optional(),
  email: z.string().trim().email('Email inválido').optional(),
  direccion: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;
