import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

// Mock AuthContext — unauthenticated by default
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderLandingPage = () => {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>,
  );
};

describe('LandingPage Component', () => {
  it('renders the brand name at least once', () => {
    renderLandingPage();
    const brandElements = screen.getAllByText('Inquieta Dulzura');
    expect(brandElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the tagline "Pastelería Boutique"', () => {
    renderLandingPage();
    expect(screen.getByText('Pastelería Boutique')).toBeInTheDocument();
  });

  it('renders hero description text', () => {
    renderLandingPage();
    expect(
      screen.getByText(/Endulzando momentos, creando recuerdos/),
    ).toBeInTheDocument();
  });

  it('renders "Ver Catálogo" CTA button linked to /catalogo', () => {
    renderLandingPage();
    const ctaLink = screen.getByText('Ver Catálogo').closest('a');
    expect(ctaLink).toHaveAttribute('href', '/catalogo');
  });

  it('renders "Únete a nosotros" CTA for unauthenticated users', () => {
    renderLandingPage();
    const joinLink = screen.getByText('Únete a nosotros').closest('a');
    expect(joinLink).toHaveAttribute('href', '/register');
  });

  it('renders the specialities section title', () => {
    renderLandingPage();
    expect(screen.getByText('Nuestras Especialidades')).toBeInTheDocument();
  });

  it('renders all four category names', () => {
    renderLandingPage();
    expect(screen.getByText('Tortas')).toBeInTheDocument();
    expect(screen.getByText('Panes')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();
    expect(screen.getByText('Postres')).toBeInTheDocument();
  });

  it('renders info bar with delivery info', () => {
    renderLandingPage();
    expect(screen.getByText('Envío a Domicilio')).toBeInTheDocument();
    expect(screen.getByText('Compra Segura')).toBeInTheDocument();
    expect(screen.getByText('Medios de Pago')).toBeInTheDocument();
  });

  it('renders CTA section title "¿Listo para comenzar?"', () => {
    renderLandingPage();
    expect(screen.getByText('¿Listo para comenzar?')).toBeInTheDocument();
  });

  it('renders CTA buttons for unauthenticated users', () => {
    renderLandingPage();
    expect(screen.getByText('Crear Cuenta Gratis')).toBeInTheDocument();
    expect(screen.getByText('Ya tengo cuenta')).toBeInTheDocument();
  });

  it('renders footer with brand name', () => {
    renderLandingPage();
    const footers = screen.getAllByText('Inquieta Dulzura');
    // At least one is in the footer area (not the hero)
    expect(footers.length).toBeGreaterThanOrEqual(2);
  });

  it('renders footer navigation links', () => {
    renderLandingPage();
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  it('renders footer contact information', () => {
    renderLandingPage();
    expect(screen.getByText(/Villa Ramallo/)).toBeInTheDocument();
    expect(screen.getByText(/info@inquietadulzura/)).toBeInTheDocument();
  });

  it('renders footer hours section', () => {
    renderLandingPage();
    expect(screen.getByText('Mar a Sáb: 09:00 - 20:00')).toBeInTheDocument();
    expect(screen.getByText('Dom: 09:00 - 13:00')).toBeInTheDocument();
    expect(screen.getByText('Lun: Cerrado')).toBeInTheDocument();
  });
});
