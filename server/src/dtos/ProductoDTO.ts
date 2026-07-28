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
  stock?: number;
  recetas?: ProductoRecetaDTO[];
}

export interface CreateProductoDTO {
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  sku?: string;
  cantidad_disponible?: number;
  cantidad_minima?: number;
  unidad_medida?: 'unidades' | 'kg' | 'litros' | 'docenas';
}

export interface UpdateProductoDTO {
  categoria_id?: number;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  costo?: number;
  sku?: string;
  activo?: boolean;
  cantidad_disponible?: number;
  cantidad_minima?: number;
  unidad_medida?: 'unidades' | 'kg' | 'litros' | 'docenas';
}
