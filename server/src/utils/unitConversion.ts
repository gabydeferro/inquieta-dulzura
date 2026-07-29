import { IncompatibleUnitsError } from '../errors/IncompatibleUnitsError';

export type UnitGroup = 'mass' | 'volume' | 'count';

interface UnitDef {
  group: UnitGroup;
  toBase: number;
}

export const UNIT_CATALOG: Record<string, UnitDef> = {
  kg: { group: 'mass', toBase: 1 },
  gramos: { group: 'mass', toBase: 0.001 },
  litros: { group: 'volume', toBase: 1 },
  ml: { group: 'volume', toBase: 0.001 },
  unidades: { group: 'count', toBase: 1 },
  docenas: { group: 'count', toBase: 12 },
};

/**
 * Converts a value from one unit to another within the same unit group.
 * @throws {IncompatibleUnitsError} if units are from different groups or unknown
 */
export function convertUnit(value: number, from: string, to: string): number {
  if (from === to) return value;

  const fromDef = UNIT_CATALOG[from];
  const toDef = UNIT_CATALOG[to];

  if (!fromDef || !toDef || fromDef.group !== toDef.group) {
    throw new IncompatibleUnitsError(from, to);
  }

  const inBase = value * fromDef.toBase;
  return inBase / toDef.toBase;
}

/**
 * Checks whether two units belong to the same compatible group.
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  if (unitA === unitB) return true;

  const aDef = UNIT_CATALOG[unitA];
  const bDef = UNIT_CATALOG[unitB];

  if (!aDef || !bDef) return false;

  return aDef.group === bDef.group;
}
