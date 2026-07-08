import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstagramPublishButton } from '../components/InstagramPublishButton';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    instagramUploadMedia: vi.fn(),
    instagramPublish: vi.fn(),
  },
}));

const mockShowNotification = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

const defaultProps = {
  productId: 1,
  productName: 'Torta de Chocolate',
  productDescription: 'Deliciosa torta artesanal',
  productPrice: 250.00,
  productImageUrl: 'https://example.com/torta.jpg',
};

describe('InstagramPublishButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowNotification.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props = {}) => {
    return render(<InstagramPublishButton {...defaultProps} {...props} />);
  };

  it('should render the publish button', () => {
    renderComponent();
    expect(screen.getByText('Publicar en Instagram')).toBeInTheDocument();
  });

  it('should open caption editor dialog when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Publicar en Instagram'));

    expect(screen.getByPlaceholderText(/Escribí el pie de foto/)).toBeInTheDocument();
  });

  it('should call upload + publish APIs on submit and show success', async () => {
    vi.mocked(api.instagramUploadMedia).mockResolvedValue({
      data: { containerId: 'abc123' },
    } as any);
    vi.mocked(api.instagramPublish).mockResolvedValue({
      data: { postId: 'post123', status: 'published' },
    } as any);

    const user = userEvent.setup();
    renderComponent();

    // Open editor
    await user.click(screen.getByText('Publicar en Instagram'));

    // Click publish in the editor
    await user.click(screen.getAllByText('Publicar en Instagram')[1]);

    await waitFor(() => {
      expect(api.instagramUploadMedia).toHaveBeenCalledWith(
        1,
        defaultProps.productImageUrl,
        expect.stringContaining('Torta de Chocolate'),
      );
    });

    expect(api.instagramPublish).toHaveBeenCalledWith(
      1,
      'abc123',
      expect.stringContaining('Torta de Chocolate'),
    );
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.stringContaining('Publicado'),
      'success',
    );
  });

  it('should show loading state on button during publishing', async () => {
    vi.mocked(api.instagramUploadMedia).mockImplementation(
      () => new Promise(() => {}),
    );

    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Publicar en Instagram'));
    await user.click(screen.getAllByText('Publicar en Instagram')[1]);

    expect(screen.getByText('Publicando...')).toBeInTheDocument();
  });

  it('should show error notification on API failure', async () => {
    vi.mocked(api.instagramUploadMedia).mockRejectedValue(
      new Error('Upload failed'),
    );

    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Publicar en Instagram'));
    await user.click(screen.getAllByText('Publicar en Instagram')[1]);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        'error',
      );
    });
  });
});
