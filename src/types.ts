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
  category: 'Politics' | 'Crypto' | 'Sports' | 'Entertainment';
  probability: number;
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
