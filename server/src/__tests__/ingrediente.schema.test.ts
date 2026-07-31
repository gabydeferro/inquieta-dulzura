import { describe, it, expect } from 'vitest';
import {
  ingredienteSchema,
  ingredienteUpdateSchema,
  ingredienteStockSchema,
} from '../schemas/ingrediente.schema';

describe('ingredienteSchema', () => {
  it('should accept valid ingredient data', () => {
    const result = ingredienteSchema.safeParse({
      nombre: 'Harina',
      unidad_medida: 'kg',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Harina');
      expect(result.data.unidad_medida).toBe('kg');
    }
  });

  it('should reject when nombre is missing', () => {
    const result = ingredienteSchema.safeParse({
      unidad_medida: 'kg',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((e) => e.path.join('.'));
      expect(fieldErrors).toContain('nombre');
    }
  });

  it('should reject whitespace-only nombre', () => {
    const result = ingredienteSchema.safeParse({
      nombre: '   ',
      unidad_medida: 'kg',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((e) => e.code);
      expect(codes).toContain('too_small');
    }
  });

  it('should reject invalid unidad_medida value', () => {
    const result = ingredienteSchema.safeParse({
      nombre: 'Harina',
      unidad_medida: 'tonelada',
    });
    expect(result.success).toBe(false);
  });

  it('should reject unidad_medida as number', () => {
    const result = ingredienteSchema.safeParse({
      nombre: 'Harina',
      unidad_medida: 123,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((e) => e.path.join('.'));
      expect(fieldErrors).toContain('unidad_medida');
    }
  });
});

describe('ingredienteUpdateSchema', () => {
  it('should accept partial update data', () => {
    const result = ingredienteUpdateSchema.safeParse({
      nombre: 'Harina Integral',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Harina Integral');
    }
  });

  it('should accept empty object (partial update)', () => {
    const result = ingredienteUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject invalid unidad_medida in update', () => {
    const result = ingredienteUpdateSchema.safeParse({
      nombre: 'Harina',
      unidad_medida: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('ingredienteStockSchema', () => {
  it('should accept valid stock data with cantidad_disponible >= 0', () => {
    const result = ingredienteStockSchema.safeParse({
      cantidad_disponible: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cantidad_disponible).toBe(50);
    }
  });

  it('should accept stock = 0 (boundary)', () => {
    const result = ingredienteStockSchema.safeParse({
      cantidad_disponible: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cantidad_disponible).toBe(0);
    }
  });

  it('should reject negative cantidad_disponible', () => {
    const result = ingredienteStockSchema.safeParse({
      cantidad_disponible: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing cantidad_disponible', () => {
    const result = ingredienteStockSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject non-numeric cantidad_disponible', () => {
    const result = ingredienteStockSchema.safeParse({
      cantidad_disponible: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });
});
