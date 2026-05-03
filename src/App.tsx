import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomAppToaster from '../components/ui/custom-toaster';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
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
import Signup from './pages/Signup';
import Studio from './pages/Studio';
import GoLive from './pages/GoLive';
import NotFound from './pages/NotFound';
import Search from './pages/Search';
import FollowingPage from './pages/Following';

import LiveFeed from './pages/LiveFeed';
import StreamSession from './pages/StreamSession';
import EventFeed from './pages/EventFeed';

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

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
      {/* Custom animated toasts + default sonner toasts */}
      <CustomAppToaster defaultPosition="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Signup />} />
          
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/home" element={<Layout><Home /></Layout>} />
          <Route path="/explore" element={<Layout><Explore /></Layout>} />
          <Route path="/search" element={<Layout><Search /></Layout>} />
          <Route path="/following" element={<Layout><FollowingPage /></Layout>} />
          <Route path="/shop" element={<Layout><Shop /></Layout>} />
          <Route path="/polymarket" element={<Layout><PredictionMarket /></Layout>} />
          <Route path="/market" element={<Navigate to="/polymarket" replace />} />
          
          <Route path="/live" element={<Layout><LiveFeed /></Layout>} />
          <Route path="/stream/start" element={<StreamSession />} />
          
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/:section" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/user/:id" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/user/:id/:section" element={<Layout><Profile /></Layout>} />
          <Route path="/channel/:username" element={<Layout><Profile /></Layout>} />
          <Route path="/channel/:username/:section" element={<Layout><Profile /></Layout>} />
          <Route path="/studio" element={<Layout><Studio /></Layout>} />
          <Route path="/go-live" element={<Layout><GoLive /></Layout>} />
          <Route path="/watch/:id" element={<Layout><Watch /></Layout>} />
          
          <Route path="/reel" element={<VerticalFeed />} />
          <Route path="/feed" element={<VerticalFeed />} />
          <Route path="/events" element={<EventFeed />} />
          
          <Route path="/creator" element={<Layout><CreatorDashboard /></Layout>} />
          <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
          
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
