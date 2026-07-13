export class InsufficientStockError extends Error {
  public readonly productoId: number;

  constructor(productoId: number) {
    super(`Stock insuficiente para el producto ${productoId}`);
    this.name = 'InsufficientStockError';
    this.productoId = productoId;
  }
}
