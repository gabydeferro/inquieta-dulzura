export interface CreatePagoDTO {
  venta_id: number;
  metodo_pago:
    'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago' | 'cuenta_dni' | 'modo' | 'otro';
  monto: number;
  referencia_externa?: string | null;
  datos_json?: string | null;
}

export interface PagoResponse {
  id: number;
  venta_id: number;
  metodo_pago: string;
  monto: number;
  referencia_externa?: string | null;
  estado: string;
  datos_json?: string | null;
  created_at: string;
}
