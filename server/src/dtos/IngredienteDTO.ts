export type UnidadMedidaIngrediente = 'kg' | 'litros' | 'unidades' | 'gramos' | 'ml';

export interface IngredienteDTO {
    id?: number;
    nombre: string;
    descripcion?: string;
    unidad_medida: UnidadMedidaIngrediente;
    costo_unitario?: number;
    activo?: boolean;
}