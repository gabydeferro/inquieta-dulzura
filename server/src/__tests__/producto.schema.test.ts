import { describe, it, expect } from 'vitest';
import {
  productoSchema,
  productoUpdateSchema,
  productoIdSchema,
  vinculoSchema,
} from '../schemas/producto.schema';

describe('productoSchema', () => {
  it('should accept valid product data', () => {
    const result = productoSchema.safeParse({
      nombre: 'Café',
      categoria_id: 1,
      precio: 2500,
      descripcion: 'Café molido 500g',
      imagen: 'cafe.jpg',
      activo: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Café');
      expect(result.data.precio).toBe(2500);
    }
  });

  it('should reject missing required fields', () => {
    const result = productoSchema.safeParse({ nombre: 'Café' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((e) => e.path.join('.'));
      expect(fieldErrors).toContain('categoria_id');
      expect(fieldErrors).toContain('precio');
    }
  });

  it('should reject precio as string', () => {
    const result = productoSchema.safeParse({
      nombre: 'Café',
      categoria_id: 1,
      precio: 'dos mil',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((e) => e.path.join('.'));
      expect(fieldErrors).toContain('precio');
    }
  });

  it('should reject negative categoria_id', () => {
    const result = productoSchema.safeParse({
      nombre: 'Café',
      categoria_id: -1,
      precio: 2500,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((e) => e.path.join('.'));
      expect(fieldErrors).toContain('categoria_id');
    }
  });

  it('should reject zero precio', () => {
    const result = productoSchema.safeParse({
      nombre: 'Café',
      categoria_id: 1,
      precio: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((e) => e.path.join('.'));
      expect(fieldErrors).toContain('precio');
    }
  });

  it('should accept product without optional fields', () => {
    const result = productoSchema.safeParse({
      nombre: 'Café',
      categoria_id: 1,
      precio: 2500,
    });
    expect(result.success).toBe(true);
  });
});

describe('productoUpdateSchema', () => {
  it('should accept partial update with only precio', () => {
    const result = productoUpdateSchema.safeParse({ precio: 3000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.precio).toBe(3000);
    }
  });

  it('should reject precio as string in update', () => {
    const result = productoUpdateSchema.safeParse({ precio: 'gratis' });
    expect(result.success).toBe(false);
  });

  it('should accept empty update object', () => {
    const result = productoUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('productoIdSchema', () => {
  it('should accept valid numeric ID', () => {
    const result = productoIdSchema.safeParse({ id: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(5);
    }
  });

  it('should reject non-numeric ID', () => {
    const result = productoIdSchema.safeParse({ id: 'xyz' });
    expect(result.success).toBe(false);
  });

  it('should reject negative ID', () => {
    const result = productoIdSchema.safeParse({ id: '-1' });
    expect(result.success).toBe(false);
  });
});

describe('vinculoSchema', () => {
  it('should accept valid vinculo payload', () => {
    const result = vinculoSchema.safeParse({ receta_id: 3, cantidad_receta: 2.5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.receta_id).toBe(3);
      expect(result.data.cantidad_receta).toBe(2.5);
    }
  });

  it('should default cantidad_receta to 1 when omitted', () => {
    const result = vinculoSchema.safeParse({ receta_id: 3 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cantidad_receta).toBe(1);
    }
  });

  it('should reject missing receta_id', () => {
    const result = vinculoSchema.safeParse({ cantidad_receta: 2 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((e) => e.path.join('.'));
      expect(fieldErrors).toContain('receta_id');
    }
  });

  it('should reject negative receta_id', () => {
    const result = vinculoSchema.safeParse({ receta_id: -1, cantidad_receta: 1 });
    expect(result.success).toBe(false);
  });

  it('should reject zero cantidad_receta', () => {
    const result = vinculoSchema.safeParse({ receta_id: 3, cantidad_receta: 0 });
    expect(result.success).toBe(false);
  });
});
