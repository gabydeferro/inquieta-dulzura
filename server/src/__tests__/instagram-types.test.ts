import { describe, test, expect } from 'vitest';

describe('Instagram server types', () => {
  test('InstagramToken interface shape', async () => {
    const types = await import('../types/instagram');
    const token: types.InstagramToken = {
      accessToken: 'test-token',
      expiresAt: new Date('2026-09-06'),
    };
    expect(token.accessToken).toBe('test-token');
    expect(token.expiresAt).toBeInstanceOf(Date);
  });

  test('InstagramPostRecord interface shape', async () => {
    const types = await import('../types/instagram');
    const post: types.InstagramPostRecord = {
      id: 1,
      productId: 42,
      instagramPostId: 'ig-post-123',
      status: 'published',
      caption: 'Test caption',
      mediaUrl: 'https://example.com/photo.jpg',
      publishedAt: new Date('2026-07-06'),
    };
    expect(post.id).toBe(1);
    expect(post.productId).toBe(42);
    expect(post.status).toBe('published');
    expect(post.caption).toBe('Test caption');
    expect(post.publishedAt).toBeInstanceOf(Date);
  });

  test('InstagramPostRecord supports all statuses', async () => {
    const types = await import('../types/instagram');

    const draft: types.InstagramPostRecord = {
      id: 1, productId: 1, instagramPostId: '', status: 'draft',
      caption: '', mediaUrl: '',
    };
    const publishing: types.InstagramPostRecord = {
      id: 2, productId: 1, instagramPostId: '', status: 'publishing',
      caption: '', mediaUrl: '',
    };
    const failed: types.InstagramPostRecord = {
      id: 3, productId: 1, instagramPostId: '', status: 'failed',
      caption: '', mediaUrl: '', errorMessage: 'API error',
    };

    expect(draft.status).toBe('draft');
    expect(publishing.status).toBe('publishing');
    expect(failed.status).toBe('failed');
    expect(failed.errorMessage).toBe('API error');
  });

  test('InstagramMetrics interface shape', async () => {
    const types = await import('../types/instagram');
    const metrics: types.InstagramMetrics = {
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
    const types = await import('../types/instagram');
    const comment: types.InstagramComment = {
      id: 'comment-abc',
      text: 'Great photo!',
      username: 'test_user',
      timestamp: '2026-07-06T12:00:00Z',
    };
    expect(comment.id).toBe('comment-abc');
    expect(comment.text).toBe('Great photo!');
    expect(comment.username).toBe('test_user');
  });

  test('InstagramConfig interface shape', async () => {
    const types = await import('../types/instagram');
    const config: types.InstagramConfig = {
      appId: 'app-123',
      appSecret: 'secret-456',
      accessToken: 'token-789',
      businessId: 'biz-000',
      configured: true,
    };
    expect(config.appId).toBe('app-123');
    expect(config.configured).toBe(true);

    const unconfigured: types.InstagramConfig = {
      appId: '', appSecret: '', accessToken: '', businessId: '', configured: false,
    };
    expect(unconfigured.configured).toBe(false);
  });
});
