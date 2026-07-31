export class InsufficientIngredientStockError extends Error {
  public readonly ingrediente_id: number;
  public readonly nombre: string;
  public readonly disponible: number;
  public readonly requerido: number;

  constructor(ingrediente_id: number, nombre: string, disponible: number, requerido: number) {
    super(`Stock insuficiente para "${nombre}": disponible ${disponible}, requerido ${requerido}`);
    this.name = 'InsufficientIngredientStockError';
    this.ingrediente_id = ingrediente_id;
    this.nombre = nombre;
    this.disponible = disponible;
    this.requerido = requerido;
  }
}
