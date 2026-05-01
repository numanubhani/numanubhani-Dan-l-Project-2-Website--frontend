import React, { useEffect, useState } from 'react';
import { VideoCard, ReelCard } from '../components/common/VideoCard';
import { MarketCard } from '../components/common/MarketCard';
import { mockVideos, mockMarkets } from '../mockData';
import { TrendingUp, ChevronRight, Play, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const Home = () => {
  const shorts = mockVideos.filter(v => v.type === 'short');
  const longVideos = mockVideos.filter(v => v.type === 'long');
  const [liveStreams, setLiveStreams] = useState<any[]>([]);

  useEffect(() => {
    const loadLiveStreams = async () => {
      try {
        const response = await api.get('/streams/live/');
        setLiveStreams(response.data || []);
      } catch (error) {
        setLiveStreams([]);
      }
    };
    loadLiveStreams();
  }, []);

  return (
    <div className="space-y-12 py-6 px-4 lg:px-10 max-w-[1600px] mx-auto">
      {liveStreams.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-black tracking-tighter uppercase text-white italic flex items-center gap-3">
              <Play className="h-5 w-5 text-neon-pink" />
              LIVE NOW
            </h2>
            <Link to="/live" className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">VIEW ALL</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {liveStreams.slice(0, 6).map((stream) => (
              <Link key={stream.stream_key} to={`/channel/${stream.username}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-neon-cyan/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-widest">Live</span>
                  <span className="text-[10px] text-zinc-400 font-black uppercase">{stream.viewer_count || 0} watching</span>
                </div>
                <p className="text-sm font-black uppercase text-white line-clamp-2">{stream.title}</p>
                <p className="text-[10px] text-neon-cyan mt-2 font-black uppercase">@{stream.username}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Shorts Rail */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.3)] text-black">
               <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase text-white italic">Shorts Feed</h2>
          </div>
          <button className="flex items-center gap-2 text-[10px] font-black text-neon-cyan hover:brightness-110 transition-all uppercase tracking-[0.2em]">
            VIEW ALL <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="no-scrollbar flex gap-6 overflow-x-auto pb-6 scroll-smooth">
          {shorts.map(video => (
            <ReelCard key={video.id} video={video} />
          ))}
          {shorts.map(video => (
            <ReelCard key={`dup-${video.id}`} video={video} />
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-16">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
             <h2 className="text-xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
               <Zap className="h-5 w-5 text-neon-purple animate-pulse" />
               TRENDING VIDEOS
             </h2>
             <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {['SYNCED', 'CRYPTO', 'TACTICAL', 'MACRO'].map(cat => (
                  <button key={cat} className="home-tag-chip rounded-xl bg-white/5 px-6 py-2 text-[10px] font-black text-zinc-500 hover:text-white hover:bg-white/10 transition-all border border-white/5 uppercase tracking-widest whitespace-nowrap">
                    {cat}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {[...longVideos, ...longVideos, ...longVideos].map((video, i) => (
              <VideoCard key={`${video.id}-${i}`} video={video} />
            ))}
          </div>
        </div>

        {/* Sidebar Prediction Markets */}
        <aside className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-2">LIVE MARKETS // ACTIVE</h2>
            
            <div className="space-y-6">
              {mockMarkets.map(market => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="h-10 w-10 rounded-xl bg-neon-purple flex items-center justify-center text-white shadow-lg">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">ELEVATE PULSE</h3>
                <p className="text-xs text-zinc-500 font-bold leading-relaxed tracking-tight uppercase">DEPLOY PRO MEMBERSHIP TO ELIMINATE TRADING FEES AND ACCESS CLASSIFIED ANALYTICS.</p>
              </div>
              <button className="w-full rounded-2xl bg-white text-black py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-90 active:scale-95 shadow-xl">
                UPGRADE PROTOCOL
              </button>
            </div>
            
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 blur-[50px]" />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;
