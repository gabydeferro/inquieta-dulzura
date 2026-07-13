import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { InstagramSettings } from '../components/InstagramSettings';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    instagramRefreshToken: vi.fn(),
  },
}));

const mockShowNotification = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

describe('InstagramSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowNotification.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the settings card', () => {
    render(<InstagramSettings />);
    expect(screen.getByText('Configuración de Instagram')).toBeInTheDocument();
  });

  it('should show status info', () => {
    render(<InstagramSettings />);
    expect(screen.getByText(/Estado/)).toBeInTheDocument();
    expect(screen.getByText(/Token:/)).toBeInTheDocument();
  });

  it('should have a refresh token button', () => {
    render(<InstagramSettings />);
    expect(screen.getByText('Refrescar Token')).toBeInTheDocument();
  });

  it('should call refreshToken when button is clicked', async () => {
    vi.mocked(api.instagramRefreshToken).mockResolvedValue({} as any);

    render(<InstagramSettings />);
    fireEvent.click(screen.getByText('Refrescar Token'));

    await waitFor(() => {
      expect(api.instagramRefreshToken).toHaveBeenCalled();
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.stringContaining('refrescado'),
      'success',
    );
  });

  it('should show error when refresh fails', async () => {
    vi.mocked(api.instagramRefreshToken).mockRejectedValue(new Error('Refresh failed'));

    render(<InstagramSettings />);
    fireEvent.click(screen.getByText('Refrescar Token'));

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(expect.stringContaining('Error'), 'error');
    });
  });

  it('should disable refresh button during API call', async () => {
    vi.mocked(api.instagramRefreshToken).mockImplementation(() => new Promise(() => {}));

    render(<InstagramSettings />);
    fireEvent.click(screen.getByText('Refrescar Token'));

    expect(screen.getByText('Refrescando...')).toBeInTheDocument();
  });
});
