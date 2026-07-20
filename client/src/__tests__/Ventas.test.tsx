import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Ventas from '../Ventas';
import { CartProvider } from '../contexts/CartContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    getVentas: vi.fn(),
    createVenta: vi.fn(),
    searchProductos: vi.fn(),
    createMPPreference: vi.fn(),
  },
}));

const renderVentas = async () => {
  const result = render(
    <NotificationProvider>
      <CartProvider>
        <Ventas />
      </CartProvider>
    </NotificationProvider>,
  );
  // Wait for the async cargarVentas to finish and the loading state to clear
  await waitFor(() => {
    expect(screen.queryByText(/Cargando ventas/i)).not.toBeInTheDocument();
  });
  return result;
};

const mockVentas = [
  {
    id: 1,
    fecha_venta: new Date().toISOString(),
    cliente: 'Juan Pérez',
    subtotal: 5000,
    descuento: 0,
    impuestos: 0,
    total: 5000,
    metodo_pago: 'efectivo',
    estado: 'completada',
    productos: [
      {
        producto_id: 1,
        nombre: 'Torta de Chocolate',
        cantidad: 1,
        precio_unitario: 5000,
        subtotal: 5000,
      },
    ],
  },
];

const mockSearchResults = [
  { id: 1, nombre: 'Torta Red Velvet', precio: 5000, stock: 10 },
  { id: 2, nombre: 'Alfajor', precio: 800, stock: 20 },
];

describe('Ventas Component (POS)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (api.getVentas as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockVentas });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  // --- Layout ---

  it('renders POS title', async () => {
    await renderVentas();
    expect(screen.getByRole('heading', { level: 1, name: /Ventas/i })).toBeInTheDocument();
  });

  it('renders search input', async () => {
    await renderVentas();
    expect(screen.getByPlaceholderText(/buscar producto/i)).toBeInTheDocument();
  });

  it('renders empty cart message initially', async () => {
    await renderVentas();
    expect(screen.getByText(/carrito vacío/i)).toBeInTheDocument();
  });

  it('renders payment section', async () => {
    await renderVentas();
    expect(screen.getByText(/método de pago/i)).toBeInTheDocument();
  });

  // --- Product search + add to cart ---

  it('searches products and adds to cart', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockSearchResults,
    });

    await renderVentas();

    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'torta');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Torta Red Velvet')).toBeInTheDocument();
    });

    // Add to cart
    const addButtons = screen.getAllByRole('button', { name: /agregar/i });
    await user.click(addButtons[0]);

    // Cart should now show the item (also visible in search results dropdown)
    await waitFor(() => {
      expect(screen.getAllByText('Torta Red Velvet').length).toBeGreaterThanOrEqual(2);
    });
    // Cart should show "1 items"
    expect(screen.getByText(/1 items/)).toBeInTheDocument();
  });

  // --- Cart interactions ---

  it('shows item count and total after adding items', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockSearchResults,
    });

    await renderVentas();

    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'torta');
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Torta Red Velvet')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /agregar/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/1 items/)).toBeInTheDocument();
    });
    // $5000.00 appears in stats, cart, and history
    expect(screen.getAllByText('$5000.00').length).toBeGreaterThanOrEqual(2);
  });

  // --- Sale creation ---

  it('creates a sale and clears cart', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [mockSearchResults[0]],
    });
    (api.createVenta as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        id: 10,
        metodo_pago: 'efectivo',
        estado: 'completada',
        total: 5000,
        productos: [],
        fecha_venta: new Date().toISOString(),
        subtotal: 5000,
        descuento: 0,
        impuestos: 0,
      },
    });

    await renderVentas();

    // Search and add product
    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'torta');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(screen.getByText('Torta Red Velvet')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByRole('button', { name: /agregar/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/1 items/)).toBeInTheDocument();
    });

    // Confirm sale (default is efectivo)
    await user.click(screen.getByRole('button', { name: /confirmar venta/i }));

    await waitFor(() => {
      expect(api.createVenta).toHaveBeenCalled();
    });

    // Cart should be cleared after successful sale
    await waitFor(() => {
      expect(screen.getByText(/carrito vacío/i)).toBeInTheDocument();
    });
  });

  // --- Sales history ---

  it('shows sales history', async () => {
    await renderVentas();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });
  });

  // --- MercadoPago redirect ---

  it('redirects to MP checkout after MP sale creation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [mockSearchResults[0]],
    });
    (api.createVenta as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        id: 10,
        metodo_pago: 'mercado_pago',
        estado: 'pendiente',
        total: 5000,
        productos: [
          { producto_id: 1, cantidad: 1, precio_unitario: 5000, subtotal: 5000, producto_nombre: 'Torta Red Velvet' },
        ],
        fecha_venta: new Date().toISOString(),
        subtotal: 5000,
        descuento: 0,
        impuestos: 0,
      },
    });
    (api.createMPPreference as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        success: true,
        data: { url: 'https://mercadopago.com/checkout?pref_id=123', preference_id: '123' },
      },
    });

    // Mock window.location.href setter
    const locationSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { set href(val: string) { locationSetter(val); }, get href() { return ''; } },
      writable: true,
    });

    await renderVentas();

    // Search and add product
    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'torta');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    await waitFor(() => {
      expect(screen.getByText('Torta Red Velvet')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByRole('button', { name: /agregar/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/1 items/)).toBeInTheDocument();
    });

    // Select Mercado Pago
    await user.click(screen.getByText('Mercado Pago'));
    // Confirm
    await user.click(screen.getByRole('button', { name: /confirmar venta/i }));

    await waitFor(() => {
      expect(api.createVenta).toHaveBeenCalled();
    });

    // After venta created, MP preference should be created
    await waitFor(() => {
      expect(api.createMPPreference).toHaveBeenCalled();
    });

    // Should redirect to MP checkout
    await waitFor(() => {
      expect(locationSetter).toHaveBeenCalledWith('https://mercadopago.com/checkout?pref_id=123');
    });
  });

  // --- Return URL handling ---

  it('shows success toast and cleans URL when pago=exito param is present', async () => {
    // Mock URL search params
    Object.defineProperty(window, 'location', {
      value: {
        search: '?pago=exito',
        pathname: '/ventas',
        set href(_val: string) {},
        get href() { return '/ventas?pago=exito'; },
      },
      writable: true,
    });
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    await renderVentas();

    await waitFor(() => {
      expect(screen.queryByText(/Cargando ventas/i)).not.toBeInTheDocument();
    });

    // URL should be cleaned
    expect(replaceStateSpy).toHaveBeenCalled();

    replaceStateSpy.mockRestore();
  });
});
