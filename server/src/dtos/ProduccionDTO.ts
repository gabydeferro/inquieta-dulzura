export interface CreateProduccionDTO {
  receta_id: number;
  cantidad_producir: number;
}

export interface ProduccionResponse {
  id: number;
  receta_id: number;
  producto_id: number;
  cantidad_producida: number;
  tandas_ejecutadas: number;
  ingredientes_consumidos?: object;
  created_by?: number;
  created_at: Date;
  /** Joined: recipe name for display */
  nombre_receta?: string;
  /** Joined: product name for display */
  nombre_producto?: string;
}
