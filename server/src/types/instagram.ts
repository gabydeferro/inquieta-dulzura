export interface InstagramToken {
  accessToken: string;
  expiresAt: Date;
}

export interface InstagramPostRecord {
  id: number;
  productId: number;
  instagramPostId: string;
  status: 'draft' | 'publishing' | 'published' | 'failed';
  caption: string;
  mediaUrl: string;
  publishedAt?: Date;
  errorMessage?: string;
}

export interface InstagramMetrics {
  likeCount: number;
  commentCount: number;
  reach: number;
  impressions: number;
  timestamp?: string;
}

export interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

export interface InstagramConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  businessId: string;
  configured: boolean;
}
