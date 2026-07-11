export interface ProductoReceta {
  receta_id: number;
  nombre: string;
  cantidad_receta: number;
}

export interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  sku?: string;
  activo: boolean;
  created_at?: string;
  recetas?: ProductoReceta[];
}

export interface RecetaProducto {
  producto_id: number;
  nombre: string;
  cantidad_receta: number;
}
