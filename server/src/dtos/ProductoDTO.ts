export interface ProductoRecetaDTO {
  receta_id: number;
  nombre: string;
  cantidad_receta: number;
}

export interface ProductoDTO {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  sku?: string;
  activo: boolean;
  recetas?: ProductoRecetaDTO[];
}

export interface CreateProductoDTO {
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  sku?: string;
}

export interface UpdateProductoDTO {
  categoria_id?: number;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  costo?: number;
  sku?: string;
  activo?: boolean;
}
