import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductSearch from '../components/ProductSearch';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    searchProductos: vi.fn(),
  },
}));

describe('ProductSearch Component', () => {
  const onAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  const mockProducts = [
    { id: 1, nombre: 'Torta Red Velvet', precio: 5000, stock: 10 },
    { id: 2, nombre: 'Torta de Chocolate', precio: 6000, stock: 5 },
  ];

  const renderSearch = () => render(<ProductSearch onAddToCart={onAddToCart} />);

  it('renders search input', () => {
    renderSearch();
    expect(screen.getByPlaceholderText(/buscar producto/i)).toBeInTheDocument();
  });

  it('shows results after typing and debounce', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockProducts,
    });

    renderSearch();

    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'torta');

    // Advance past debounce (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Torta Red Velvet')).toBeInTheDocument();
    });
    expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    expect(api.searchProductos).toHaveBeenCalledWith('torta');
  });

  it('shows price in search results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockProducts,
    });

    renderSearch();

    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'torta');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText(/\$5000/)).toBeInTheDocument();
    });
  });

  it('calls onAddToCart when add button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockProducts,
    });

    renderSearch();

    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'torta');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Torta Red Velvet')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /agregar/i });
    await user.click(addButtons[0]);

    expect(onAddToCart).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('shows empty state when no results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [],
    });

    renderSearch();

    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'xyz');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron productos/i)).toBeInTheDocument();
    });
  });

  it('does not search with empty query', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderSearch();

    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'a');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Only called once for "a"
    expect(api.searchProductos).toHaveBeenCalledTimes(1);
  });

  it('shows stock information in results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    (api.searchProductos as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockProducts,
    });

    renderSearch();

    await user.type(screen.getByPlaceholderText(/buscar producto/i), 'torta');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText(/stock: 10/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/stock: 5/i)).toBeInTheDocument();
  });
});
