import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstagramCommentManager } from '../components/InstagramCommentManager';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    instagramGetComments: vi.fn(),
    instagramReplyToComment: vi.fn(),
    instagramHideComment: vi.fn(),
    instagramUnhideComment: vi.fn(),
  },
}));

const mockShowNotification = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

const mockComments = [
  {
    id: 'comment1',
    text: '¡Qué rico se ve!',
    username: 'usuario1',
    timestamp: '2026-07-05T15:30:00Z',
  },
  {
    id: 'comment2',
    text: '¿Hacen envíos?',
    username: 'usuario2',
    timestamp: '2026-07-06T10:00:00Z',
  },
];

describe('InstagramCommentManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowNotification.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render comments after loading', async () => {
    vi.mocked(api.instagramGetComments).mockResolvedValue({
      data: mockComments,
    } as any);

    render(<InstagramCommentManager postId="post123" />);

    await waitFor(() => {
      expect(screen.getByText('¡Qué rico se ve!')).toBeInTheDocument();
    });

    expect(screen.getByText('usuario1')).toBeInTheDocument();
    expect(screen.getByText('¿Hacen envíos?')).toBeInTheDocument();
    expect(screen.getByText('usuario2')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    vi.mocked(api.instagramGetComments).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<InstagramCommentManager postId="post123" />);

    expect(screen.getByText(/Cargando comentarios/)).toBeInTheDocument();
  });

  it('should show empty state when no comments', async () => {
    vi.mocked(api.instagramGetComments).mockResolvedValue({
      data: [],
    } as any);

    render(<InstagramCommentManager postId="post123" />);

    await waitFor(() => {
      expect(screen.getByText(/Sin comentarios/)).toBeInTheDocument();
    });
  });

  it('should show reply form when reply button is clicked', async () => {
    vi.mocked(api.instagramGetComments).mockResolvedValue({
      data: mockComments,
    } as any);

    const user = userEvent.setup();
    render(<InstagramCommentManager postId="post123" />);

    await waitFor(() => {
      expect(screen.getByText('¡Qué rico se ve!')).toBeInTheDocument();
    });

    const replyButtons = screen.getAllByText('Responder');
    await user.click(replyButtons[0]);

    expect(screen.getByPlaceholderText(/Escribí tu respuesta/)).toBeInTheDocument();
  });

  it('should call replyToComment on reply submit', async () => {
    vi.mocked(api.instagramGetComments).mockResolvedValue({
      data: mockComments,
    } as any);
    vi.mocked(api.instagramReplyToComment).mockResolvedValue({} as any);

    const user = userEvent.setup();
    render(<InstagramCommentManager postId="post123" />);

    await waitFor(() => {
      expect(screen.getByText('¡Qué rico se ve!')).toBeInTheDocument();
    });

    const replyButtons = screen.getAllByText('Responder');
    await user.click(replyButtons[0]);

    const replyInput = screen.getByPlaceholderText(/Escribí tu respuesta/);
    await user.type(replyInput, '¡Gracias!');

    await user.click(screen.getByText('Enviar'));

    await waitFor(() => {
      expect(api.instagramReplyToComment).toHaveBeenCalledWith(
        'comment1',
        '¡Gracias!',
      );
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.stringContaining('Respuesta'),
      'success',
    );
  });

  it('should call hideComment when hide button is clicked', async () => {
    vi.mocked(api.instagramGetComments).mockResolvedValue({
      data: mockComments,
    } as any);
    vi.mocked(api.instagramHideComment).mockResolvedValue({} as any);

    const user = userEvent.setup();
    render(<InstagramCommentManager postId="post123" />);

    await waitFor(() => {
      expect(screen.getByText('¡Qué rico se ve!')).toBeInTheDocument();
    });

    const hideButtons = screen.getAllByText('Ocultar');
    await user.click(hideButtons[0]);

    await waitFor(() => {
      expect(api.instagramHideComment).toHaveBeenCalledWith('comment1');
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.stringContaining('ocultado'),
      'success',
    );
  });
});
