export interface CategoriaDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CreateCategoriaDTO {
  nombre: string;
  descripcion?: string;
}

export interface UpdateCategoriaDTO {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
