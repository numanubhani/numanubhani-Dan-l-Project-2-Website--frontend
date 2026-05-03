import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Search,
  Zap,
  Globe,
} from 'lucide-react';
import { VideoCard, ReelCard } from '../components/common/VideoCard';
import { api } from '../services/api';

type ApiVideo = Record<string, unknown> & {
  id?: string;
  video_type?: string;
  is_live?: boolean;
  title?: string;
  description?: string;
};

const categories = ['All', 'Gaming', 'Tech', 'Crypto', 'Politics', 'Sports', 'AI', 'Music'] as const;

function videoHaystack(v: ApiVideo): string {
  return `${String(v.title || '')} ${String(v.description || '')}`.toLowerCase();
}

function matchesCategory(cat: (typeof categories)[number], video: ApiVideo): boolean {
  if (cat === 'All') return true;
  const h = videoHaystack(video);
  if (cat === 'AI') {
    if (/\b(ai|ml|llm)\b/.test(h)) return true;
    const phrases = [
      'machine learning',
      'artificial intelligence',
      'chatgpt',
      'openai',
      'neural',
      'deep learning',
      'generative',
    ];
    return phrases.some((p) => h.includes(p));
  }
  const map: Record<string, readonly string[]> = {
    Gaming: ['gaming', 'game', 'gamer', 'esports', 'twitch', 'fortnite'],
    Tech: ['tech', 'software', 'code', 'developer', 'programming', 'startup', 'engineer'],
    Crypto: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'defi', 'token'],
    Politics: ['politic', 'election', 'senate', 'congress', 'vote', 'government'],
    Sports: ['sport', 'football', 'basketball', 'soccer', 'nfl', 'nba', 'ufc'],
    Music: ['music', 'song', 'album', 'concert', 'artist', 'band'],
  };
  const words = map[cat];
  return words.some((w) => h.includes(w));
}

function isShortReel(v: ApiVideo): boolean {
  return v.video_type === 'short' && !v.is_live;
}

function isLongForm(v: ApiVideo): boolean {
  return v.video_type === 'long' && !v.is_live;
}

const Explore = () => {
  const [activeCategory, setActiveCategory] =
    useState<(typeof categories)[number]>('All');
  const [feedVideos, setFeedVideos] = useState<ApiVideo[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [searchGridVideos, setSearchGridVideos] = useState<ApiVideo[] | undefined>(undefined);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const res = await api.get<ApiVideo[]>('/videos/feed/');
        setFeedVideos(Array.isArray(res.data) ? res.data : []);
      } catch {
        setFeedVideos([]);
      } finally {
        setFeedLoading(false);
      }
    };
    loadFeed();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 450);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedQ.length < 2) {
      setSearchGridVideos(undefined);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    setSearchGridVideos([]);
    api
      .get<{ videos?: ApiVideo[] }>(`/search/?q=${encodeURIComponent(debouncedQ)}`)
      .then((res) => {
        if (!cancelled) setSearchGridVideos(Array.isArray(res.data.videos) ? res.data.videos : []);
      })
      .catch(() => {
        if (!cancelled) setSearchGridVideos([]);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  const shortsShelf = useMemo(() => feedVideos.filter(isShortReel), [feedVideos]);

  const gridLongVideos = useMemo(() => {
    const source =
      searchGridVideos !== undefined
        ? searchGridVideos
        : feedVideos;
    return source.filter(isLongForm).filter((v) => matchesCategory(activeCategory, v));
  }, [feedVideos, searchGridVideos, activeCategory]);

  const scanning = Boolean(debouncedQ.length >= 2 && searchLoading);
  const inSearchMode = debouncedQ.length >= 2;

  return (
    <div className="min-h-screen bg-void pb-20">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-10 space-y-14 sm:space-y-20">

        {/* Section 2: Velocity Streak (Shorts shelf) */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-neon-pink fill-neon-pink shadow-neon-pink" />
                <span className="text-[10px] font-black text-neon-pink uppercase tracking-[0.4em]">High-Velocity Feed</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter break-words">VELOCITY_STREAK</h2>
            </div>
            <Link
              to="/reel"
              className="self-start sm:self-auto text-[10px] font-black text-neon-pink uppercase tracking-widest hover:underline decoration-2 underline-offset-8"
            >
              VIEW_ALL_REELS
            </Link>
          </div>

          <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-6 sm:pb-8 no-scrollbar group/shelf">
            {feedLoading ? (
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-10">
                Loading reels…
              </p>
            ) : shortsShelf.length === 0 ? (
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-10">
                No shorts in the catalog yet.
              </p>
            ) : (
              shortsShelf.map((video) => (
                <ReelCard key={String(video.id)} video={video as any} />
              ))
            )}
          </div>
        </section>

        {/* Section 3: Global Data Grid */}
        <section className="space-y-10 pb-20">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 sm:gap-8 border-b border-white/5 pb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Encrypted Network Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter leading-none break-words">Global Data Grid</h2>
            </div>

            <div className="w-full xl:w-auto flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6 min-w-0">
              <div className="relative group w-full xl:w-96">
                <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-neon-cyan transition-colors" />
                <input
                  ref={searchInputRef}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="SEARCH VIDEOS…"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-neon-cyan/50 backdrop-blur-3xl transition-all"
                  aria-busy={scanning}
                />
                {scanning ? (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-neon-cyan">
                    Scanning…
                  </span>
                ) : null}
              </div>
              <div className="explore-tag-bar w-full xl:w-auto flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`explore-tag-chip px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,243,255,0.2)]'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!inSearchMode && activeCategory !== 'All' ? (
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Category chips filter titles and descriptions (videos are not tagged yet).
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 sm:gap-y-12">
            {(feedLoading && !inSearchMode) || (inSearchMode && searchLoading) ? (
              <p className="col-span-full text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-10">
                {inSearchMode ? 'Searching…' : 'Loading videos…'}
              </p>
            ) : gridLongVideos.length === 0 ? (
              <p className="col-span-full text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-10">
                {inSearchMode
                  ? 'No long-form hits for this scan. Try other words or clear search.'
                  : activeCategory !== 'All'
                    ? `Nothing matched “${activeCategory}” in titles or descriptions — try another tag.`
                    : 'No long-form uploads in the feed yet.'}
              </p>
            ) : (
              gridLongVideos.map((video) => (
                <VideoCard key={String(video.id)} video={video as any} />
              ))
            )}
          </div>

          {/* Deployment Footer */}
          <div className="flex flex-col items-center pt-14 sm:pt-24 space-y-8">
            <div className="h-px w-64 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/5 bg-white/5 backdrop-blur-3xl flex flex-col items-center text-center space-y-4 max-w-2xl w-full">
              <div className="h-16 w-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-neon-cyan" />
              </div>
              <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Transmission Expanded</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                You have reached the temporary perimeter of this sector. <br />
                Initiate deep scan to uncover additional classified transmissions.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => searchInputRef.current?.focus(), 350);
                }}
                className="mt-4 px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all active:scale-95"
              >
                INITIATE DEEP SCAN
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Explore;
