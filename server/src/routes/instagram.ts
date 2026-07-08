import { Router } from 'express';
import { InstagramController } from '../controllers/InstagramController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const instagramController = new InstagramController();

// All Instagram routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/instagram/upload-media
 * @desc    Upload a media file to Instagram (returns container ID)
 * @access  Private
 */
router.post('/upload-media', instagramController.uploadMedia);

/**
 * @route   POST /api/instagram/publish
 * @desc    Publish a media container as an Instagram post
 * @access  Private
 */
router.post('/publish', instagramController.publishPost);

/**
 * @route   GET /api/instagram/products/:productId/post
 * @desc    Get Instagram post status for a product
 * @access  Private
 */
router.get('/products/:productId/post', instagramController.getPostStatus);

/**
 * @route   GET /api/instagram/products/:productId/metrics
 * @desc    Get Instagram metrics for a product's post
 * @access  Private
 */
router.get('/products/:productId/metrics', instagramController.getMetrics);

/**
 * @route   GET /api/instagram/posts/:postId/comments
 * @desc    Get comments for an Instagram post
 * @access  Private
 */
router.get('/posts/:postId/comments', instagramController.getComments);

/**
 * @route   POST /api/instagram/comments/:commentId/reply
 * @desc    Reply to a comment on an Instagram post
 * @access  Private
 */
router.post('/comments/:commentId/reply', instagramController.replyToComment);

/**
 * @route   POST /api/instagram/comments/:commentId/hide
 * @desc    Hide a comment on an Instagram post
 * @access  Private
 */
router.post('/comments/:commentId/hide', instagramController.hideComment);

/**
 * @route   POST /api/instagram/comments/:commentId/unhide
 * @desc    Unhide a previously hidden comment
 * @access  Private
 */
router.post('/comments/:commentId/unhide', instagramController.unhideComment);

/**
 * @route   POST /api/instagram/auth/refresh
 * @desc    Manually refresh the Instagram access token
 * @access  Private
 */
router.post('/auth/refresh', instagramController.refreshToken);

export default router;
