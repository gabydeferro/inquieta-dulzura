import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartSummary from '../components/CartSummary';
import { CartItem } from '../types/Cart';

const mockItems: CartItem[] = [
  { producto_id: 1, nombre: 'Torta Red Velvet', precio: 5000, cantidad: 2, stock_disponible: 10 },
  { producto_id: 2, nombre: 'Alfajor', precio: 800, cantidad: 5, stock_disponible: 20 },
];

const mockEmptyItems: CartItem[] = [];

describe('CartSummary Component', () => {
  const onUpdateQuantity = vi.fn();
  const onRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows empty cart message when no items', () => {
    render(
      <CartSummary
        items={mockEmptyItems}
        total={0}
        itemCount={0}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText(/carrito vacío/i)).toBeInTheDocument();
  });

  it('renders product names', () => {
    render(
      <CartSummary
        items={mockItems}
        total={14000}
        itemCount={7}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText('Torta Red Velvet')).toBeInTheDocument();
    expect(screen.getByText('Alfajor')).toBeInTheDocument();
  });

  it('renders correct item count', () => {
    render(
      <CartSummary
        items={mockItems}
        total={14000}
        itemCount={7}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText(/7 items/)).toBeInTheDocument();
  });

  it('renders correct total', () => {
    render(
      <CartSummary
        items={mockItems}
        total={14000}
        itemCount={7}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText('$14000.00')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CartSummary
        items={mockItems}
        total={14000}
        itemCount={7}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />,
    );

    const removeButtons = screen.getAllByRole('button', { name: /eliminar/i });
    await user.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('calls onUpdateQuantity when quantity +/- is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CartSummary
        items={mockItems}
        total={14000}
        itemCount={7}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />,
    );

    // Find the "+" button for the first item
    const increaseButtons = screen.getAllByRole('button', { name: /aumentar/i });
    await user.click(increaseButtons[0]);

    expect(onUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('calls onUpdateQuantity with decreased amount', async () => {
    const user = userEvent.setup();
    render(
      <CartSummary
        items={mockItems}
        total={14000}
        itemCount={7}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemove}
      />,
    );

    const decreaseButtons = screen.getAllByRole('button', { name: /disminuir/i });
    await user.click(decreaseButtons[0]);

    expect(onUpdateQuantity).toHaveBeenCalledWith(1, 1);
  });
});
