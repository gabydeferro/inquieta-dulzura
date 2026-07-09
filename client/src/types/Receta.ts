import { Ingrediente } from './Ingrediente';

export type UnidadMedida = 'kg' | 'litros' | 'unidades' | 'gramos' | 'ml';

export interface RecetaIngredienteDTO {
  ingrediente_id: number;
  cantidad: number;
  unidad_medida: UnidadMedida;
  notas?: string;
  ingrediente?: Ingrediente;
}

export interface RecetaDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  instrucciones?: string;
  tiempo_preparacion?: number;
  porciones?: number;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
  ingredientes?: RecetaIngredienteDTO[];
}

export interface CreateRecetaDTO {
  nombre: string;
  descripcion?: string;
  instrucciones?: string;
  tiempo_preparacion?: number;
  porciones?: number;
  ingredientes?: Omit<RecetaIngredienteDTO, 'ingrediente' | 'notas'>[];
}

export interface UpdateRecetaDTO {
  nombre?: string;
  descripcion?: string;
  instrucciones?: string;
  tiempo_preparacion?: number;
  porciones?: number;
  activo?: boolean;
  ingredientes?: Omit<RecetaIngredienteDTO, 'ingrediente' | 'notas'>[];
}
