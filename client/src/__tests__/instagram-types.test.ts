import { describe, test, expect } from 'vitest';
import type { InstagramPost, InstagramMetrics, InstagramComment } from '../types/instagram';

describe('Instagram client types', () => {
  test('InstagramPost interface shape', async () => {
    await import('../types/instagram');
    const post: InstagramPost = {
      id: 1,
      productId: 42,
      instagramPostId: 'ig-post-123',
      status: 'published',
      caption: 'Test caption',
      mediaUrl: 'https://example.com/photo.jpg',
      publishedAt: '2026-07-06T12:00:00Z',
    };
    expect(post.id).toBe(1);
    expect(post.productId).toBe(42);
    expect(post.status).toBe('published');
    expect(post.caption).toBe('Test caption');
    expect(post.publishedAt).toBe('2026-07-06T12:00:00Z');
  });

  test('InstagramPost supports all statuses', async () => {
    await import('../types/instagram');
    const draft: InstagramPost = {
      id: 1,
      productId: 1,
      instagramPostId: '',
      status: 'draft',
      caption: '',
      mediaUrl: '',
    };
    const failed: InstagramPost = {
      id: 2,
      productId: 1,
      instagramPostId: '',
      status: 'failed',
      caption: '',
      mediaUrl: '',
      errorMessage: 'API error',
    };
    expect(draft.status).toBe('draft');
    expect(failed.status).toBe('failed');
    expect(failed.errorMessage).toBe('API error');
  });

  test('InstagramMetrics interface shape', async () => {
    await import('../types/instagram');
    const metrics: InstagramMetrics = {
      likeCount: 42,
      commentCount: 7,
      reach: 1200,
      impressions: 3400,
    };
    expect(metrics.likeCount).toBe(42);
    expect(metrics.commentCount).toBe(7);
    expect(metrics.reach).toBe(1200);
    expect(metrics.impressions).toBe(3400);
  });

  test('InstagramComment interface shape', async () => {
    await import('../types/instagram');
    const comment: InstagramComment = {
      id: 'comment-abc',
      text: 'Great photo!',
      username: 'test_user',
      timestamp: '2026-07-06T12:00:00Z',
    };
    expect(comment.id).toBe('comment-abc');
    expect(comment.text).toBe('Great photo!');
    expect(comment.username).toBe('test_user');
  });
});
