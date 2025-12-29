export type UnidadMedidaIngrediente = 'kg' | 'litros' | 'unidades' | 'gramos' | 'ml';

export interface Ingrediente {
    id?: number;
    nombre: string;
    descripcion?: string;
    unidad_medida: UnidadMedidaIngrediente;
    costo_unitario?: number;
    activo?: boolean;
}
