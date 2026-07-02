import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockRejectedValue(new Error('API not available')),
  },
}));

// Mock AuthContext
const mockUser = { id: 1, email: 'test@example.com', nombre: 'María', rol: 'admin' as const };
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: true, loading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );
  };

  it('should show welcome message with user name', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Bienvenido/)).toBeInTheDocument();
      expect(screen.getByText(/María/)).toBeInTheDocument();
    });
  });

  it('should show dashboard subtitle', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Panel de control de Inquieta Dulzura')).toBeInTheDocument();
    });
  });

  it('should render stat cards with correct labels', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Ventas')).toBeInTheDocument();
      expect(screen.getByText('Fotos')).toBeInTheDocument();
      expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
    });
  });

  it('should show quick access section title', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Accesos Rápidos')).toBeInTheDocument();
    });
  });

  it('should render all five quick action links', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Gestionar Inventario')).toBeInTheDocument();
      expect(screen.getByText('Ver Recetas')).toBeInTheDocument();
      expect(screen.getByText('Registrar Venta')).toBeInTheDocument();
      expect(screen.getByText('Contenido Digital')).toBeInTheDocument();
      expect(screen.getByText('Categorías')).toBeInTheDocument();
    });
  });

  it('should have correct href targets for quick action links', async () => {
    renderDashboard();
    await waitFor(() => {
      const inventarioLink = screen.getByText('Gestionar Inventario').closest('a');
      expect(inventarioLink).toHaveAttribute('href', '/inventario');

      const recetasLink = screen.getByText('Ver Recetas').closest('a');
      expect(recetasLink).toHaveAttribute('href', '/recetas');

      const ventasLink = screen.getByText('Registrar Venta').closest('a');
      expect(ventasLink).toHaveAttribute('href', '/ventas');

      const contenidoLink = screen.getByText('Contenido Digital').closest('a');
      expect(contenidoLink).toHaveAttribute('href', '/contenido-digital');

      const categoriasLink = screen.getByText('Categorías').closest('a');
      expect(categoriasLink).toHaveAttribute('href', '/categorias');
    });
  });

  it('should show stat values as numbers', async () => {
    renderDashboard();
    await waitFor(() => {
      // With mock rejection, all 4 stat cards show 0
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(4);
    });
  });
});
