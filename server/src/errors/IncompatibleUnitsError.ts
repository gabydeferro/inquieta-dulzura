export class IncompatibleUnitsError extends Error {
  public readonly from: string;
  public readonly to: string;

  constructor(from: string, to: string) {
    super(`Unidades incompatibles: ${from} → ${to}`);
    this.name = 'IncompatibleUnitsError';
    this.from = from;
    this.to = to;
  }
}
