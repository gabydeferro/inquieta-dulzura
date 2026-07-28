import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';

// Mock AuthContext — configurable per test
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const renderAdminRoute = (user: { rol: 'admin' | 'usuario' } | null, loading = false) => {
  mockUseAuth.mockReturnValue({
    user,
    isAuthenticated: !!user,
    loading,
  });

  return render(
    <BrowserRouter>
      <AdminRoute>
        <div data-testid="admin-content">Admin Dashboard</div>
      </AdminRoute>
    </BrowserRouter>,
  );
};

describe('AdminRoute Component', () => {
  it('shows loading spinner while auth is loading', () => {
    renderAdminRoute(null, true);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('renders children when user is admin', () => {
    renderAdminRoute({ rol: 'admin' });
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('redirects to / when user is usuario', () => {
    const { container } = renderAdminRoute({ rol: 'usuario' });
    // Navigate component renders a redirect — admin content should NOT appear
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    // The Navigate component replaces the current entry
    expect(container.querySelector('[data-testid="admin-content"]')).not.toBeInTheDocument();
  });

  it('does not render admin content for usuario role', () => {
    renderAdminRoute({ rol: 'usuario' });
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });
});
