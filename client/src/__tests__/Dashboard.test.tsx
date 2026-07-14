import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

const mockDashboardStats = {
  ventasHoy: { cantidad: 5, total: 1500 },
  ventasSemana: { cantidad: 20, total: 6000 },
  ventasMes: { cantidad: 100, total: 30000 },
  ingresosMes: 30000,
  totalIngresos: 50000,
  totalVentas: 200,
  totalClientes: 50,
  productosActivos: 30,
  categoriasCount: 8,
  ingredientesCount: 25,
  recetasCount: 15,
  ventasPorDia: [
    { fecha: '2026-07-01', cantidad: 3, total: 900 },
    { fecha: '2026-07-02', cantidad: 2, total: 600 },
  ],
  metodosPago: [
    { metodo: 'efectivo', cantidad: 60, total: 18000 },
    { metodo: 'tarjeta', cantidad: 40, total: 12000 },
  ],
    topProductos: [
    { producto_id: 1, nombre: 'Torta Chocolate', cantidad: 45, total: 12500 },
    { producto_id: 2, nombre: 'Galletas', cantidad: 25, total: 4500 },
  ],
  stockBajo: [
    {
      producto_id: 3,
      nombre: 'Harina',
      cantidad_disponible: 3,
      unidad_medida: 'kg',
    },
  ],
  stockBajoCount: 1,
  partial_failures: [],
};

const mockGetDashboardStats = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    getDashboardStats: (...args: unknown[]) => mockGetDashboardStats(...args),
  },
}));

const mockUser = { id: 1, email: 'test@example.com', nombre: 'María', rol: 'admin' as const };
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: true, loading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDashboardStats.mockResolvedValue({ data: mockDashboardStats });
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

  it('should render KPI cards with real data from API', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Ventas Hoy')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/\$1[,.]?500/)).toBeInTheDocument();

      expect(screen.getByText('Ventas Semana')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();

      expect(screen.getByText('Ventas Mes')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();

      expect(screen.getByText('Ingresos Totales')).toBeInTheDocument();
      expect(screen.getByText(/\$50[,.]?000/)).toBeInTheDocument();

      expect(screen.getByText('Total Ventas')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();

      expect(screen.getByText('Clientes')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();

      expect(screen.getByText('Productos Activos')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();

      expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should render sales trend chart', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Tendencia de Ventas (30 días)')).toBeInTheDocument();
      // Recharts renders SVG elements
      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  it('should render payment methods chart', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Métodos de Pago')).toBeInTheDocument();
    });
  });

  it('should render top products table', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Top 5 Productos (30 días)')).toBeInTheDocument();
      expect(screen.getByText('Torta Chocolate')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Galletas')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('should render stock alerts list', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Alertas de Stock Bajo')).toBeInTheDocument();
      expect(screen.getByText('Harina')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('kg')).toBeInTheDocument();
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

  it('should show error message when API fails', async () => {
    mockGetDashboardStats.mockRejectedValue(new Error('API error'));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Error al cargar datos del dashboard')).toBeInTheDocument();
    });
  });

  it('should call getDashboardStats on mount', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(mockGetDashboardStats).toHaveBeenCalledOnce();
    });
  });
});