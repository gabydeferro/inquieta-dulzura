import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ContenidoDigital from '../ContenidoDigital';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    getContenidoDigital: vi.fn(),
    createContenidoDigital: vi.fn(),
    deleteContenidoDigital: vi.fn(),
  },
}));

globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');

describe('ContenidoDigital Component', () => {
  const mockImagenes = [
    {
      id: 1,
      productoId: 1,
      url: 'http://example.com/img.jpg',
      titulo: 'Torta de Chocolate',
      descripcion: 'Deliciosa torta',
      etiquetas: ['chocolate', 'torta'],
      fechaSubida: new Date('2024-01-01'),
      tipo: 'imagen' as const,
    },
    {
      id: 2,
      productoId: 2,
      url: 'http://example.com/video.mp4',
      titulo: 'Video Demo',
      descripcion: 'Video promocional',
      etiquetas: ['promo'],
      fechaSubida: new Date('2024-01-02'),
      tipo: 'video' as const,
    },
  ];

  const mockProductos = [
    { id: 1, nombre: 'Torta de Chocolate' },
    { id: 2, nombre: 'Bebida de Vainilla' },
  ];

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ContenidoDigital />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as Mock).mockResolvedValue({ data: mockProductos });
    (api.getContenidoDigital as Mock).mockResolvedValue({ data: mockImagenes });
    (api.createContenidoDigital as Mock).mockResolvedValue({ data: undefined });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders gallery with images', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
      expect(screen.getByText('Video Demo')).toBeInTheDocument();
      expect(screen.getByText('chocolate')).toBeInTheDocument();
      expect(screen.getByText('promo')).toBeInTheDocument();
    });
  });

  it('opens upload modal and loads productos dropdown', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Subir contenido/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Subir Contenido/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Torta de Chocolate' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Bebida de Vainilla' })).toBeInTheDocument();
    });
    expect(api.get).toHaveBeenCalledWith('/productos');
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Subir contenido/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Subir Contenido/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^Subir$/ }));

    await waitFor(() => {
      expect(screen.getByText('Debes seleccionar un archivo')).toBeInTheDocument();
      expect(screen.getByText('Selecciona un producto')).toBeInTheDocument();
      expect(screen.getByText('El título es requerido')).toBeInTheDocument();
    });
    expect(api.createContenidoDigital).not.toHaveBeenCalled();
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Subir contenido/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Subir Contenido/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Cancelar/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /Subir Contenido/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('submits form with valid data and file', async () => {
    const user = userEvent.setup();
    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Subir contenido/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Subir Contenido/i })).toBeInTheDocument();
    });

    // Select file via hidden input
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });

    // Select producto (labels lack htmlFor/id in this codebase, use index)
    const comboboxes = screen.getAllByRole('combobox');
    await user.selectOptions(comboboxes[0], '1');

    // Type title
    const tituloInput = screen.getByPlaceholderText('Título del contenido');
    await user.type(tituloInput, 'Mi Contenido');

    // Submit
    await user.click(screen.getByRole('button', { name: /^Subir$/ }));

    await waitFor(() => {
      expect(api.createContenidoDigital).toHaveBeenCalled();
      const formDataArg = (api.createContenidoDigital as Mock).mock.calls[0][0];
      expect(formDataArg).toBeInstanceOf(FormData);
    });

    // Modal should close on success
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /Subir Contenido/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('deletes an image from gallery', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    // Mock window.confirm to return true (jsdom doesn't implement confirm)
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    expect(deleteButtons).toHaveLength(2);

    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteContenidoDigital).toHaveBeenCalledWith(1);
    });

    window.confirm = originalConfirm;
  });
});
