import { describe, test, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: (err: any) => err?.isAxiosError === true,
  },
}));

vi.mock('../config/instagram', () => ({
  getConfig: vi.fn(() => ({
    appId: 'test-app-id',
    appSecret: 'test-app-secret',
    accessToken: 'existing-token',
    businessId: 'test-business-id',
    configured: true,
  })),
}));

import { InstagramService } from '../services/InstagramService';

const mockedGet = vi.mocked(axios.get);
const mockedPost = vi.mocked(axios.post);

describe('InstagramService', () => {
  let service: InstagramService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new InstagramService();
  });

  describe('ensureValidToken', () => {
    test('refreshes token when expiresAt is epoch (unknown expiry)', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'new-token-after-refresh', expires_in: 5177249 },
      });

      await service.ensureValidToken();

      expect(mockedGet).toHaveBeenCalledTimes(1);
      expect(mockedGet).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/oauth/access_token',
        expect.objectContaining({
          params: expect.objectContaining({
            grant_type: 'fb_exchange_token',
            client_id: 'test-app-id',
            client_secret: 'test-app-secret',
          }),
        }),
      );
    });

    test('does NOT refresh when token expiry is far in the future', async () => {
      (service as any).token = {
        accessToken: 'valid-token',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      };

      await service.ensureValidToken();

      expect(mockedGet).not.toHaveBeenCalled();
    });

    test('refreshes token when fewer than 7 days remain', async () => {
      (service as any).token = {
        accessToken: 'expiring-token',
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      };

      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'refreshed-token', expires_in: 5177249 },
      });

      await service.ensureValidToken();

      expect(mockedGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('exchangeToken', () => {
    test('exchanges short-lived token and returns InstagramToken', async () => {
      const expiresIn = 5177249;
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'new-long-lived-token', token_type: 'bearer', expires_in: expiresIn },
      });

      const result = await service.exchangeToken('short-lived-token');

      expect(result.accessToken).toBe('new-long-lived-token');
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(mockedGet).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/oauth/access_token',
        expect.objectContaining({
          params: expect.objectContaining({
            grant_type: 'fb_exchange_token',
            fb_exchange_token: 'short-lived-token',
          }),
        }),
      );
    });

    test('throws AuthError on API failure', async () => {
      mockedGet.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error: { message: 'Invalid OAuth 2.0 Access Token', type: 'OAuthException', code: 190 },
          },
        },
      });

      await expect(service.exchangeToken('bad-token')).rejects.toThrow('AuthError');
    });
  });

  describe('refreshToken', () => {
    test('refreshes the current token and updates internal state', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'refreshed-access-token', expires_in: 5177249 },
      });

      await service.refreshToken();

      const internalToken = (service as any).token;
      expect(internalToken.accessToken).toBe('refreshed-access-token');
      expect(internalToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('throws ExpiredTokenError when token is permanently expired', async () => {
      mockedGet.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { error: { message: 'Error validating access token', code: 190 } } },
      });

      await expect(service.refreshToken()).rejects.toThrow('ExpiredTokenError');
    });
  });

  describe('uploadMedia', () => {
    test('uploads media and returns container ID', async () => {
      // Token refresh (token at epoch) + media POST
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedPost.mockResolvedValueOnce({ data: { id: 'container-abc-123' } });

      const result = await service.uploadMedia('https://example.com/photo.jpg', 'Test caption');

      expect(result).toBe('container-abc-123');
      expect(mockedPost).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/test-business-id/media',
        expect.objectContaining({
          image_url: 'https://example.com/photo.jpg',
          caption: 'Test caption',
        }),
      );
    });
  });

  describe('publishPost', () => {
    test('publishes media container and returns post ID', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedPost.mockResolvedValueOnce({ data: { id: 'ig-post-987' } });

      const result = await service.publishPost('container-abc-123');

      expect(result).toBe('ig-post-987');
      expect(mockedPost).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/test-business-id/media_publish',
        expect.objectContaining({ creation_id: 'container-abc-123' }),
      );
    });

    test('throws RateLimitError on rate limit', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { error: { message: 'Rate limit reached', code: 4 } } },
      });

      await expect(service.publishPost('container-id')).rejects.toThrow('RateLimitError');
    });
  });

  describe('getMetrics', () => {
    const mockMetricsData = {
      like_count: 42,
      comments_count: 7,
      reach: 1200,
      impressions: 3400,
      id: 'ig-post-123',
    };

    test('fetches and returns metrics from API', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedGet.mockResolvedValueOnce({ data: mockMetricsData });

      const result = await service.getMetrics('ig-post-123');

      expect(result.likeCount).toBe(42);
      expect(result.commentCount).toBe(7);
      expect(result.reach).toBe(1200);
      expect(result.impressions).toBe(3400);
    });

    test('returns cached metrics when cache is fresh (< 15 min)', async () => {
      // First call: fetch from API (refresh + metrics GET)
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedGet.mockResolvedValueOnce({ data: mockMetricsData });
      await service.getMetrics('ig-post-123');

      // Reset mocks completely — second call should use cache, not call axios
      vi.resetAllMocks();
      const result = await service.getMetrics('ig-post-123');

      expect(result.likeCount).toBe(42);
      expect(mockedGet).not.toHaveBeenCalled();
    });

    test('fetches fresh metrics when cache is stale (> 15 min)', async () => {
      // First call: fetch from API (token at epoch → refresh + metrics GET)
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedGet.mockResolvedValueOnce({ data: mockMetricsData });
      await service.getMetrics('ig-post-123');

      // Age the cache timestamp so it's stale
      const cache = (service as any).metricsCache as Map<string, { data: any; timestamp: number }>;
      const entry = cache.get('ig-post-123:all')!;
      entry.timestamp = Date.now() - 20 * 60 * 1000;

      // Now token is valid (refreshed in first call), so only 1 GET for metrics
      vi.resetAllMocks();
      mockedGet.mockResolvedValueOnce({ data: { ...mockMetricsData, like_count: 50 } });

      const result = await service.getMetrics('ig-post-123');

      expect(result.likeCount).toBe(50);
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    test('throws NotFoundError when post is deleted', async () => {
      // Token at epoch → needs refresh first
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedGet.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { error: { message: 'Unsupported get request', code: 100 } } },
      });

      await expect(service.getMetrics('deleted-post')).rejects.toThrow('NotFoundError');
    });
  });

  describe('getComments', () => {
    test('fetches and returns comments array', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedGet.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'comment-1',
              text: 'Great photo!',
              username: 'test_user',
              timestamp: '2026-07-06T12:00:00+0000',
            },
            {
              id: 'comment-2',
              text: 'Looks delicious',
              username: 'food_lover',
              timestamp: '2026-07-06T13:00:00+0000',
            },
          ],
        },
      });

      const result = await service.getComments('ig-post-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('comment-1');
      expect(result[0].text).toBe('Great photo!');
      expect(result[0].username).toBe('test_user');
      expect(result[1].id).toBe('comment-2');
    });

    test('returns empty array when no comments', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedGet.mockResolvedValueOnce({ data: { data: [] } });

      const result = await service.getComments('ig-post-123');

      expect(result).toEqual([]);
    });
  });

  describe('replyToComment', () => {
    test('posts a reply to a comment', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedPost.mockResolvedValueOnce({ data: { id: 'reply-123' } });

      await service.replyToComment('comment-1', 'Thanks!');

      expect(mockedPost).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/comment-1/replies',
        expect.objectContaining({ message: 'Thanks!' }),
      );
    });

    test('throws NotFoundError when comment was deleted', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { error: { message: 'Comment not found', code: 100 } } },
      });

      await expect(service.replyToComment('deleted-comment', 'hi')).rejects.toThrow(
        'NotFoundError',
      );
    });
  });

  describe('hideComment / unhideComment', () => {
    test('hides a comment', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedPost.mockResolvedValueOnce({ data: { success: true } });

      await service.hideComment('comment-1');

      expect(mockedPost).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/comment-1/hide',
        expect.any(Object),
      );
    });

    test('unhides a comment', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { access_token: 'valid-token', expires_in: 5177249 },
      });
      mockedPost.mockResolvedValueOnce({ data: { success: true } });

      await service.unhideComment('comment-1');

      expect(mockedPost).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/comment-1/unhide',
        expect.any(Object),
      );
    });
  });
});
