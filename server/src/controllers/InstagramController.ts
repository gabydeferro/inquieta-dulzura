import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { InstagramService } from '../services/InstagramService';

export class InstagramController {
  private service: InstagramService;

  constructor(service?: InstagramService) {
    this.service = service ?? new InstagramService();
  }

  // ========================================
  // MEDIA & PUBLISH
  // ========================================

  /**
   * POST /api/instagram/upload-media
   * Upload a media file to Instagram and return the container ID.
   */
  uploadMedia = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId, imageUrl, caption } = req.body;

      if (!imageUrl || !caption) {
        res.status(400).json({ success: false, message: 'imageUrl and caption are required' });
        return;
      }

      const containerId = await this.service.uploadMedia(imageUrl, caption);

      res.status(201).json({ success: true, data: { productId, containerId } });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /api/instagram/publish
   * Publish a media container as an Instagram post.
   */
  publishPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId, containerId, caption } = req.body;

      if (!containerId) {
        res.status(400).json({ success: false, message: 'containerId is required' });
        return;
      }

      const postId = await this.service.publishPost(containerId);

      res.status(201).json({ success: true, data: { productId, postId, caption } });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /api/instagram/products/:productId/post
   * Get Instagram post status for a product.
   */
  getPostStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      // TODO: Look up instagram_posts table for this product
      // For now, return not_found — will be completed when DB integration is added
      res.json({
        success: true,
        data: {
          productId: Number(productId),
          status: 'not_found',
          message: 'No Instagram post found for this product',
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * GET /api/instagram/products/:productId/metrics
   * Fetch Instagram metrics for a product's post.
   */
  getMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const period = (req.query.period as string) || '7d';

      // TODO: Look up instagramPostId from instagram_posts table
      // For now, we accept postId via query param for flexibility
      const instagramPostId = req.query.instagramPostId as string;
      if (!instagramPostId) {
        res.status(400).json({ success: false, message: 'instagramPostId query param is required' });
        return;
      }

      const metrics = await this.service.getMetrics(instagramPostId, period);

      res.json({ success: true, data: { ...metrics, productId: Number(productId), period } });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ========================================
  // COMMENTS
  // ========================================

  /**
   * GET /api/instagram/posts/:postId/comments
   * Get comments for a given Instagram post.
   */
  getComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { postId } = req.params;
      const comments = await this.service.getComments(postId);

      res.json({ success: true, data: comments });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /api/instagram/comments/:commentId/reply
   * Reply to a comment on an Instagram post.
   */
  replyToComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params;
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ success: false, message: 'text is required' });
        return;
      }

      await this.service.replyToComment(commentId, text);

      res.json({ success: true, message: 'Reply posted' });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /api/instagram/comments/:commentId/hide
   * Hide a comment on an Instagram post.
   */
  hideComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params;
      await this.service.hideComment(commentId);

      res.json({ success: true, message: 'Comment hidden' });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /api/instagram/comments/:commentId/unhide
   * Unhide a previously hidden comment on an Instagram post.
   */
  unhideComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params;
      await this.service.unhideComment(commentId);

      res.json({ success: true, message: 'Comment unhidden' });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ========================================
  // AUTH / TOKEN
  // ========================================

  /**
   * POST /api/instagram/auth/refresh
   * Manually trigger a token refresh.
   */
  refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.service.refreshToken();

      res.json({ success: true, message: 'Token refreshed' });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ========================================
  // ERROR HANDLING
  // ========================================

  private handleError(error: unknown, res: Response): void {
    const message = error instanceof Error ? error.message : 'Unknown error';

    console.error('InstagramController error:', message);

    if (message.startsWith('AuthError')) {
      res.status(401).json({ success: false, message });
    } else if (message.startsWith('ExpiredTokenError')) {
      res.status(401).json({ success: false, message });
    } else if (message.startsWith('NotFoundError')) {
      res.status(404).json({ success: false, message });
    } else if (message.startsWith('RateLimitError')) {
      res.status(429).json({ success: false, message });
    } else if (message.startsWith('ValidationError')) {
      res.status(400).json({ success: false, message });
    } else {
      res.status(500).json({ success: false, message });
    }
  }
}
