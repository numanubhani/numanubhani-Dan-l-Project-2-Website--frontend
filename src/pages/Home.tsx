import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { VideoCard, ReelCard } from '../components/common/VideoCard';
import { MarketCard } from '../components/common/MarketCard';
import { TrendingUp, ChevronRight, Play, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { fetchMarkets, voteMarket } from '../services/predictionMarkets';
import type { Market } from '../types';
import { toast } from 'sonner';

const Home = () => {
  const [feedVideos, setFeedVideos] = useState<unknown[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [sidebarMarkets, setSidebarMarkets] = useState<Market[]>([]);

  useEffect(() => {
    const loadHomeData = async () => {
      const [streamsRes, feedRes] = await Promise.allSettled([
        api.get('/streams/live/'),
        api.get('/videos/feed/'),
      ]);
      if (streamsRes.status === 'fulfilled') {
        setLiveStreams(streamsRes.value.data || []);
      } else {
        setLiveStreams([]);
      }
      if (feedRes.status === 'fulfilled') {
        const rows = feedRes.value.data;
        setFeedVideos(Array.isArray(rows) ? rows : []);
      } else {
        setFeedVideos([]);
      }
      setFeedLoading(false);
    };
    loadHomeData();
  }, []);

  const { shorts, longVideos } = useMemo(() => {
    const rows = feedVideos as {
      video_type?: string;
      is_live?: boolean;
    }[];
    const shorts = rows.filter((v) => v.video_type === 'short' && !v.is_live);
    const longVideos = rows.filter((v) => v.video_type === 'long' && !v.is_live);
    return { shorts, longVideos };
  }, [feedVideos]);

  const loadSidebarMarkets = useCallback(async () => {
    try {
      const list = await fetchMarkets({ limit: 6 });
      setSidebarMarkets(list);
    } catch {
      setSidebarMarkets([]);
    }
  }, []);

  useEffect(() => {
    loadSidebarMarkets();
  }, [loadSidebarMarkets]);

  const registerVote = async (marketId: string, side: 'yes' | 'no') => {
    try {
      const updated = await voteMarket(marketId, side);
      setSidebarMarkets((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (e: unknown) {
      const st = (e as { response?: { status?: number } }).response?.status;
      if (st === 400) {
        await loadSidebarMarkets();
        toast.message('Already voted', {
          description: 'Each account gets one vote per market.',
        });
        return;
      }
      toast.error('Sign in to vote', { description: 'Log in to record your vote.' });
    }
  };

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
          <Link
            to="/reel"
            className="flex items-center gap-2 text-[10px] font-black text-neon-cyan hover:brightness-110 transition-all uppercase tracking-[0.2em]"
          >
            VIEW ALL <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="no-scrollbar flex gap-6 overflow-x-auto pb-6 scroll-smooth">
          {feedLoading ? (
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-10">Loading shorts…</p>
          ) : shorts.length === 0 ? (
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-10">No shorts yet. Upload a short or check back soon.</p>
          ) : (
            shorts.map((video) => <ReelCard key={String((video as { id?: string }).id)} video={video as any} />)
          )}
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
          
          <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {feedLoading ? (
              <p className="col-span-full text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-10">
                Loading videos…
              </p>
            ) : longVideos.length === 0 ? (
              <p className="col-span-full text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-10">
                No long-form uploads in the feed yet.
              </p>
            ) : (
              longVideos.map((video) => (
                <VideoCard key={String((video as { id?: string }).id)} video={video as any} />
              ))
            )}
          </div>
        </div>

        {/* Sidebar Prediction Markets */}
        <aside className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-2">LIVE MARKETS // ACTIVE</h2>
            
            {sidebarMarkets.length > 0 ? (
              <div className="space-y-6">
                {sidebarMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    onVote={(side) => registerVote(market.id, side)}
                  />
                ))}
                <Link
                  to="/polymarket"
                  className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-white/10 py-2.5 text-[10px] font-black uppercase tracking-widest text-cyan-vpulse transition-colors hover:bg-white/5"
                >
                  All markets
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center">
                <p className="text-xs font-bold text-zinc-500">No live markets in this feed.</p>
                <Link
                  to="/polymarket"
                  className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-vpulse hover:underline"
                >
                  Open markets
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
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
