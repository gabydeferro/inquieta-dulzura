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

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ContenidoDigital />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getContenidoDigital as Mock).mockResolvedValue({ data: mockImagenes });
    (api.deleteContenidoDigital as Mock).mockResolvedValue({});
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

  it('filters images by tag when typing in filter input', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText('Filtrar por etiqueta...');
    await user.type(filterInput, 'promo');

    await waitFor(() => {
      expect(screen.queryByText('Torta de Chocolate')).not.toBeInTheDocument();
      expect(screen.getByText('Video Demo')).toBeInTheDocument();
    });
  });

  it('shows no results message when filter matches nothing', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText('Filtrar por etiqueta...');
    await user.type(filterInput, 'xyz');

    await waitFor(() => {
      expect(screen.getByText('No hay imágenes disponibles')).toBeInTheDocument();
    });
  });

  it('deletes an image from gallery', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

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

  it('shows loading state on mount', () => {
    (api.getContenidoDigital as Mock).mockImplementationOnce(
      () => new Promise(() => {}), // never resolves
    );

    renderComponent();
    expect(screen.getByText('Cargando contenido digital...')).toBeInTheDocument();
  });

  it('renders header with title and description', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Contenido Digital')).toBeInTheDocument();
      expect(
        screen.getByText('Gestión de fotos y videos de productos'),
      ).toBeInTheDocument();
    });
  });
});
