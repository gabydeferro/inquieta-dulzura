export interface CartItem {
  producto_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  stock_disponible: number;
  imagen?: string;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'cantidad'> & { cantidad?: number } }
  | { type: 'REMOVE_ITEM'; payload: { producto_id: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { producto_id: number; cantidad: number } }
  | { type: 'CLEAR_CART' };

export type MetodoPago =
  | 'efectivo'
  | 'tarjeta'
  | 'transferencia'
  | 'mercado_pago'
  | 'cuenta_dni'
  | 'modo'
  | 'otro';

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'cuenta_dni', label: 'Cuenta DNI' },
  { value: 'modo', label: 'MODO' },
  { value: 'otro', label: 'Otro' },
];
