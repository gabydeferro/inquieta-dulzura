import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstagramCaptionEditor } from '../components/InstagramCaptionEditor';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  productName: 'Torta de Chocolate',
  productDescription: 'Deliciosa torta artesanal',
  productPrice: 250.0,
  onPublish: vi.fn(),
};

describe('InstagramCaptionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props = {}) => {
    return render(<InstagramCaptionEditor {...defaultProps} {...props} />);
  };

  it('should render the dialog with product name in title', () => {
    renderComponent();
    expect(screen.getByText('Publicar en Instagram — Torta de Chocolate')).toBeInTheDocument();
  });

  it('should pre-fill the caption textarea with product info', () => {
    renderComponent();
    const textarea = screen.getByPlaceholderText(/Escribí el pie de foto/) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toContain('Torta de Chocolate');
    expect(textarea.value).toContain('Deliciosa torta artesanal');
    expect(textarea.value).toContain('$250.00');
  });

  it('should show character count', () => {
    renderComponent();
    expect(screen.getByText(/2200/)).toBeInTheDocument();
  });

  it('should show Publish and Cancel buttons', () => {
    renderComponent();
    expect(screen.getByText('Publicar en Instagram')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('should call onPublish with caption when publish is clicked', async () => {
    const onPublish = vi.fn();
    const user = userEvent.setup();
    renderComponent({ onPublish });

    await user.click(screen.getByText('Publicar en Instagram'));

    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(onPublish).toHaveBeenCalledWith(
      expect.stringContaining('Torta de Chocolate'),
      undefined,
    );
  });

  it('should disable publish button when caption exceeds 2200 characters', () => {
    renderComponent();

    const textarea = screen.getByPlaceholderText(/Escribí el pie de foto/) as HTMLTextAreaElement;
    const longCaption = 'a'.repeat(2201);

    fireEvent.change(textarea, { target: { value: longCaption } });

    const publishBtn = screen.getByText('Publicar en Instagram');
    expect(publishBtn).toBeDisabled();
  });

  it('should call onOpenChange(false) when Cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderComponent({ onOpenChange });

    await user.click(screen.getByText('Cancelar'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when open is false', () => {
    renderComponent({ open: false });
    expect(screen.queryByText('Publicar en Instagram')).not.toBeInTheDocument();
  });
});
