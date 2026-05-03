import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Bookmark, Bell, Plus, Home, Compass, Wallet, User, X, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { eventApi, fixUrl } from '../services/api';
import type { FeedEvent, ChallengeEvent, PredictionFeedItem } from '../types';

const MOCK_FEED: FeedEvent[] = [
  {
    type: 'challenge',
    data: {
      id: 'mock-1', title: 'I will do 100 pushups non-stop 💪',
      description: 'Sponsor me to attempt 100 consecutive pushups live!',
      category: 'Fitness', creator: 'mock', creator_name: 'Alex Ryder',
      creator_username: 'alexryder', creator_avatar: 'https://i.pravatar.cc/150?img=11',
      pool_amount: 12400, sponsor_count: 147, yes_amount: 8200, no_amount: 4200,
      yes_pct: 66, no_pct: 34, status: 'open', end_date: 'May 10, 2026',
      image: '', user_sponsored: null, created_at: '',
    } as ChallengeEvent,
  },
  {
    type: 'prediction',
    data: {
      id: 'mock-2', title: 'Trump wins the 2026 midterm elections',
      category: 'Politics', votesYes: 6300, votesNo: 3700,
      buttonLabelYes: 'Vote YES', buttonLabelNo: 'Vote NO',
      volume: 18400, endDate: 'Nov 3, 2026', image: '',
      userVote: null, yes_pct: 63, no_pct: 37, pool_amount: 18400,
    } as PredictionFeedItem,
  },
  {
    type: 'prediction',
    data: {
      id: 'mock-3', title: 'Bitcoin reaches $200k before 2027 🚀',
      category: 'Crypto', votesYes: 4800, votesNo: 5200,
      buttonLabelYes: 'YES — Moon', buttonLabelNo: 'NO — Realistic',
      volume: 31000, endDate: 'Dec 31, 2026', image: '',
      userVote: null, yes_pct: 48, no_pct: 52, pool_amount: 31000,
    } as PredictionFeedItem,
  },
  {
    type: 'challenge',
    data: {
      id: 'mock-4', title: '24-hour gaming marathon — no breaks 🎮',
      description: 'Streaming non-stop for 24 hours.',
      category: 'Gaming', creator: 'mock', creator_name: 'StreamKing',
      creator_username: 'streamking', creator_avatar: 'https://i.pravatar.cc/150?img=15',
      pool_amount: 8900, sponsor_count: 213, yes_amount: 7100, no_amount: 1800,
      yes_pct: 80, no_pct: 20, status: 'open', end_date: 'May 20, 2026',
      image: '', user_sponsored: null, created_at: '',
    } as ChallengeEvent,
  },
];

const GRADIENTS = [
  'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#0d0221,#190d2e,#4a0f6e)',
  'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
  'linear-gradient(135deg,#16001e,#3d0038,#000000)',
];

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

export default function EventFeed() {
  const [filter, setFilter] = useState<'all' | 'challenge' | 'prediction'>('all');
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<FeedEvent | null>(null);
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadFeed = useCallback(async (type: 'all' | 'challenge' | 'prediction') => {
    setLoading(true);
    try {
      const param = type === 'all' ? '' : type;
      const res = await eventApi.getFeed(param);
      setFeed(res.data.length > 0 ? res.data : MOCK_FEED.filter(e => type === 'all' || e.type === type));
    } catch {
      setFeed(type === 'all' ? MOCK_FEED : MOCK_FEED.filter(e => e.type === type));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(filter); }, [filter, loadFeed]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const h = e.currentTarget.clientHeight;
    setCurrentIndex(Math.round(e.currentTarget.scrollTop / h));
  };

  const openModal = (item: FeedEvent) => { setModal(item); setAmount(''); setSide('yes'); };

  const handleConfirm = async () => {
    if (!modal) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      if (modal.type === 'challenge') {
        const ch = modal.data as ChallengeEvent;
        await eventApi.sponsorChallenge(ch.id, amt, side);
        toast.success('🎉 Sponsored successfully!');
      } else {
        const pm = modal.data as PredictionFeedItem;
        await eventApi.votePrediction(pm.id, side, amt);
        toast.success(`✅ Voted ${side.toUpperCase()} successfully!`);
      }
      setModal(null);
      loadFeed(filter);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="h-10 w-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* TOP NAV */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-4 pb-2" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.85),transparent)' }}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-black text-sm" style={{ background: 'linear-gradient(135deg,#00f3ff,#0080ff)' }}>V</div>
          <span className="text-white font-black text-lg tracking-tight">VPULSE</span>
        </div>
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-1">
          {(['all', 'challenge', 'prediction'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentIndex(0); }}
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              style={filter === f ? {
                background: f === 'challenge' ? '#2563eb' : f === 'prediction' ? '#ea580c' : 'white',
                color: 'black',
              } : { color: 'rgba(255,255,255,0.6)' }}
            >
              {f === 'all' ? 'All' : f === 'challenge' ? 'Challenges' : 'Predictions'}
            </button>
          ))}
        </div>
        <button className="relative p-2">
          <Bell className="h-5 w-5 text-white" />
          <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>

      {/* FEED */}
      <div ref={containerRef} className="flex-1 overflow-y-scroll snap-y snap-mandatory" style={{ scrollbarWidth: 'none' }} onScroll={handleScroll}>
        {feed.map((item, idx) => {
          const isChallenge = item.type === 'challenge';
          const d = item.data as any;
          const yPct = d.yes_pct ?? 50;
          const nPct = d.no_pct ?? 50;
          const pool = d.pool_amount ?? d.volume ?? 0;
          const creatorName = isChallenge ? d.creator_name : 'VPulse Markets';
          const creatorAvatar = fixUrl(isChallenge ? d.creator_avatar : 'https://i.pravatar.cc/150?img=5');
          const creatorUser = isChallenge ? d.creator_username : 'vpulse';
          const bg = GRADIENTS[idx % GRADIENTS.length];
          const id = d.id;
          const isLiked = liked[id];
          const isBookmarked = bookmarked[id];

          return (
            <div key={id} className="relative snap-start flex-shrink-0" style={{ height: '100dvh', width: '100%' }}>
              {/* BG */}
              <div className="absolute inset-0" style={{ background: bg }}>
                {d.image && (
                  <img src={fixUrl(d.image)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />
                )}
                {/* animated orbs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[80px] animate-pulse" style={{ background: isChallenge ? 'rgba(37,99,235,0.3)' : 'rgba(234,88,12,0.3)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[80px] animate-pulse" style={{ background: 'rgba(0,243,255,0.1)', animationDelay: '1s' }} />
              </div>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,transparent 30%,transparent 50%,rgba(0,0,0,0.8) 100%)' }} />

              {/* BADGE */}
              <div className="absolute top-20 right-4 z-10">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                  style={{ background: isChallenge ? 'rgba(37,99,235,0.9)' : 'rgba(234,88,12,0.9)', color: 'white', backdropFilter: 'blur(8px)' }}>
                  {isChallenge ? '⚡ CHALLENGE' : '🔮 PREDICTION'}
                </span>
              </div>

              {/* ACTION BAR (right side) */}
              <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setLiked(p => ({ ...p, [id]: !p[id] }))}
                    className="h-11 w-11 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ background: isLiked ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', border: isLiked ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)' }}>
                    <Heart className="h-5 w-5" style={{ color: isLiked ? '#ef4444' : 'white', fill: isLiked ? '#ef4444' : 'none' }} />
                  </button>
                  <span className="text-white text-[9px] font-bold">{isLiked ? '1' : '0'}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button className="h-11 w-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <MessageCircle className="h-5 w-5 text-white" />
                  </button>
                  <span className="text-white text-[9px] font-bold">0</span>
                </div>
                <button onClick={() => { navigator.share?.({ title: d.title, url: window.location.href }).catch(() => toast.success('Link copied!')); }}
                  className="h-11 w-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <Share2 className="h-5 w-5 text-white" />
                </button>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setBookmarked(p => ({ ...p, [id]: !p[id] }))}
                    className="h-11 w-11 rounded-full flex items-center justify-center transition-all"
                    style={{ background: isBookmarked ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.1)', border: isBookmarked ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.15)' }}>
                    <Bookmark className="h-5 w-5" style={{ color: isBookmarked ? '#eab308' : 'white', fill: isBookmarked ? '#eab308' : 'none' }} />
                  </button>
                </div>
              </div>

              {/* BOTTOM CONTENT */}
              <div className="absolute bottom-24 left-4 right-16 z-10">
                {/* Creator */}
                <div className="flex items-center gap-2 mb-3">
                  <img src={creatorAvatar} alt={creatorName} className="h-9 w-9 rounded-full object-cover border-2 border-white/20" />
                  <div>
                    <p className="text-white text-sm font-bold leading-none">@{creatorUser}</p>
                    <p className="text-white/60 text-xs mt-0.5">{d.category}</p>
                  </div>
                </div>
                {/* Title */}
                <h2 className="text-white font-black text-xl leading-tight mb-3 drop-shadow-lg">{d.title}</h2>

                {/* Pool + Prob bar */}
                <div className="mb-3 p-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Pool</span>
                    <span className="text-white font-black text-sm">{fmt(pool)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-400 text-xs font-black w-8">{yPct}%</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${yPct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: idx === currentIndex ? 0.3 : 0 }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(to right,#22c55e,#00f3ff)' }}
                      />
                    </div>
                    <span className="text-red-400 text-xs font-black w-8 text-right">{nPct}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span>YES</span><span>NO</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => openModal(item)}
                  className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    background: isChallenge ? 'linear-gradient(135deg,#2563eb,#00f3ff)' : 'linear-gradient(135deg,#ea580c,#f59e0b)',
                    color: 'white',
                    boxShadow: isChallenge ? '0 0 30px rgba(37,99,235,0.4)' : '0 0 30px rgba(234,88,12,0.4)',
                  }}
                >
                  {isChallenge ? '💰 Sponsor' : '🗳️ Vote & Sponsor'}
                </button>
              </div>

              {/* End date */}
              {d.end_date && (
                <div className="absolute top-20 left-4 z-10">
                  <span className="text-white/60 text-xs font-bold">Ends {d.end_date}</span>
                </div>
              )}
            </div>
          );
        })}
        {feed.length === 0 && (
          <div className="h-screen flex items-center justify-center">
            <p className="text-white/40 font-bold">No events found</p>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around px-4 py-3" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { icon: Home, label: 'Home', path: '/' },
          { icon: Compass, label: 'Explore', path: '/explore' },
          { icon: Plus, label: '', path: '/events', isCreate: true },
          { icon: Wallet, label: 'Wallet', path: '/profile' },
          { icon: User, label: 'Profile', path: '/profile' },
        ].map(({ icon: Icon, label, path, isCreate }) => (
          <Link key={path + label} to={path}
            className="flex flex-col items-center gap-1 transition-all active:scale-90"
            style={{ color: isCreate ? 'black' : 'rgba(255,255,255,0.5)' }}>
            {isCreate ? (
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#00f3ff)' }}>
                <Icon className="h-5 w-5 text-black" />
              </div>
            ) : (
              <>
                <div className="p-2"><Icon className="h-5 w-5" /></div>
                <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* SPONSOR/VOTE MODAL */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full rounded-t-3xl p-6 space-y-5"
              style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: modal.type === 'challenge' ? '#60a5fa' : '#fb923c' }}>
                    {modal.type === 'challenge' ? '⚡ Challenge Sponsor' : '🔮 Vote & Sponsor'}
                  </span>
                  <h3 className="text-white font-black text-base mt-1 leading-snug">{(modal.data as any).title}</h3>
                </div>
                <button onClick={() => setModal(null)} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Pool info */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50 font-bold">Total Pool</span>
                  <span className="text-white font-black">{fmt((modal.data as any).pool_amount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 font-bold">YES {(modal.data as any).yes_pct ?? 50}%</span>
                  <span className="text-red-400 font-bold">NO {(modal.data as any).no_pct ?? 50}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(modal.data as any).yes_pct ?? 50}%`, background: 'linear-gradient(to right,#22c55e,#00f3ff)' }} />
                </div>
              </div>

              {/* Yes/No selector */}
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
                  {modal.type === 'challenge' ? 'Do you think they\'ll succeed?' : 'Your prediction'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(['yes', 'no'] as const).map(s => (
                    <button key={s} onClick={() => setSide(s)}
                      className="py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                      style={{
                        background: side === s ? (s === 'yes' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.05)',
                        border: side === s ? (s === 'yes' ? '1px solid #22c55e' : '1px solid #ef4444') : '1px solid rgba(255,255,255,0.1)',
                        color: side === s ? (s === 'yes' ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.5)',
                      }}>
                      {s === 'yes' ? '✅ YES' : '❌ NO'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Sponsor Amount (USD)</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black text-lg">$</span>
                  <input
                    type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3.5 rounded-2xl text-white font-black text-lg outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>
              </div>

              {/* Fee breakdown */}
              {amount && parseFloat(amount) > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 space-y-2 text-sm"
                  style={{ background: 'rgba(0,243,255,0.04)', border: '1px solid rgba(0,243,255,0.15)' }}>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Fee Breakdown</p>
                  {[
                    { label: 'Platform fee', pct: 25, color: '#f87171' },
                    { label: 'Creator share', pct: 10, color: '#fb923c' },
                    { label: 'Your net share', pct: 65, color: '#4ade80', bold: true },
                  ].map(({ label, pct, color, bold }) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: bold ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: bold ? 900 : 600 }}>{label} ({pct}%)</span>
                      <span style={{ color, fontWeight: 900 }}>${((parseFloat(amount) * pct) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Confirm */}
              <button onClick={handleConfirm} disabled={submitting || !amount || parseFloat(amount) <= 0}
                className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: modal.type === 'challenge' ? 'linear-gradient(135deg,#2563eb,#00f3ff)' : 'linear-gradient(135deg,#ea580c,#f59e0b)',
                  color: 'white',
                  boxShadow: modal.type === 'challenge' ? '0 0 30px rgba(37,99,235,0.3)' : '0 0 30px rgba(234,88,12,0.3)',
                }}>
                {submitting ? 'Processing…' : modal.type === 'challenge' ? '💰 Confirm Sponsor' : '🗳️ Confirm Vote & Sponsor'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
