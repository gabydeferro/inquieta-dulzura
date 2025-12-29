export interface ProductoDTO {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  sku?: string;
  activo: boolean;
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
