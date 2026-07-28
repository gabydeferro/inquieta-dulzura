import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Mock AuthContext — configurable per test
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock ThemeProvider — ThemeToggle needs ThemeContext
vi.mock('../components/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ThemeToggle: () => (
    <button aria-label="Toggle theme" role="button">
      Theme
    </button>
  ),
}));

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>,
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unauthenticated users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        logout: mockLogout,
      });
    });

    it('renders brand logo with alt text', () => {
      renderNavbar();
      const logo = screen.getByAltText('');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.svg');
    });

    it('renders brand name "Inquieta Dulzura"', () => {
      renderNavbar();
      expect(screen.getByText('Inquieta Dulzura')).toBeInTheDocument();
    });

    it('renders Catálogo link for unauthenticated users', () => {
      renderNavbar();
      expect(screen.getByText('Catálogo')).toBeInTheDocument();
    });

    it('renders Ingresar (login) link for unauthenticated users', () => {
      renderNavbar();
      expect(screen.getByText('Ingresar')).toBeInTheDocument();
    });

    it('renders Registrarse link for unauthenticated users', () => {
      renderNavbar();
      expect(screen.getByText('Registrarse')).toBeInTheDocument();
    });

    it('does not render admin nav links', () => {
      renderNavbar();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
      expect(screen.queryByText('Recetas')).not.toBeInTheDocument();
    });
  });

  describe('admin users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'admin@test.com', nombre: 'Admin', rol: 'admin' },
        isAuthenticated: true,
        loading: false,
        logout: mockLogout,
      });
    });

    it('renders all 8 admin navigation links', () => {
      renderNavbar();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventario')).toBeInTheDocument();
      expect(screen.getByText('Recetas')).toBeInTheDocument();
      expect(screen.getByText('Ingredientes')).toBeInTheDocument();
      expect(screen.getByText('Ventas')).toBeInTheDocument();
      expect(screen.getByText('Historial')).toBeInTheDocument();
      expect(screen.getByText('Clientes')).toBeInTheDocument();
      expect(screen.getByText('Contenido Digital')).toBeInTheDocument();
    });

    it('renders admin badge', () => {
      renderNavbar();
      // The badge is a <span> with uppercase "Admin" text
      const badges = screen.getAllByText('Admin');
      expect(badges.length).toBeGreaterThanOrEqual(2); // user name + badge
    });

    it('renders user name and admin badge', () => {
      renderNavbar();
      // "Admin" appears twice: as user name and as badge
      const adminElements = screen.getAllByText('Admin');
      expect(adminElements.length).toBeGreaterThanOrEqual(2);
    });

    it('does not render Catálogo link', () => {
      renderNavbar();
      expect(screen.queryByText('Catálogo')).not.toBeInTheDocument();
    });
  });

  describe('usuario (non-admin) users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 2, email: 'user@test.com', nombre: 'Usuario', rol: 'usuario' },
        isAuthenticated: true,
        loading: false,
        logout: mockLogout,
      });
    });

    it('renders zero admin navigation links', () => {
      renderNavbar();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
      expect(screen.queryByText('Recetas')).not.toBeInTheDocument();
      expect(screen.queryByText('Ingredientes')).not.toBeInTheDocument();
      expect(screen.queryByText('Ventas')).not.toBeInTheDocument();
      expect(screen.queryByText('Historial')).not.toBeInTheDocument();
      expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
      expect(screen.queryByText('Contenido Digital')).not.toBeInTheDocument();
    });

    it('does not render admin badge', () => {
      renderNavbar();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('does not render Catálogo link for usuario', () => {
      renderNavbar();
      // Catálogo is only for unauthenticated users
      expect(screen.queryByText('Catálogo')).not.toBeInTheDocument();
    });

    it('renders user name', () => {
      renderNavbar();
      expect(screen.getByText('Usuario')).toBeInTheDocument();
    });
  });
});
