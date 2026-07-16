export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClienteForm {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
}
