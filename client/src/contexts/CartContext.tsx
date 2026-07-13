import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, CartState, CartAction } from '../types/Cart';

const CART_KEY = 'inquieta-dulzura-cart';

const initialState: CartState = {
  items: [],
};

function loadCartFromStorage(): CartState {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.items)) {
        return { items: parsed.items };
      }
    }
  } catch {
    // corrupted storage — fall back to empty
  }
  return initialState;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.producto_id === action.payload.producto_id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.producto_id === action.payload.producto_id
              ? { ...i, cantidad: i.cantidad + (action.payload.cantidad ?? 1) }
              : i,
          ),
        };
      }
      return {
        items: [...state.items, { ...action.payload, cantidad: action.payload.cantidad ?? 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        items: state.items.filter((i) => i.producto_id !== action.payload.producto_id),
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.cantidad <= 0) {
        return {
          items: state.items.filter((i) => i.producto_id !== action.payload.producto_id),
        };
      }
      return {
        items: state.items.map((i) =>
          i.producto_id === action.payload.producto_id
            ? { ...i, cantidad: action.payload.cantidad }
            : i,
        ),
      };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  dispatch: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, loadCartFromStorage);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state));
  }, [state]);

  const total = state.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const itemCount = state.items.reduce((sum, item) => sum + item.cantidad, 0);

  const value: CartContextType = {
    items: state.items,
    total,
    itemCount,
    dispatch,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
