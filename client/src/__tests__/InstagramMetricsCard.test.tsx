import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { InstagramMetricsCard } from '../components/InstagramMetricsCard';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    instagramGetMetrics: vi.fn(),
  },
}));

const mockMetricsData = {
  likeCount: 42,
  commentCount: 7,
  reach: 1200,
  impressions: 3400,
};

describe('InstagramMetricsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should show loading state initially', () => {
    vi.mocked(api.instagramGetMetrics).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<InstagramMetricsCard productId={1} />);

    expect(screen.getByText(/Cargando/)).toBeInTheDocument();
  });

  it('should render metrics after loading', async () => {
    vi.mocked(api.instagramGetMetrics).mockResolvedValue({
      data: mockMetricsData,
    } as any);

    render(<InstagramMetricsCard productId={1} />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('1.200')).toBeInTheDocument();
    expect(screen.getByText('3.400')).toBeInTheDocument();
  });

  it('should show error message when API fails', async () => {
    vi.mocked(api.instagramGetMetrics).mockRejectedValue(
      new Error('API Error'),
    );

    render(<InstagramMetricsCard productId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });
  });

  it('should fetch metrics with 30d period by default', async () => {
    vi.mocked(api.instagramGetMetrics).mockResolvedValue({
      data: mockMetricsData,
    } as any);

    render(<InstagramMetricsCard productId={1} />);

    await waitFor(() => {
      expect(api.instagramGetMetrics).toHaveBeenCalledWith(1, '30d');
    });
  });

  it('should re-fetch when period selector changes', async () => {
    vi.mocked(api.instagramGetMetrics).mockResolvedValue({
      data: mockMetricsData,
    } as any);

    render(<InstagramMetricsCard productId={1} />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    // Click "7d" button
    fireEvent.click(screen.getByText('7d'));

    await waitFor(() => {
      expect(api.instagramGetMetrics).toHaveBeenCalledWith(1, '7d');
    });
  });

  it('should show empty state when no productId provided', () => {
    render(<InstagramMetricsCard productId={0} />);

    expect(screen.getByText(/Seleccioná un producto/)).toBeInTheDocument();
  });
});
