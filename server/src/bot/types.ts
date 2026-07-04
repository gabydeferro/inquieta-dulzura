export type ParseResult<T> =
  | { success: true; data: T; error?: undefined }
  | { success: false; error: string; data?: undefined };

export interface StockRow {
  producto_id: number;
  cantidad: number;
  producto_nombre: string;
  categoria_nombre: string;
}
