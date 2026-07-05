import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Catalogo from '../Catalogo';

const mockProductos = vi.hoisted(() => [
  { id: 1, categoria_id: 1, nombre: 'Torta de Chocolate', descripcion: 'Deliciosa torta', precio: 2500, categoriaNombre: 'Tortas' },
  { id: 2, categoria_id: 2, nombre: 'Pan Artesanal', descripcion: 'Pan de masa madre', precio: 800, categoriaNombre: 'Panes' },
]);

const mockCategorias = vi.hoisted(() => [
  { id: 1, nombre: 'Tortas', descripcion: '', activo: true },
  { id: 2, nombre: 'Panes', descripcion: '', activo: true },
]);

vi.mock('../services/api', () => ({
  default: {
    getCategorias: vi.fn().mockResolvedValue({ data: mockCategorias }),
    getProductos: vi.fn().mockResolvedValue({ data: mockProductos }),
    getProductosByCategoria: vi.fn().mockResolvedValue({ data: [mockProductos[0]] }),
  },
}));

const renderCatalogo = () => {
  return render(
    <BrowserRouter>
      <Catalogo />
    </BrowserRouter>,
  );
};

describe('Catalogo Component', () => {
  it('renders page title', async () => {
    renderCatalogo();
    await waitFor(() => {
      expect(screen.getByText('Nuestro Catálogo')).toBeInTheDocument();
    });
  });

  it('renders "Volver al inicio" link', () => {
    renderCatalogo();
    const backLink = screen.getByText('Volver al inicio').closest('a');
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('renders category filter pills including "Todas"', async () => {
    renderCatalogo();
    await waitFor(() => {
      expect(screen.getByText('Todas')).toBeInTheDocument();
      // Category names appear as filter pills AND as badges — use getAllByText
      const tortas = screen.getAllByText('Tortas');
      expect(tortas.length).toBeGreaterThanOrEqual(1);
      const panes = screen.getAllByText('Panes');
      expect(panes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders product names after loading', async () => {
    renderCatalogo();
    await waitFor(() => {
      expect(screen.getByText('Torta de Chocolate')).toBeInTheDocument();
      expect(screen.getByText('Pan Artesanal')).toBeInTheDocument();
    });
  });

  it('renders product prices', async () => {
    renderCatalogo();
    await waitFor(() => {
      expect(screen.getByText('$2500.00')).toBeInTheDocument();
      expect(screen.getByText('$800.00')).toBeInTheDocument();
    });
  });

  it('renders product descriptions', async () => {
    renderCatalogo();
    await waitFor(() => {
      expect(screen.getByText('Deliciosa torta')).toBeInTheDocument();
      expect(screen.getByText('Pan de masa madre')).toBeInTheDocument();
    });
  });

  it('renders category badges on product cards', async () => {
    renderCatalogo();
    await waitFor(() => {
      const badges = screen.getAllByText('Tortas');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders "Consultar" button on each product', async () => {
    renderCatalogo();
    await waitFor(() => {
      const consultButtons = screen.getAllByText('Consultar');
      expect(consultButtons.length).toBe(2);
    });
  });

  it('renders bottom CTA section with title', async () => {
    renderCatalogo();
    await waitFor(() => {
      expect(screen.getByText('¿Quieres gestionar tu propia pastelería?')).toBeInTheDocument();
    });
  });

  it('renders bottom CTA buttons', async () => {
    renderCatalogo();
    await waitFor(() => {
      expect(screen.getByText('Registrarse Gratis')).toBeInTheDocument();
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderCatalogo();
    expect(screen.getByText('Cargando catálogo...')).toBeInTheDocument();
  });
});
