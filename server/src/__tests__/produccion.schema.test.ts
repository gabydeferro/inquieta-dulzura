import { describe, it, expect } from 'vitest';
import { produccionBodySchema, produccionQuerySchema } from '../schemas/produccion.schema';

describe('produccionBodySchema', () => {
  it('should accept valid production input', () => {
    const result = produccionBodySchema.safeParse({
      receta_id: 1,
      cantidad_producir: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.receta_id).toBe(1);
      expect(result.data.cantidad_producir).toBe(5);
    }
  });

  it('should reject missing receta_id', () => {
    const result = produccionBodySchema.safeParse({
      cantidad_producir: 5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing cantidad_producir', () => {
    const result = produccionBodySchema.safeParse({
      receta_id: 1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-positive cantidad_producir', () => {
    const result = produccionBodySchema.safeParse({
      receta_id: 1,
      cantidad_producir: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative cantidad_producir', () => {
    const result = produccionBodySchema.safeParse({
      receta_id: 1,
      cantidad_producir: -3,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-numeric receta_id', () => {
    const result = produccionBodySchema.safeParse({
      receta_id: 'abc',
      cantidad_producir: 5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty body', () => {
    const result = produccionBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('produccionQuerySchema', () => {
  it('should accept default query (no params)', () => {
    const result = produccionQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should accept explicit page and limit', () => {
    const result = produccionQuerySchema.safeParse({
      page: 2,
      limit: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('should reject negative limit', () => {
    const result = produccionQuerySchema.safeParse({
      limit: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject page zero', () => {
    const result = produccionQuerySchema.safeParse({
      page: 0,
    });
    expect(result.success).toBe(false);
  });
});
