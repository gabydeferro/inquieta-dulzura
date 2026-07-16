export interface VentaDetalleResponse {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaResponse {
  id: number;
  fecha_venta: string;
  cliente_id?: number;
  cliente_nombre?: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  metodo_pago: string;
  estado: string;
  productos: VentaDetalleResponse[];
}

export interface VentaDetalleInput {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaCreateInput {
  cliente_id?: number;
  metodo_pago: string;
  descuento: number;
  productos: VentaDetalleInput[];
}

export interface VentaHistorial {
  id: number;
  fecha_venta: string;
  cliente_id: number | null;
  cliente_nombre: string | null;
  productos: string;
  total: number;
  metodo_pago: string;
}
