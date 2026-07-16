export interface ClienteDTO {
  id?: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClienteDTO {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
}

export interface UpdateClienteDTO {
  nombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
