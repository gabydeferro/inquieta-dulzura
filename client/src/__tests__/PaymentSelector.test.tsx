import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentSelector from '../components/PaymentSelector';

describe('PaymentSelector Component', () => {
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all 7 payment methods', () => {
    render(
      <PaymentSelector
        total={10000}
        isSubmitting={false}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByLabelText(/efectivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tarjeta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transferencia/i).closest('label')).toBeInTheDocument();
    expect(screen.getByText('Mercado Pago')).toBeInTheDocument();
    expect(screen.getByText('Cuenta DNI')).toBeInTheDocument();
    expect(screen.getByText('MODO')).toBeInTheDocument();
    expect(screen.getByLabelText(/otro/i).closest('label')).toBeInTheDocument();
  });

  it('defaults to efectivo', () => {
    render(
      <PaymentSelector
        total={10000}
        isSubmitting={false}
        onConfirm={onConfirm}
      />,
    );

    const efectivoRadio = screen.getByLabelText(/efectivo/i);
    expect(efectivoRadio.closest('[data-slot="radio-group-item"]')).toHaveAttribute(
      'data-state',
      'checked',
    );
  });

  it('displays the total amount', () => {
    render(
      <PaymentSelector
        total={14000}
        isSubmitting={false}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('$14000.00')).toBeInTheDocument();
  });

  it('calls onConfirm with selected payment method', async () => {
    const user = userEvent.setup();
    render(
      <PaymentSelector
        total={14000}
        isSubmitting={false}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByLabelText(/tarjeta/i));
    await user.click(screen.getByRole('button', { name: /confirmar venta/i }));

    expect(onConfirm).toHaveBeenCalledWith('tarjeta');
  });

  it('disables confirm button when submitting', () => {
    render(
      <PaymentSelector
        total={14000}
        isSubmitting={true}
        onConfirm={onConfirm}
      />,
    );

    const btn = screen.getByRole('button', { name: /registrando/i });
    expect(btn).toBeDisabled();
  });

  it('shows empty cart message when total is 0', () => {
    render(
      <PaymentSelector
        total={0}
        isSubmitting={false}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/agrega productos/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirmar venta/i })).not.toBeInTheDocument();
  });
});
