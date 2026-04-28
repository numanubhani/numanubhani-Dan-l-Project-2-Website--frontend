import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/RootLayout';
import Home from './pages/Home';
import VerticalFeed from './pages/VerticalFeed';
import Watch from './pages/Watch';
import Profile from './pages/Profile';
import CreatorDashboard from './pages/CreatorDashboard';
import Explore from './pages/Explore';
import PredictionMarket from './pages/PredictionMarket';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Studio from './pages/Studio';

// Placeholder smaller routes
import { TrendingUp, Radio, Users } from 'lucide-react';
import LiveFeed from './pages/LiveFeed';
import StreamSession from './pages/StreamSession';

const AdminPanel = () => <div className="p-8 space-y-6">
  <h1 className="text-3xl font-black uppercase">Moderation Queue</h1>
  <div className="grid grid-cols-1 gap-4">
    {[1,2,3].map(i => (
      <div key={i} className="p-6 rounded-2xl bg-obsidian border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="h-12 w-20 bg-zinc-800 rounded-lg overflow-hidden"><img src={`https://picsum.photos/seed/a${i}/100/100`} className="h-full w-full object-cover" /></div>
           <div>
              <p className="font-bold">Potentially Sensitive Content #{i}</p>
              <p className="text-xs text-zinc-500">Reported for: Disinformation Pulse</p>
           </div>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold uppercase">Approve</button>
           <button className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold uppercase">Reject</button>
        </div>
      </div>
    ))}
  </div>
</div>;

// Placeholder smaller routes
const Following = () => {
  const followedCreators = [
    { name: 'KRYPTO_KING', handle: '@krypton', subscribers: '1.2M', image: 'https://picsum.photos/seed/krypto/200/200', isLive: true },
    { name: 'NEON_DREAMER', handle: '@neon.dream', subscribers: '850K', image: 'https://picsum.photos/seed/neon/200/200', isLive: false },
    { name: 'VOID_WALKER', handle: '@void', subscribers: '2.4M', image: 'https://picsum.photos/seed/void/200/200', isLive: true },
    { name: 'ALPHA_OMEGA', handle: '@alpha', subscribers: '500K', image: 'https://picsum.photos/seed/alpha/200/200', isLive: false },
  ];

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Your Inner Circle</h1>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Operatives you are currently tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {followedCreators.map((creator) => (
          <div key={creator.handle} className="following-card group relative rounded-[2rem] bg-white/5 border border-white/5 p-6 hover:border-neon-cyan/30 transition-all duration-500 hover:scale-[1.02]">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className={cn(
                  "h-24 w-24 rounded-[2rem] overflow-hidden border-2 transition-all duration-500 group-hover:rotate-6",
                  creator.isLive ? "border-neon-pink shadow-[0_0_20px_rgba(255,0,85,0.3)]" : "border-white/10"
                )}>
                  <img src={creator.image} alt={creator.name} className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                </div>
                {creator.isLive && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-neon-pink text-white text-[8px] font-black rounded-lg uppercase tracking-widest shadow-xl">
                    LIVE
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-white tracking-widest uppercase italic">{creator.name}</h3>
                <p className="text-[10px] text-zinc-500 font-bold font-mono">{creator.handle}</p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                <Users className="h-3 w-3 text-neon-cyan" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{creator.subscribers}</span>
              </div>

              <button className="w-full py-3 rounded-xl bg-white/5 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all">
                View Intelligence
              </button>
            </div>
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      <div className="p-10 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-zinc-700 text-center space-y-4">
        <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5"><Radio className="h-8 w-8" /></div>
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest">Expansion Protocol Ready</p>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Discover new creators to expand your grid awareness.</p>
        </div>
      </div>
    </div>
  );
};

// Helper for App.tsx
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/home" element={<Layout><Home /></Layout>} />
          <Route path="/explore" element={<Layout><Explore /></Layout>} />
          <Route path="/following" element={<Layout><Following /></Layout>} />
          <Route path="/shop" element={<Layout><Shop /></Layout>} />
          <Route path="/polymarket" element={<Layout><PredictionMarket /></Layout>} />
          <Route path="/market" element={<Navigate to="/polymarket" replace />} />
          
          <Route path="/live" element={<Layout><LiveFeed /></Layout>} />
          <Route path="/stream/start" element={<StreamSession />} />
          
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/:section" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/user/:id" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/user/:id/:section" element={<Layout><Profile /></Layout>} />
          <Route path="/studio" element={<Layout><Studio /></Layout>} />
          <Route path="/watch/:id" element={<Layout><Watch /></Layout>} />
          
          <Route path="/reel" element={<VerticalFeed />} />
          <Route path="/feed" element={<VerticalFeed />} />
          
          <Route path="/creator" element={<Layout><CreatorDashboard /></Layout>} />
          <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
