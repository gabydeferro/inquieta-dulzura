import { z } from 'zod';

export const clienteCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  telefono: z.string().trim().optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

export const clienteUpdateSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').optional(),
  telefono: z.string().trim().optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().trim().optional(),
  notas: z.string().trim().optional(),
});

export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;
