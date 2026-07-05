import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Mock AuthContext — unauthenticated by default
const mockLogout = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    logout: mockLogout,
  }),
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

  it('renders at least one theme toggle button', () => {
    renderNavbar();
    const toggleButtons = screen.getAllByLabelText('Toggle theme');
    expect(toggleButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders hamburger menu button on mobile', () => {
    renderNavbar();
    const menuButton = screen.getByLabelText('Abrir menú');
    expect(menuButton).toBeInTheDocument();
  });
});
