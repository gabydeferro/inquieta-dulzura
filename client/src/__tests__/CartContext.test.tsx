import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { CartProvider, useCart } from '../contexts/CartContext';
import { CartItem } from '../types/Cart';

const mockProduct: Omit<CartItem, 'cantidad'> = {
  producto_id: 1,
  nombre: 'Torta Red Velvet',
  precio: 5000,
  stock_disponible: 10,
};

const mockProduct2: Omit<CartItem, 'cantidad'> = {
  producto_id: 2,
  nombre: 'Alfajor',
  precio: 800,
  stock_disponible: 20,
};

const CART_KEY = 'inquieta-dulzura-cart';

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // --- Initial state ---

  it('starts with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.itemCount).toBe(0);
  });

  // --- ADD_ITEM ---

  it('adds an item with default quantity 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].producto_id).toBe(1);
    expect(result.current.items[0].cantidad).toBe(1);
    expect(result.current.items[0].nombre).toBe('Torta Red Velvet');
  });

  it('adds an item with explicit quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { ...mockProduct, cantidad: 3 },
      });
    });

    expect(result.current.items[0].cantidad).toBe(3);
  });

  it('increments quantity when adding an existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });
    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].cantidad).toBe(2);
  });

  it('adds different items separately', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });
    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct2 });
    });

    expect(result.current.items).toHaveLength(2);
  });

  // --- REMOVE_ITEM ---

  it('removes an item from the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });
    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct2 });
    });
    act(() => {
      result.current.dispatch({
        type: 'REMOVE_ITEM',
        payload: { producto_id: 1 },
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].producto_id).toBe(2);
  });

  // --- UPDATE_QUANTITY ---

  it('updates quantity of an item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });
    act(() => {
      result.current.dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { producto_id: 1, cantidad: 5 },
      });
    });

    expect(result.current.items[0].cantidad).toBe(5);
  });

  it('removes item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });
    act(() => {
      result.current.dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { producto_id: 1, cantidad: 0 },
      });
    });

    expect(result.current.items).toHaveLength(0);
  });

  // --- CLEAR_CART ---

  it('clears the entire cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });
    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct2 });
    });
    act(() => {
      result.current.dispatch({ type: 'CLEAR_CART' });
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  // --- Totals computation ---

  it('computes correct total from multiple items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { ...mockProduct, precio: 5000 },
      });
    });
    act(() => {
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { ...mockProduct2, precio: 800 },
      });
    });
    // Torta: 1 × 5000 = 5000, Alfajor: 1 × 800 = 800
    expect(result.current.total).toBe(5800);
    expect(result.current.itemCount).toBe(2);
  });

  it('computes total with quantities > 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { ...mockProduct, precio: 5000, cantidad: 2 },
      });
    });

    // 2 × 5000 = 10000
    expect(result.current.total).toBe(10000);
    expect(result.current.itemCount).toBe(2);
  });

  // --- localStorage persistence ---

  it('persists cart to localStorage on changes', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });

    const stored = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0].producto_id).toBe(1);
  });

  it('restores cart from localStorage on mount', () => {
    // Pre-populate localStorage
    const initialCart = {
      items: [
        { ...mockProduct, cantidad: 3 },
        { ...mockProduct2, cantidad: 2 },
      ],
    };
    localStorage.setItem(CART_KEY, JSON.stringify(initialCart));

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].cantidad).toBe(3);
    expect(result.current.items[1].cantidad).toBe(2);
    expect(result.current.total).toBe(5000 * 3 + 800 * 2);
  });

  it('clears localStorage when cart is cleared', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({ type: 'ADD_ITEM', payload: mockProduct });
    });
    expect(localStorage.getItem(CART_KEY)).not.toBeNull();

    act(() => {
      result.current.dispatch({ type: 'CLEAR_CART' });
    });

    // After clear, localStorage should have empty items
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    expect(stored.items).toHaveLength(0);
  });
});
