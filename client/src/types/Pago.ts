export interface PagoResponse {
  id: number;
  venta_id: number;
  metodo_pago: string;
  monto: number;
  referencia_externa?: string;
  estado: string;
  datos_json?: Record<string, unknown>;
  created_at: string;
}

export interface CreatePagoDTO {
  metodo_pago: string;
  monto: number;
  referencia_externa?: string;
  datos_json?: Record<string, unknown>;
}
