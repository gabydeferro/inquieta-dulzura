import axios from 'axios';
import { getConfig } from '../config/instagram';
import { InstagramToken, InstagramMetrics, InstagramComment, InstagramWebhookNotification } from '../types/instagram';

// ── Instagram Graph API response shapes ──────────

interface TokenExchangeResponse {
  access_token: string;
  expires_in: number;
}

interface MediaOperationResponse {
  id: string;
}

interface MetricsResponse {
  like_count?: number;
  comments_count?: number;
  reach?: number;
  impressions?: number;
  timestamp?: string;
}

interface CommentsListResponse {
  data: Array<{
    id: string;
    text: string;
    username: string;
    timestamp: string;
  }>;
}

interface InstagramApiErrorData {
  error?: {
    code?: number;
    message?: string;
  };
}

export class InstagramService {
  private baseUrl = 'https://graph.facebook.com/v21.0';
  private token: InstagramToken;
  private metricsCache: Map<string, { data: InstagramMetrics; timestamp: number }>;
  private readonly cacheTtlMs = 15 * 60 * 1000; // 15 minutes

  constructor() {
    const config = getConfig();
    this.token = {
      accessToken: config.accessToken,
      expiresAt: new Date(0), // unknown expiry — will trigger refresh on first use
    };
    this.metricsCache = new Map();
  }

  // ========================================
  // TOKEN MANAGEMENT (2.1)
  // ========================================

  /**
   * Ensure the stored token is valid (≥ 7 days to expiry).
   * Refreshes automatically if the token is close to expiry or unknown.
   */
  async ensureValidToken(): Promise<void> {
    const expiresAt = new Date(this.token.expiresAt);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (expiresAt.getTime() === 0 || expiresAt < sevenDaysFromNow) {
      await this.refreshToken();
    }
  }

  /**
   * Exchange a short-lived (1-hour) token for a long-lived (60-day) token.
   * Returns the new token and updates internal state.
   */
  async exchangeToken(shortLivedToken: string): Promise<InstagramToken> {
    const config = getConfig();
    try {
      const response = await axios.get<TokenExchangeResponse>(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.appId,
          client_secret: config.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      const { access_token, expires_in } = response.data;
      const token: InstagramToken = {
        accessToken: access_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      };

      this.token = token;
      return token;
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const message = apiError?.error?.message || 'Token exchange failed';
        throw new Error(`AuthError: ${message}`);
      }
      throw new Error('AuthError: Token exchange failed — network error');
    }
  }

  /**
   * Refresh the current long-lived token via Meta's OAuth endpoint.
   * Updates internal token state with new access token and expiry.
   */
  async refreshToken(): Promise<void> {
    const config = getConfig();
    try {
      const response = await axios.get<TokenExchangeResponse>(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.appId,
          client_secret: config.appSecret,
          fb_exchange_token: this.token.accessToken,
        },
      });

      const { access_token, expires_in } = response.data;
      this.token = {
        accessToken: access_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      };

      console.log('Instagram token refreshed — expires in', expires_in, 'seconds');
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const code = apiError?.error?.code;
        const message = apiError?.error?.message || 'Token refresh failed';
        if (code === 190) {
          throw new Error('ExpiredTokenError: Token is expired and cannot be refreshed');
        }
        throw new Error(`AuthError: ${message}`);
      }
      throw new Error('ExpiredTokenError: Token refresh failed — network error');
    }
  }

  // ========================================
  // MEDIA & PUBLISH (2.2)
  // ========================================

  /**
   * Upload a media file to Instagram via POST /{ig-user-id}/media.
   * Returns a container ID that can be used to publish the post.
   */
  async uploadMedia(imageUrl: string, caption: string): Promise<string> {
    await this.ensureValidToken();
    const config = getConfig();

    try {
      const response = await axios.post<MediaOperationResponse>(`${this.baseUrl}/${config.businessId}/media`, {
        image_url: imageUrl,
        caption,
        access_token: this.token.accessToken,
      });

      return response.data.id;
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const message = apiError?.error?.message || 'Media upload failed';
        throw new Error(`ValidationError: ${message}`);
      }
      throw new Error('ValidationError: Media upload failed — network error');
    }
  }

  /**
   * Publish a media container via POST /{ig-user-id}/media_publish.
   * Returns the published Instagram post ID.
   */
  async publishPost(containerId: string): Promise<string> {
    await this.ensureValidToken();
    const config = getConfig();

    try {
      const response = await axios.post<MediaOperationResponse>(`${this.baseUrl}/${config.businessId}/media_publish`, {
        creation_id: containerId,
        access_token: this.token.accessToken,
      });

      return response.data.id;
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const code = apiError?.error?.code;
        const message = apiError?.error?.message || 'Publish failed';
        if (code === 4 || code === 17) {
          throw new Error(`RateLimitError: ${message}`);
        }
        throw new Error(`ValidationError: ${message}`);
      }
      throw new Error('ValidationError: Publish failed — network error');
    }
  }

  // ========================================
  // METRICS (2.3)
  // ========================================

  /**
   * Fetch like_count, comments_count, reach, and impressions for a post.
   * Results are cached in-memory for 15 minutes to conserve API quota.
   * When period is specified, includes timestamp-based period filtering.
   */
  async getMetrics(instagramPostId: string, period: string = 'all'): Promise<InstagramMetrics> {
    // Check cache first — keyed by post + period
    const cacheKey = `${instagramPostId}:${period}`;
    const cached = this.metricsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    await this.ensureValidToken();

    try {
      const response = await axios.get<MetricsResponse>(`${this.baseUrl}/${instagramPostId}`, {
        params: {
          fields: 'like_count,comments_count,reach,impressions,timestamp',
          access_token: this.token.accessToken,
        },
      });

      const { like_count, comments_count, reach, impressions, timestamp } = response.data;

      // Period-based filtering
      if (period !== 'all' && timestamp) {
        const postDate = new Date(timestamp);
        const now = Date.now();
        const cutoffMs = period === '30d'
          ? 30 * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000;

        if (postDate.getTime() < now - cutoffMs) {
          const emptyMetrics: InstagramMetrics = {
            likeCount: 0,
            commentCount: 0,
            reach: 0,
            impressions: 0,
            timestamp,
          };
          this.metricsCache.set(cacheKey, { data: emptyMetrics, timestamp: Date.now() });
          return emptyMetrics;
        }
      }

      const metrics: InstagramMetrics = {
        likeCount: like_count ?? 0,
        commentCount: comments_count ?? 0,
        reach: reach ?? 0,
        impressions: impressions ?? 0,
        timestamp: timestamp ?? undefined,
      };

      // Update cache — keyed by post + period
      this.metricsCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now(),
      });

      return metrics;
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const code = apiError?.error?.code;
        const message = apiError?.error?.message || 'Metrics fetch failed';
        if (code === 100) {
          throw new Error(`NotFoundError: Post no longer available — ${message}`);
        }
        throw new Error(`ValidationError: ${message}`);
      }
      throw new Error('ValidationError: Metrics fetch failed — network error');
    }
  }

  // ========================================
  // COMMENTS (2.4)
  // ========================================

  /**
   * Fetch comments for a given Instagram post.
   */
  async getComments(instagramPostId: string): Promise<InstagramComment[]> {
    await this.ensureValidToken();

    try {
      const response = await axios.get<CommentsListResponse>(`${this.baseUrl}/${instagramPostId}/comments`, {
        params: {
          fields: 'text,username,timestamp',
          access_token: this.token.accessToken,
        },
      });

      return (response.data.data || []).map((c) => ({
        id: c.id,
        text: c.text,
        username: c.username,
        timestamp: c.timestamp,
      }));
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const message = apiError?.error?.message || 'Comments fetch failed';
        throw new Error(`ValidationError: ${message}`);
      }
      throw new Error('ValidationError: Comments fetch failed — network error');
    }
  }

  /**
   * Reply to a comment on an Instagram post.
   */
  async replyToComment(commentId: string, text: string): Promise<void> {
    await this.ensureValidToken();

    try {
      await axios.post(`${this.baseUrl}/${commentId}/replies`, {
        message: text,
        access_token: this.token.accessToken,
      });
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const code = apiError?.error?.code;
        const message = apiError?.error?.message || 'Reply failed';
        if (code === 100) {
          throw new Error(`NotFoundError: ${message}`);
        }
        throw new Error(`ValidationError: ${message}`);
      }
      throw new Error('ValidationError: Reply failed — network error');
    }
  }

  /**
   * Hide a comment on an Instagram post.
   */
  async hideComment(commentId: string): Promise<void> {
    await this.ensureValidToken();

    try {
      await axios.post(`${this.baseUrl}/${commentId}/hide`, {
        access_token: this.token.accessToken,
      });
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const message = apiError?.error?.message || 'Hide failed';
        throw new Error(`ValidationError: ${message}`);
      }
      throw new Error('ValidationError: Hide failed — network error');
    }
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Verifica el token de verificación del webhook (Meta handshake).
   * Retorna el challenge si el token coincide, o null si no.
   */
  verifyWebhookToken(token: string): string | null {
    const config = getConfig();
    if (token === config.webhookVerifyToken) {
      return token; // Meta espera devolver el mismo challenge
    }
    return null;
  }

  /**
   * Procesa una notificación de webhook entrante y extrae
   * un mensaje legible para reenviar a Telegram.
   * Retorna null si no hay nada que notificar.
   */
  processWebhookNotification(payload: InstagramWebhookNotification): string | null {
    if (payload.object !== 'instagram') return null;

    const messages: string[] = [];

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        switch (change.field) {
          case 'comments': {
            const text = (value as any)?.text as string | undefined;
            const username = (value as any)?.username as string | undefined;
            const mediaId = (value as any)?.media_id as string | undefined;

            if (text && username) {
              messages.push(
                `💬 *Nuevo comentario en Instagram*\n` +
                `👤 ${username}: _${text}_` +
                (mediaId ? `\n📷 Post: ${mediaId}` : ''),
              );
            }
            break;
          }

          case 'messaging': {
            const messageText = (value as any)?.message as string | undefined;
            const senderName = (value as any)?.sender_name as string | undefined;

            if (messageText && senderName) {
              messages.push(
                `✉️ *Nuevo mensaje en Instagram*\n` +
                `👤 ${senderName}: _${messageText}_`,
              );
            }
            break;
          }

          default:
            break;
        }
      }
    }

    return messages.length > 0 ? messages.join('\n\n') : null;
  }

  /**
   * Unhide a previously hidden comment on an Instagram post.
   */
  async unhideComment(commentId: string): Promise<void> {
    await this.ensureValidToken();

    try {
      await axios.post(`${this.baseUrl}/${commentId}/unhide`, {
        access_token: this.token.accessToken,
      });
    } catch (error) {
      if (axios.isAxiosError<InstagramApiErrorData>(error) && error.response) {
        const apiError = error.response.data;
        const message = apiError?.error?.message || 'Unhide failed';
        throw new Error(`ValidationError: ${message}`);
      }
      throw new Error('ValidationError: Unhide failed — network error');
    }
  }
}
