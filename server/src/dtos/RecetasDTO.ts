import { IngredienteDTO } from './IngredienteDTO';

export interface RecetaIngredienteDTO {
  ingrediente_id: number;
  cantidad: number;
  unidad_medida: 'kg' | 'litros' | 'unidades' | 'gramos' | 'ml';
  notas?: string;
  // Optional: include full ingredient details for response mapping
  ingrediente?: IngredienteDTO;
}

export interface RecetaProductoDTO {
  producto_id: number;
  nombre: string;
  cantidad_receta: number;
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
  productos?: RecetaProductoDTO[];
}

export interface CreateRecetaDTO {
  nombre: string;
  descripcion?: string;
  instrucciones?: string;
  tiempo_preparacion?: number;
  porciones?: number;
  ingredientes?: RecetaIngredienteDTO[]; // List of ingredients to link
}

export interface UpdateRecetaDTO {
  nombre?: string;
  descripcion?: string;
  instrucciones?: string;
  tiempo_preparacion?: number;
  porciones?: number;
  activo?: boolean;
  ingredientes?: RecetaIngredienteDTO[]; // Full list to replace existing
}
