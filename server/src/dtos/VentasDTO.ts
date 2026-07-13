import { PagoResponse } from './PagosDTO';

export interface CreateVentaDTO {
  cliente_id?: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago' | 'cuenta_dni' | 'modo' | 'otro';
  descuento?: number;
  productos: VentaDetalleDTO[];
}

export interface VentaDetalleDTO {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaResponse {
  id: number;
  cliente_id?: number;
  cliente_nombre?: string;
  fecha_venta: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  metodo_pago: string;
  estado: string;
  notas?: string;
  productos: VentaDetalleResponse[];
  pagos?: PagoResponse[];
}

export interface VentaDetalleResponse {
  id: number;
  venta_id: number;
  producto_id: number;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  total: number;
}
