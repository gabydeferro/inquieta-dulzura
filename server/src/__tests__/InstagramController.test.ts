import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Response } from 'express';
import { AuthRequest } from '../types/express';

import { InstagramController } from '../controllers/InstagramController';

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: { userId: 1, email: 'admin@test.com', rol: 'admin' },
    ...overrides,
  } as unknown as AuthRequest;
}

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('InstagramController', () => {
  let controller: InstagramController;
  let mockService: any;
  let req: AuthRequest;
  let res: Response;

  beforeEach(() => {
    mockService = {
      uploadMedia: vi.fn(),
      publishPost: vi.fn(),
      getMetrics: vi.fn(),
      getComments: vi.fn(),
      replyToComment: vi.fn(),
      hideComment: vi.fn(),
      unhideComment: vi.fn(),
      exchangeToken: vi.fn(),
      refreshToken: vi.fn(),
    };
    controller = new InstagramController(mockService);
    req = mockReq();
    res = mockRes();
  });

  describe('uploadMedia', () => {
    test('returns 201 with containerId on success', async () => {
      req.body = {
        productId: 1,
        imageUrl: 'https://example.com/photo.jpg',
        caption: 'Test caption',
      };
      mockService.uploadMedia.mockResolvedValue('container-abc-123');

      await controller.uploadMedia(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { productId: 1, containerId: 'container-abc-123' },
      });
    });

    test('returns 400 when imageUrl is missing', async () => {
      req.body = { productId: 1, caption: 'Test' };

      await controller.uploadMedia(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when caption is missing', async () => {
      req.body = { productId: 1, imageUrl: 'https://example.com/photo.jpg' };

      await controller.uploadMedia(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('publishPost', () => {
    test('returns 201 with postId on success', async () => {
      req.body = { productId: 1, containerId: 'container-abc-123', caption: 'Final caption' };
      mockService.publishPost.mockResolvedValue('ig-post-987');

      await controller.publishPost(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { productId: 1, postId: 'ig-post-987', caption: 'Final caption' },
      });
    });

    test('returns 400 when containerId is missing', async () => {
      req.body = { productId: 1 };

      await controller.publishPost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPostStatus', () => {
    test('returns post status for a product', async () => {
      req.params = { productId: '5' };

      await controller.getPostStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getMetrics', () => {
    test('returns metrics for a product post', async () => {
      req.params = { productId: '5' };
      req.query = { period: '7d', instagramPostId: 'ig-post-123' };
      mockService.getMetrics.mockResolvedValue({
        likeCount: 42,
        commentCount: 7,
        reach: 1200,
        impressions: 3400,
      });

      await controller.getMetrics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          likeCount: 42,
          commentCount: 7,
          reach: 1200,
          impressions: 3400,
          productId: 5,
          period: '7d',
        },
      });
    });

    test('returns 400 when instagramPostId is not provided', async () => {
      req.params = { productId: '5' };
      req.query = { period: '7d' };

      await controller.getMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 404 when service throws NotFoundError', async () => {
      req.params = { productId: '5' };
      req.query = { instagramPostId: 'ig-post-123' };
      mockService.getMetrics.mockRejectedValue(
        new Error('NotFoundError: Post no longer available'),
      );

      await controller.getMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 500 on unknown error', async () => {
      req.params = { productId: '5' };
      req.query = { instagramPostId: 'ig-post-123' };
      mockService.getMetrics.mockRejectedValue(new Error('Something unexpected'));

      await controller.getMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getComments', () => {
    test('returns comments for a post', async () => {
      req.params = { postId: 'ig-post-123' };
      const mockComments = [
        { id: 'c1', text: 'Nice!', username: 'user1', timestamp: '2026-07-06T12:00:00Z' },
      ];
      mockService.getComments.mockResolvedValue(mockComments);

      await controller.getComments(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockComments });
    });
  });

  describe('replyToComment', () => {
    test('replies to a comment', async () => {
      req.params = { commentId: 'comment-1' };
      req.body = { text: 'Thanks!' };

      await controller.replyToComment(req, res);

      expect(mockService.replyToComment).toHaveBeenCalledWith('comment-1', 'Thanks!');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Reply posted' });
    });

    test('returns 400 when text is missing', async () => {
      req.params = { commentId: 'comment-1' };
      req.body = {};

      await controller.replyToComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 404 when comment is not found', async () => {
      req.params = { commentId: 'deleted-comment' };
      req.body = { text: 'hi' };
      mockService.replyToComment.mockRejectedValue(new Error('NotFoundError: Comment not found'));

      await controller.replyToComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('hideComment / unhideComment', () => {
    test('hides a comment', async () => {
      req.params = { commentId: 'comment-1' };

      await controller.hideComment(req, res);

      expect(mockService.hideComment).toHaveBeenCalledWith('comment-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Comment hidden' });
    });

    test('unhides a comment', async () => {
      req.params = { commentId: 'comment-1' };

      await controller.unhideComment(req, res);

      expect(mockService.unhideComment).toHaveBeenCalledWith('comment-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Comment unhidden' });
    });
  });

  describe('refreshToken', () => {
    test('refreshes token', async () => {
      await controller.refreshToken(req, res);

      expect(mockService.refreshToken).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Token refreshed' });
    });
  });
});
