import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../components/Register';
import { AuthProvider } from '../contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register Component', () => {
  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>,
    );
  };

  it('renders the registration form', () => {
    renderRegister();
    expect(screen.getByAltText(/Inquieta Dulzura/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Registrarse/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    // "Contraseña" appears in both password labels — use getAllByLabelText
    const passwordLabels = screen.getAllByLabelText(/Contraseña/i);
    expect(passwordLabels.length).toBe(2);
  });

  it('has a submit button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument();
  });

  it('shows link to login page', () => {
    renderRegister();
    const loginLink = screen.getByText(/Inicia sesión aquí/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('allows typing in all fields', () => {
    renderRegister();
    const nameInput = screen.getByLabelText(/Nombre Completo/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    // Both password fields share the same placeholder
    const passwordInputs = screen.getAllByPlaceholderText('••••••••') as HTMLInputElement[];

    fireEvent.change(nameInput, { target: { value: 'María García' } });
    fireEvent.change(emailInput, { target: { value: 'maria@test.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'password123' } });

    expect(nameInput.value).toBe('María García');
    expect(emailInput.value).toBe('maria@test.com');
    expect(passwordInputs[0].value).toBe('password123');
    expect(passwordInputs[1].value).toBe('password123');
  });
});
