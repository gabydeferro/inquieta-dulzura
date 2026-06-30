import { describe, it, expect } from 'vitest';
import {
  categoriaSchema,
  categoriaUpdateSchema,
  categoriaIdSchema,
} from '../schemas/categoria.schema';

describe('categoriaSchema', () => {
  it('should accept valid category data', () => {
    const result = categoriaSchema.safeParse({
      nombre: 'Bebidas',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Bebidas');
    }
  });

  it('should reject when nombre is missing', () => {
    const result = categoriaSchema.safeParse({
      descripcion: 'Todo tipo de bebidas',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((e) => e.path.join('.'));
      expect(fieldErrors).toContain('nombre');
    }
  });

  it('should reject empty nombre string', () => {
    const result = categoriaSchema.safeParse({
      nombre: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((e) => e.code);
      expect(codes).toContain('too_small');
    }
  });

  it('should accept category with descripcion', () => {
    const result = categoriaSchema.safeParse({
      nombre: 'Bebidas',
      descripcion: 'Todo tipo de bebidas',
    });
    expect(result.success).toBe(true);
  });
});

describe('categoriaUpdateSchema', () => {
  it('should accept partial update', () => {
    const result = categoriaUpdateSchema.safeParse({ nombre: 'Bebidas Frias' });
    expect(result.success).toBe(true);
  });

  it('should accept empty update', () => {
    const result = categoriaUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('categoriaIdSchema', () => {
  it('should accept valid numeric ID', () => {
    const result = categoriaIdSchema.safeParse({ id: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(5);
    }
  });

  it('should reject non-numeric ID', () => {
    const result = categoriaIdSchema.safeParse({ id: 'abc' });
    expect(result.success).toBe(false);
  });

  it('should reject negative ID', () => {
    const result = categoriaIdSchema.safeParse({ id: '-1' });
    expect(result.success).toBe(false);
  });

  it('should reject zero ID', () => {
    const result = categoriaIdSchema.safeParse({ id: '0' });
    expect(result.success).toBe(false);
  });
});
