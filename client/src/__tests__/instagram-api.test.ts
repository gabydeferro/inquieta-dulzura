import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from '../services/api';

describe('Instagram API methods', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let postSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getSpy: any;

  beforeEach(() => {
    postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: {} } as never);
    getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: {} } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('instagramUploadMedia', () => {
    it('should POST to /instagram/upload-media with productId, imageUrl, and caption', async () => {
      const mockResponse = { data: { containerId: 'media-123' } };
      postSpy.mockResolvedValue(mockResponse as never);

      const result = await api.instagramUploadMedia(
        42,
        'https://example.com/img.jpg',
        'Test caption',
      );

      expect(postSpy).toHaveBeenCalledWith('/instagram/upload-media', {
        productId: 42,
        imageUrl: 'https://example.com/img.jpg',
        caption: 'Test caption',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('instagramPublish', () => {
    it('should POST to /instagram/publish with productId, containerId, and caption', async () => {
      const mockResponse = { data: { postId: 'ig-post-456', status: 'published' } };
      postSpy.mockResolvedValue(mockResponse as never);

      const result = await api.instagramPublish(42, 'media-123', 'Final caption');

      expect(postSpy).toHaveBeenCalledWith('/instagram/publish', {
        productId: 42,
        containerId: 'media-123',
        caption: 'Final caption',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('instagramGetPostStatus', () => {
    it('should GET /instagram/products/:productId/post', async () => {
      const mockResponse = { data: { id: 1, status: 'published' } };
      getSpy.mockResolvedValue(mockResponse as never);

      const result = await api.instagramGetPostStatus(42);

      expect(getSpy).toHaveBeenCalledWith('/instagram/products/42/post');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('instagramGetMetrics', () => {
    it('should GET /instagram/products/:productId/metrics with default period 30d', async () => {
      const mockResponse = {
        data: { likeCount: 42, commentCount: 5, reach: 1200, impressions: 3400 },
      };
      getSpy.mockResolvedValue(mockResponse as never);

      const result = await api.instagramGetMetrics(42);

      expect(getSpy).toHaveBeenCalledWith('/instagram/products/42/metrics?period=30d');
      expect(result).toEqual(mockResponse);
    });

    it('should GET with custom period parameter', async () => {
      await api.instagramGetMetrics(42, '7d');
      expect(getSpy).toHaveBeenCalledWith('/instagram/products/42/metrics?period=7d');
    });
  });

  describe('instagramGetComments', () => {
    it('should GET /instagram/posts/:postId/comments', async () => {
      const mockResponse = {
        data: [{ id: 'c1', text: 'Great!', username: 'user1', timestamp: '2026-01-01T00:00:00Z' }],
      };
      getSpy.mockResolvedValue(mockResponse as never);

      const result = await api.instagramGetComments('ig-post-456');

      expect(getSpy).toHaveBeenCalledWith('/instagram/posts/ig-post-456/comments');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('instagramReplyToComment', () => {
    it('should POST to /instagram/comments/:commentId/reply with text', async () => {
      const mockResponse = { data: { id: 'reply-1' } };
      postSpy.mockResolvedValue(mockResponse as never);

      const result = await api.instagramReplyToComment('comment-abc', 'Thank you!');

      expect(postSpy).toHaveBeenCalledWith('/instagram/comments/comment-abc/reply', {
        text: 'Thank you!',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('instagramHideComment', () => {
    it('should POST to /instagram/comments/:commentId/hide', async () => {
      postSpy.mockResolvedValue({ data: { success: true } } as never);

      const result = await api.instagramHideComment('comment-abc');

      expect(postSpy).toHaveBeenCalledWith('/instagram/comments/comment-abc/hide');
      expect(result).toEqual({ data: { success: true } });
    });
  });

  describe('instagramUnhideComment', () => {
    it('should POST to /instagram/comments/:commentId/unhide', async () => {
      postSpy.mockResolvedValue({ data: { success: true } } as never);

      const result = await api.instagramUnhideComment('comment-abc');

      expect(postSpy).toHaveBeenCalledWith('/instagram/comments/comment-abc/unhide');
      expect(result).toEqual({ data: { success: true } });
    });
  });

  describe('instagramRefreshToken', () => {
    it('should POST to /instagram/auth/refresh', async () => {
      const mockResponse = { data: { expiresAt: '2026-09-01T00:00:00Z' } };
      postSpy.mockResolvedValue(mockResponse as never);

      const result = await api.instagramRefreshToken();

      expect(postSpy).toHaveBeenCalledWith('/instagram/auth/refresh');
      expect(result).toEqual(mockResponse);
    });
  });
});
