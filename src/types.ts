export type VideoType = 'short' | 'long' | 'live';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;        // mapped from avatar_url by AuthContext
  avatar_url?: string;   // raw field from backend
  role: 'VIEWER' | 'CREATOR' | 'ADMIN';
  balance: number;
  bio?: string;
  location?: string;
  website?: string;
  date_joined?: string;
  date_of_birth?: string;
  // computed fields from UserProfileSerializer
  followers_count?: number;
  following_count?: number;
  videos_count?: number;
  is_following?: boolean;
  // kept for UI compatibility
  isVerified?: boolean;
  isLive?: boolean;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  creator: User;
  views: number;
  likes: number;
  comments: number;
  duration: number;
  type: VideoType;
  createdAt: string;
  betEvents?: BetEvent[];
}

export interface BetEvent {
  id: string;
  timestamp: number; // seconds in video
  question: string;
  options: {
    id: string;
    label: string;
    odds: number;
    probability: number; // 0-100
  }[];
  totalPool: number;
  status: 'active' | 'resolved' | 'cancelled';
}

export interface Market {
  id: string;
  title: string;
  category: 'Politics' | 'Crypto' | 'Sports' | 'Gaming' | 'Entertainment';
  /** Tallies drive YES/NO % on the card (see marketYieldFromVotes). */
  votesYes: number;
  votesNo: number;
  /** Custom text on the outcome buttons; falls back to “Vote YES” / “Vote NO” if empty. */
  buttonLabelYes: string;
  buttonLabelNo: string;
  /** Current user's vote on this market (from API when authenticated); locks buttons after voting. */
  userVote?: 'yes' | 'no' | null;
  volume: number;
  endDate: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

/** Marketplace listing from API (`/shop/items/`) */
export interface ShopItem {
  id: string;
  seller: string;
  seller_name?: string;
  seller_username?: string;
  title: string;
  description: string;
  category: string;
  stock: number;
  price: number;
  image_url: string;
  status: string;
  created_at?: string;
}

export interface ShopPurchaseRow {
  id: string;
  shop_item: string;
  title: string;
  category: string;
  image_url: string;
  seller_username: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
  /** Snapshot from checkout (same on each line item in one order). */
  shipping_snapshot?: Record<string, string>;
}

// ─── Event Feed Types ────────────────────────────────────────────────────────

export interface ChallengeEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  creator: string; // UUID
  creator_name: string;
  creator_username: string;
  creator_avatar: string;
  pool_amount: number;
  sponsor_count: number;
  yes_amount: number;
  no_amount: number;
  yes_pct: number;
  no_pct: number;
  status: 'open' | 'completed' | 'cancelled';
  end_date: string;
  image: string;
  user_sponsored: { amount: number; side: 'yes' | 'no' | 'sponsor' } | null;
  created_at: string;
}

export interface PredictionFeedItem {
  id: string;
  title: string;
  category: string;
  votesYes: number;
  votesNo: number;
  buttonLabelYes: string;
  buttonLabelNo: string;
  volume: number;
  endDate: string;
  image: string;
  userVote: 'yes' | 'no' | null;
  yes_pct: number;
  no_pct: number;
  pool_amount: number;
}

export type FeedEventType = 'challenge' | 'prediction';

export interface FeedEvent {
  type: FeedEventType;
  data: ChallengeEvent | PredictionFeedItem;
}
