import { User, Video, Market, Product } from './types';

export const mockUser: User = {
  id: 'u1',
  username: 'AlexStream',
  avatar: 'https://picsum.photos/seed/user1/200/200',
  isVerified: true,
  followers: 12500,
  following: 450,
  balance: 1540.50,
  bio: 'Full-time creator and prediction enthusiast. 🚀'
};

export const mockVideos: Video[] = [
  {
    id: 'v1',
    title: 'Testing the 2026 Crypto Market Prediction',
    description: 'Will BTC hit $200k by end of year?',
    thumbnail: 'https://picsum.photos/seed/crypto/1920/1080',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    creator: mockUser,
    views: 45200,
    likes: 3200,
    comments: 154,
    duration: 120,
    type: 'long',
    createdAt: '2 hours ago',
    betEvents: [
      {
        id: 'b1',
        timestamp: 45,
        question: 'Will Bitcoin hit $75k in the next hour?',
        totalPool: 5000,
        status: 'active',
        options: [
          { id: 'o1', label: 'Yes', odds: 1.8, probability: 55 },
          { id: 'o2', label: 'No', odds: 2.2, probability: 45 }
        ]
      }
    ]
  },
  {
    id: 'v2',
    title: 'World Cup Final Prediction!',
    description: 'Quick takes on the final match.',
    thumbnail: 'https://picsum.photos/seed/football/1080/1920',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    creator: { ...mockUser, username: 'GoatSports' },
    views: 120000,
    likes: 9500,
    comments: 840,
    duration: 15,
    type: 'short',
    createdAt: '5 hours ago'
  },
  {
    id: 'v3',
    title: 'Top 10 Secret Travel Spots',
    description: 'Hidden gems you must visit.',
    thumbnail: 'https://picsum.photos/seed/travel/1920/1080',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    creator: mockUser,
    views: 25000,
    likes: 1200,
    comments: 45,
    duration: 600,
    type: 'long',
    createdAt: '1 day ago'
  }
];

export const mockMarkets: Market[] = [
  {
    id: 'm1',
    title: 'Will AI surpass human coding by 2027?',
    category: 'Crypto',
    probability: 68,
    volume: 1250000,
    endDate: 'Dec 31, 2026',
    image: 'https://picsum.photos/seed/ai/400/200'
  },
  {
    id: 'm2',
    title: 'Next Mars Mission Launch Date',
    category: 'Crypto',
    probability: 42,
    volume: 850000,
    endDate: 'Nov 15, 2026',
    image: 'https://picsum.photos/seed/space/400/200'
  }
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'VPULSE Elite Hoodie',
    price: 45.00,
    image: 'https://picsum.photos/seed/hoodie/400/400',
    category: 'Apparel'
  },
  {
    id: 'p2',
    name: 'Creator Glow Kit',
    price: 120.00,
    image: 'https://picsum.photos/seed/lights/400/400',
    category: 'Gear'
  }
];
