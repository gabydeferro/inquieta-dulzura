import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Categorias from '../Categorias';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ConfirmProvider } from '../contexts/ConfirmContext';
import api from '../services/api';

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock Notification and Confirm contexts
const mockShowNotification = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockConfirm = vi.fn();
vi.mock('../contexts/ConfirmContext', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Categorias Component', () => {
  const renderCategorias = () => {
    return render(
      <BrowserRouter>
        <NotificationProvider>
          <ConfirmProvider>
            <Categorias />
          </ConfirmProvider>
        </NotificationProvider>
      </BrowserRouter>,
    );
  };

  const mockCategorias = [
    { id: 1, nombre: 'Tortas', descripcion: 'Tortas artesanales', created_at: '2024-01-01' },
    { id: 2, nombre: 'Bebidas', descripcion: 'Bebidas refrescantes', created_at: '2024-01-02' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: mockCategorias } as never);
  });

  afterEach(() => {
    cleanup();
  });

  it('should render categorias and show heading', async () => {
    renderCategorias();

    await waitFor(() => {
      expect(screen.getByText(/Gestión de Categorías/i)).toBeInTheDocument();
      expect(screen.getByText('Tortas')).toBeInTheDocument();
      expect(screen.getByText('Bebidas')).toBeInTheDocument();
    });
  });

  it('should show validation error when nombre is empty on create', async () => {
    const user = userEvent.setup();
    renderCategorias();

    await waitFor(() => {
      expect(screen.getByText('Tortas')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Categoría/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Categoría/i })).toBeInTheDocument();
    });

    // Click submit with empty nombre
    await user.click(screen.getByRole('button', { name: /Crear/i }));

    await waitFor(() => {
      expect(screen.getByText('Nombre is required')).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('should show validation error when nombre is empty on edit', async () => {
    const user = userEvent.setup();
    renderCategorias();

    await waitFor(() => {
      expect(screen.getByText('Tortas')).toBeInTheDocument();
    });

    // Click edit button on first categoria
    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Editar Categoría/i })).toBeInTheDocument();
    });

    const nombreInput = screen.getByDisplayValue('Tortas');
    await user.clear(nombreInput);

    await user.click(screen.getByRole('button', { name: /Actualizar/i }));

    await waitFor(() => {
      expect(screen.getByText('Nombre is required')).toBeInTheDocument();
    });
    expect(api.put).not.toHaveBeenCalled();
  });

  it('should create a new categoria successfully', async () => {
    const user = userEvent.setup();
    renderCategorias();

    await waitFor(() => {
      expect(screen.getByText('Tortas')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva Categoría/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Nueva Categoría/i })).toBeInTheDocument();
    });

    const nombreInput = screen.getByPlaceholderText(/Ej:/);
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Panadería');

    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 3, nombre: 'Panadería' } } as never);
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [
        ...mockCategorias,
        { id: 3, nombre: 'Panadería', descripcion: '', created_at: '2024-06-29' },
      ],
    } as never);

    await user.click(screen.getByRole('button', { name: /Crear/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/categorias', {
        nombre: 'Panadería',
        descripcion: '',
      });
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Categoría creada con éxito! ✨',
        'success',
      );
    });
  });
});
