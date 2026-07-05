import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Inventario from '../Inventario';
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

// Mock Notification context
const mockShowNotification = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Confirm context
const mockConfirm = vi.fn();
vi.mock('../contexts/ConfirmContext', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockCategorias = [
  { id: 1, nombre: 'Tortas', activo: true },
  { id: 2, nombre: 'Bebidas', activo: true },
];

const mockProductos = [
  {
    id: 1,
    categoria_id: 1,
    nombre: 'Torta de Chocolate',
    descripcion: 'Deliciosa torta de chocolate artesanal',
    precio: 250.00,
    costo: 120.00,
    sku: 'TCH-001',
    activo: true,
    created_at: '2024-01-15',
    stock: {
      id: 1,
      producto_id: 1,
      cantidad_disponible: 50,
      cantidad_minima: 10,
      unidad_medida: 'unidades',
    },
  },
  {
    id: 2,
    categoria_id: 2,
    nombre: 'Limonada Natural',
    descripcion: 'Refrescante limonada casera',
    precio: 35.00,
    costo: 10.00,
    sku: 'LIM-001',
    activo: true,
    created_at: '2024-01-20',
    stock: {
      id: 2,
      producto_id: 2,
      cantidad_disponible: 5,
      cantidad_minima: 10,
      unidad_medida: 'litros',
    },
  },
];

describe('Inventario Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: mockProductos });
  });

  afterEach(() => {
    cleanup();
  });

  const renderInventario = () => {
    return render(
      <BrowserRouter>
        <Inventario />
      </BrowserRouter>,
    );
  };

  it('should show loading state initially', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderInventario();
    expect(screen.getByText('Cargando inventario...')).toBeInTheDocument();
  });

  it('should render product names after loading', async () => {
    renderInventario();
    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
      expect(screen.getByText('Limonada Natural')).toBeInTheDocument();
    });
  });

  it('should render product descriptions', async () => {
    renderInventario();
    await waitFor(() => {
      expect(screen.getByText('Deliciosa torta de chocolate artesanal')).toBeInTheDocument();
      expect(screen.getByText('Refrescante limonada casera')).toBeInTheDocument();
    });
  });

  it('should display prices formatted with $', async () => {
    renderInventario();
    await waitFor(() => {
      expect(screen.getByText('$250.00')).toBeInTheDocument();
      expect(screen.getByText('$35.00')).toBeInTheDocument();
    });
  });

  it('should display stock information', async () => {
    renderInventario();
    await waitFor(() => {
      // Torta de Chocolate: 50 unidades, stock OK
      expect(screen.getByText(/50\s+unidades/)).toBeInTheDocument();
      // Limonada Natural: 5 litros, stock bajo
      expect(screen.getByText(/5\s+litros/)).toBeInTheDocument();
      // Stock bajo alert
      expect(screen.getByText(/Stock bajo/)).toBeInTheDocument();
    });
  });

  it('should have Nuevo Producto button', async () => {
    renderInventario();
    await waitFor(() => {
      expect(screen.getByText(/Nuevo Producto/)).toBeInTheDocument();
    });
  });

  it('should open dialog for new product', async () => {
    const user = userEvent.setup();
    renderInventario();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Nuevo Producto/));

    await waitFor(() => {
      expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    });
  });

  it('should open dialog for editing product', async () => {
    const user = userEvent.setup();
    renderInventario();

    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
    });

    // Click edit button on first product
    const editButtons = screen.getAllByTitle('Editar');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Editar Producto')).toBeInTheDocument();
    });
  });

  it('should show SKU codes on products', async () => {
    renderInventario();
    await waitFor(() => {
      expect(screen.getByText('TCH-001')).toBeInTheDocument();
      expect(screen.getByText('LIM-001')).toBeInTheDocument();
    });
  });

  it('should show header and subtitle', async () => {
    renderInventario();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Inventario de Productos/ })).toBeInTheDocument();
      expect(screen.getByText('Gestión de productos y stock')).toBeInTheDocument();
    });
  });
});
