import { describe, it, expect } from 'vitest';
import { IncompatibleUnitsError } from '../errors/IncompatibleUnitsError';
import { InsufficientIngredientStockError } from '../errors/InsufficientIngredientStockError';

describe('IncompatibleUnitsError', () => {
  it('should create an error with the correct message and name', () => {
    const error = new IncompatibleUnitsError('gramos', 'litros');
    expect(error.message).toBe('Unidades incompatibles: gramos → litros');
    expect(error.name).toBe('IncompatibleUnitsError');
  });

  it('should preserve the from and to units', () => {
    const error = new IncompatibleUnitsError('kg', 'ml');
    expect(error.from).toBe('kg');
    expect(error.to).toBe('ml');
  });

  it('should be an instance of Error', () => {
    const error = new IncompatibleUnitsError('a', 'b');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('InsufficientIngredientStockError', () => {
  it('should create an error with the correct properties', () => {
    const error = new InsufficientIngredientStockError(1, 'Harina', 2, 5);
    expect(error.ingrediente_id).toBe(1);
    expect(error.nombre).toBe('Harina');
    expect(error.disponible).toBe(2);
    expect(error.requerido).toBe(5);
    expect(error.name).toBe('InsufficientIngredientStockError');
  });

  it('should format a descriptive message', () => {
    const error = new InsufficientIngredientStockError(3, 'Azúcar', 1.5, 3);
    expect(error.message).toContain('Azúcar');
    expect(error.message).toContain('1.5');
    expect(error.message).toContain('3');
  });

  it('should be an instance of Error', () => {
    const error = new InsufficientIngredientStockError(1, 'Test', 0, 10);
    expect(error).toBeInstanceOf(Error);
  });
});
