export interface InstagramPost {
  id: number;
  productId: number;
  instagramPostId: string;
  status: 'draft' | 'publishing' | 'published' | 'failed';
  caption: string;
  mediaUrl: string;
  publishedAt?: string;
  errorMessage?: string;
}

export interface InstagramMetrics {
  likeCount: number;
  commentCount: number;
  reach: number;
  impressions: number;
}

export interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}
