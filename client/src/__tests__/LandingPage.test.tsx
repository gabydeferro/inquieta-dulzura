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
    expect(screen.getByText(/Endulzando momentos, creando recuerdos/)).toBeInTheDocument();
  });

  it('renders "Ver Catálogo" buttons linked to /catalogo', () => {
    renderLandingPage();
    const ctaLinks = screen.getAllByText('Ver Catálogo');
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of ctaLinks) {
      expect(link.closest('a')).toHaveAttribute('href', '/catalogo');
    }
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

  it('renders info bar with product focus', () => {
    renderLandingPage();
    expect(screen.getByText('Ingredientes Frescos')).toBeInTheDocument();
    expect(screen.getByText('Elaboración Artesanal')).toBeInTheDocument();
    expect(screen.getByText('Ocasiones Especiales')).toBeInTheDocument();
  });

  it('renders CTA section title "¿Listo para comenzar?"', () => {
    renderLandingPage();
    expect(screen.getByText('¿Listo para comenzar?')).toBeInTheDocument();
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
    expect(screen.getByText(/info@inquietadulzura/)).toBeInTheDocument();
    expect(screen.getByText('@inquietadulzura')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });
});
