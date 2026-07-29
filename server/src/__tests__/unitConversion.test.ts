import { describe, it, expect } from 'vitest';
import { convertUnit, areUnitsCompatible, UNIT_CATALOG } from '../utils/unitConversion';
import { IncompatibleUnitsError } from '../errors/IncompatibleUnitsError';

describe('UNIT_CATALOG', () => {
  it('should define mass group with kg as base', () => {
    expect(UNIT_CATALOG['kg'].group).toBe('mass');
    expect(UNIT_CATALOG['kg'].toBase).toBe(1);
  });

  it('should define gramos as 0.001 of base (kg)', () => {
    expect(UNIT_CATALOG['gramos'].group).toBe('mass');
    expect(UNIT_CATALOG['gramos'].toBase).toBe(0.001);
  });

  it('should define volume group with litros as base', () => {
    expect(UNIT_CATALOG['litros'].group).toBe('volume');
    expect(UNIT_CATALOG['litros'].toBase).toBe(1);
  });

  it('should define ml as 0.001 of base (litros)', () => {
    expect(UNIT_CATALOG['ml'].group).toBe('volume');
    expect(UNIT_CATALOG['ml'].toBase).toBe(0.001);
  });

  it('should define count group with unidades as base', () => {
    expect(UNIT_CATALOG['unidades'].group).toBe('count');
    expect(UNIT_CATALOG['unidades'].toBase).toBe(1);
  });

  it('should define docenas in count group', () => {
    expect(UNIT_CATALOG['docenas'].group).toBe('count');
    expect(UNIT_CATALOG['docenas'].toBase).toBe(12);
  });
});

describe('convertUnit', () => {
  it('should return the same value when converting to the same unit', () => {
    expect(convertUnit(5, 'kg', 'kg')).toBe(5);
    expect(convertUnit(100, 'litros', 'litros')).toBe(100);
    expect(convertUnit(3, 'unidades', 'unidades')).toBe(3);
  });

  it('should convert kilograms to grams', () => {
    const result = convertUnit(2, 'kg', 'gramos');
    expect(result).toBe(2000);
  });

  it('should convert grams to kilograms', () => {
    const result = convertUnit(500, 'gramos', 'kg');
    expect(result).toBe(0.5);
  });

  it('should convert litres to millilitres', () => {
    const result = convertUnit(1.5, 'litros', 'ml');
    expect(result).toBe(1500);
  });

  it('should convert millilitres to litres', () => {
    const result = convertUnit(250, 'ml', 'litros');
    expect(result).toBe(0.25);
  });

  it('should convert unidades to docenas', () => {
    const result = convertUnit(24, 'unidades', 'docenas');
    expect(result).toBe(2);
  });

  it('should convert docenas to unidades', () => {
    const result = convertUnit(3, 'docenas', 'unidades');
    expect(result).toBe(36);
  });

  it('should throw IncompatibleUnitsError when units are from different groups', () => {
    expect(() => convertUnit(1, 'kg', 'litros')).toThrow(IncompatibleUnitsError);
    expect(() => convertUnit(1, 'gramos', 'ml')).toThrow(IncompatibleUnitsError);
    expect(() => convertUnit(1, 'unidades', 'litros')).toThrow(IncompatibleUnitsError);
  });

  it('should throw IncompatibleUnitsError for unknown units', () => {
    expect(() => convertUnit(1, 'unknown', 'kg')).toThrow(IncompatibleUnitsError);
    expect(() => convertUnit(1, 'kg', 'unknown')).toThrow(IncompatibleUnitsError);
  });

  it('should handle zero value correctly', () => {
    expect(convertUnit(0, 'kg', 'gramos')).toBe(0);
  });

  it('should handle decimal precision correctly', () => {
    const result = convertUnit(0.001, 'kg', 'gramos');
    expect(result).toBe(1);
  });
});

describe('areUnitsCompatible', () => {
  it('should return true for same unit', () => {
    expect(areUnitsCompatible('kg', 'kg')).toBe(true);
  });

  it('should return true for units in the same group', () => {
    expect(areUnitsCompatible('kg', 'gramos')).toBe(true);
    expect(areUnitsCompatible('litros', 'ml')).toBe(true);
    expect(areUnitsCompatible('unidades', 'docenas')).toBe(true);
  });

  it('should return false for units in different groups', () => {
    expect(areUnitsCompatible('kg', 'litros')).toBe(false);
    expect(areUnitsCompatible('gramos', 'unidades')).toBe(false);
  });

  it('should return false for unknown units', () => {
    expect(areUnitsCompatible('kg', 'unknown')).toBe(false);
    expect(areUnitsCompatible('unknown', 'kg')).toBe(false);
  });
});
