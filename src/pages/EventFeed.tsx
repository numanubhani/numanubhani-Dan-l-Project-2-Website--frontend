import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Bookmark, Bell, Plus, Home, Compass, Wallet, User, X, Volume2, VolumeX, UploadCloud, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { eventApi, fixUrl } from '../services/api';
import type { FeedEvent, ChallengeEvent, PredictionFeedItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';

const GRADIENTS = [
  'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#0d0221,#190d2e,#4a0f6e)',
  'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
  'linear-gradient(135deg,#16001e,#3d0038,#000000)',
];

const QUICK_AMOUNTS = [5, 10, 25, 50];

const CATEGORIES = ['Sports', 'Politics', 'Crypto', 'Gaming', 'Entertainment', 'Fitness', 'Other'];

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;

export default function EventFeed() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'challenge' | 'prediction'>('all');
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  
  // Sponsor/Vote Modal
  const [modal, setModal] = useState<FeedEvent | null>(null);
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [submitting, setSubmitting] = useState(false);
  const [muted, setMuted] = useState(true);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'challenge' | 'prediction'>('challenge');
  const [createForm, setCreateForm] = useState({
    title: '', description: '', category: 'Entertainment', endDate: '',
    buttonYes: 'Vote YES', buttonNo: 'Vote NO'
  });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createFilePreview, setCreateFilePreview] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const loadFeed = useCallback(async (type: 'all' | 'challenge' | 'prediction') => {
    setLoading(true);
    try {
      const param = type === 'all' ? '' : type;
      const res = await eventApi.getFeed(param);
      setFeed(res.data);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(filter); }, [filter, loadFeed]);

  // Handle Video Auto-play
  useEffect(() => {
    Object.values(videoRefs.current).forEach((video, i) => {
      if (video) {
        if (i === currentIndex) {
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, feed]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const h = e.currentTarget.clientHeight;
    setCurrentIndex(Math.round(e.currentTarget.scrollTop / h));
  };

  const openModal = (item: FeedEvent, defaultSide: 'yes'|'no' = 'yes') => { 
    if (!user) {
      toast.error("Please login to participate");
      return;
    }
    setModal(item); 
    setAmount(''); 
    setSide(defaultSide); 
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateFile(file);
      setCreateFilePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = async () => {
    if (!createForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreateSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', createForm.title);
      formData.append('category', createForm.category);
      if (createForm.endDate) formData.append('end_date', createForm.endDate);
      
      if (createFile) {
        if (createFile.type.startsWith('video/')) {
          formData.append('video_file', createFile);
        } else {
          formData.append('image', createFile);
        }
      }

      if (createTab === 'challenge') {
        formData.append('description', createForm.description);
        await eventApi.createChallenge(formData);
      } else {
        formData.append('button_label_yes', createForm.buttonYes);
        formData.append('button_label_no', createForm.buttonNo);
        await eventApi.createPrediction(formData);
      }
      
      toast.success('Event created successfully!');
      setCreateModalOpen(false);
      setCreateForm({ title: '', description: '', category: 'Entertainment', endDate: '', buttonYes: 'Vote YES', buttonNo: 'Vote NO' });
      setCreateFile(null);
      setCreateFilePreview('');
      loadFeed(filter);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create event');
    } finally {
      setCreateSubmitting(false);
    }
  };

  if (loading && feed.length === 0) {
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
          const videoSrc = fixUrl(d.video_file_url || d.video_url);

          return (
            <div key={id} className="relative snap-start flex-shrink-0" style={{ height: '100dvh', width: '100%' }}>
              {/* BG / VIDEO */}
              <div className="absolute inset-0" style={{ background: bg }}>
                {videoSrc ? (
                   <video 
                     ref={el => videoRefs.current[idx] = el}
                     src={videoSrc}
                     muted={muted}
                     loop
                     playsInline
                     className="absolute inset-0 w-full h-full object-cover opacity-90"
                   />
                ) : d.image ? (
                  <img src={fixUrl(d.image)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />
                ) : (
                  <>
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[80px] animate-pulse" style={{ background: isChallenge ? 'rgba(37,99,235,0.3)' : 'rgba(234,88,12,0.3)' }} />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[80px] animate-pulse" style={{ background: 'rgba(0,243,255,0.1)', animationDelay: '1s' }} />
                  </>
                )}
              </div>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,transparent 30%,transparent 50%,rgba(0,0,0,0.9) 100%)' }} />

              {/* BADGE */}
              <div className="absolute top-20 right-4 z-10">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg"
                  style={{ background: isChallenge ? 'rgba(37,99,235,0.9)' : 'rgba(234,88,12,0.9)', color: 'white', backdropFilter: 'blur(8px)' }}>
                  {isChallenge ? '⚡ CHALLENGE' : '🔮 PREDICTION'}
                </span>
              </div>

              {/* ACTION BAR (right side) */}
              <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setLiked(p => ({ ...p, [id]: !p[id] }))}
                    className="h-11 w-11 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
                    style={{ background: isLiked ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', border: isLiked ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    <Heart className="h-5 w-5" style={{ color: isLiked ? '#ef4444' : 'white', fill: isLiked ? '#ef4444' : 'none' }} />
                  </button>
                  <span className="text-white text-[9px] font-bold drop-shadow-md">{isLiked ? '1' : '0'}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button className="h-11 w-11 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    <MessageCircle className="h-5 w-5 text-white" />
                  </button>
                  <span className="text-white text-[9px] font-bold drop-shadow-md">0</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setBookmarked(p => ({ ...p, [id]: !p[id] }))}
                    className="h-11 w-11 rounded-full flex items-center justify-center transition-all shadow-lg"
                    style={{ background: isBookmarked ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.1)', border: isBookmarked ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    <Bookmark className="h-5 w-5" style={{ color: isBookmarked ? '#eab308' : 'white', fill: isBookmarked ? '#eab308' : 'none' }} />
                  </button>
                </div>
                <button onClick={() => { navigator.share?.({ title: d.title, url: window.location.href }).catch(() => toast.success('Link copied!')); }}
                  className="h-11 w-11 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                  <Share2 className="h-5 w-5 text-white" />
                </button>
                
                {videoSrc && (
                   <button onClick={() => setMuted(!muted)}
                     className="h-11 w-11 rounded-full flex items-center justify-center shadow-lg mt-2" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                     {muted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
                   </button>
                )}
              </div>

              {/* Feed position dots */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20 opacity-50">
                {feed.map((_, i) => (
                   <div key={i} className={`w-1 rounded-full transition-all ${i === currentIndex ? 'h-3 bg-white' : 'h-1 bg-white/40'}`} />
                ))}
              </div>

              {/* BOTTOM CONTENT */}
              <div className="absolute bottom-20 left-4 right-16 z-10 pb-4">
                {/* Creator */}
                <div className="flex items-center gap-2 mb-3">
                  <img src={creatorAvatar} alt={creatorName} className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-lg" />
                  <div className="flex flex-col">
                     <div className="flex items-center gap-1">
                       <p className="text-white text-sm font-bold leading-none drop-shadow-md">@{creatorUser}</p>
                       <div className="h-3 w-3 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">✓</div>
                     </div>
                     <p className="text-white/80 text-[10px] uppercase font-black tracking-widest mt-0.5 drop-shadow-md">{d.category}</p>
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-white font-black text-2xl leading-tight mb-4 drop-shadow-xl">{d.title}</h2>

                {/* Pool + Prob bar */}
                <div className="mb-4 p-3 rounded-2xl shadow-xl" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Pool</span>
                      <span className="text-white font-black text-sm">{fmt(pool)}</span>
                    </div>
                    {d.end_date && (
                       <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Ends {d.end_date}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-green-400 text-xs font-black w-9">{yPct}%</span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden shadow-inner" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${yPct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: idx === currentIndex ? 0.3 : 0 }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(to right,#22c55e,#00f3ff)' }}
                      />
                    </div>
                    <span className="text-red-400 text-xs font-black w-9 text-right">{nPct}%</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-2">
                   <button
                     onClick={() => openModal(item, 'yes')}
                     className="flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center leading-none"
                     style={{
                       background: 'rgba(34,197,94,0.15)',
                       border: '1px solid rgba(34,197,94,0.5)',
                       color: '#4ade80',
                       backdropFilter: 'blur(8px)'
                     }}
                   >
                     <span className="text-[10px] opacity-70 mb-1">{isChallenge ? 'Yes, they will' : d.buttonLabelYes || 'Vote Yes'}</span>
                     YES
                   </button>
                   <button
                     onClick={() => openModal(item, 'no')}
                     className="flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center leading-none"
                     style={{
                       background: 'rgba(239,68,68,0.15)',
                       border: '1px solid rgba(239,68,68,0.5)',
                       color: '#f87171',
                       backdropFilter: 'blur(8px)'
                     }}
                   >
                     <span className="text-[10px] opacity-70 mb-1">{isChallenge ? 'No way' : d.buttonLabelNo || 'Vote No'}</span>
                     NO
                   </button>
                </div>
              </div>
            </div>
          );
        })}
        {feed.length === 0 && !loading && (
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
          { icon: Plus, label: '', isCreate: true },
          { icon: Wallet, label: 'Wallet', path: '/profile' },
          { icon: User, label: 'Profile', path: '/profile' },
        ].map(({ icon: Icon, label, path, isCreate }, i) => (
          isCreate ? (
            <button key={i} onClick={() => setCreateModalOpen(true)} className="flex flex-col items-center gap-1 transition-all active:scale-90">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]" style={{ background: 'linear-gradient(135deg,#2563eb,#00f3ff)' }}>
                <Icon className="h-6 w-6 text-black" strokeWidth={3} />
              </div>
            </button>
          ) : (
            <Link key={path + label} to={path!}
              className="flex flex-col items-center gap-1 transition-all active:scale-90"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              <div className="p-2"><Icon className="h-5 w-5" /></div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </Link>
          )
        ))}
      </div>

      {/* CREATE EVENT MODAL */}
      <AnimatePresence>
        {createModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && setCreateModalOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full rounded-t-[32px] bg-[#09090b] border-t border-white/10 flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between p-6 pb-2 border-b border-white/5">
                <h3 className="text-xl font-black text-white tracking-tight">Create Event</h3>
                <button onClick={() => setCreateModalOpen(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex p-4 gap-2">
                 <button onClick={() => setCreateTab('challenge')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition", createTab === 'challenge' ? "bg-blue-600 text-white" : "bg-white/5 text-white/50")}>⚡ Challenge</button>
                 <button onClick={() => setCreateTab('prediction')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition", createTab === 'prediction' ? "bg-orange-600 text-white" : "bg-white/5 text-white/50")}>🔮 Prediction</button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Title</label>
                    <input type="text" value={createForm.title} onChange={e => setCreateForm(p=>({...p, title: e.target.value}))} placeholder={createTab === 'challenge' ? "e.g. I will do 100 pushups non-stop" : "e.g. Will Bitcoin hit $100k by Dec?"} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition" />
                 </div>
                 
                 {createTab === 'challenge' && (
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Description</label>
                      <textarea value={createForm.description} onChange={e => setCreateForm(p=>({...p, description: e.target.value}))} rows={3} placeholder="Provide details about the challenge..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition resize-none" />
                   </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Category</label>
                       <select value={createForm.category} onChange={e => setCreateForm(p=>({...p, category: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none appearance-none">
                         {CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">End Date (optional)</label>
                       <input type="text" value={createForm.endDate} onChange={e => setCreateForm(p=>({...p, endDate: e.target.value}))} placeholder="e.g. Dec 31, 2026" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition" />
                    </div>
                 </div>

                 {createTab === 'prediction' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">YES Label</label>
                         <input type="text" value={createForm.buttonYes} onChange={e => setCreateForm(p=>({...p, buttonYes: e.target.value}))} className="w-full bg-white/5 border border-green-500/30 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-green-500 transition" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">NO Label</label>
                         <input type="text" value={createForm.buttonNo} onChange={e => setCreateForm(p=>({...p, buttonNo: e.target.value}))} className="w-full bg-white/5 border border-red-500/30 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition" />
                      </div>
                    </div>
                 )}

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Media (Video / Image)</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition relative overflow-hidden">
                       {createFilePreview ? (
                          createFile?.type.startsWith('video/') ? (
                             <video src={createFilePreview} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                          ) : (
                             <img src={createFilePreview} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                          )
                       ) : (
                          <div className="flex flex-col items-center">
                            <UploadCloud className="h-8 w-8 text-white/40 mb-2" />
                            <span className="text-xs font-bold text-white/60">Upload Video or Image</span>
                          </div>
                       )}
                       <input type="file" accept="video/*,image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                 </div>
              </div>

              <div className="p-6 border-t border-white/5">
                 <button onClick={handleCreateSubmit} disabled={createSubmitting} className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 text-white"
                   style={{ background: createTab === 'challenge' ? 'linear-gradient(135deg,#2563eb,#00f3ff)' : 'linear-gradient(135deg,#ea580c,#f59e0b)' }}>
                   {createSubmitting ? 'Creating...' : `Publish ${createTab}`}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SPONSOR/VOTE MODAL */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full rounded-t-[32px] p-6 space-y-6"
              style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: modal.type === 'challenge' ? '#60a5fa' : '#fb923c' }}>
                    {modal.type === 'challenge' ? '⚡ Challenge Sponsor' : '🔮 Prediction Vote'}
                  </span>
                  <h3 className="text-white font-black text-lg mt-1 leading-snug">{(modal.data as any).title}</h3>
                </div>
                <button onClick={() => setModal(null)} className="p-2 rounded-full bg-white/10">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Pool info */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Pool</p>
                    <p className="text-white font-black text-xl">{fmt((modal.data as any).pool_amount ?? 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-xs font-black">YES {(modal.data as any).yes_pct ?? 50}%</p>
                    <p className="text-red-400 text-xs font-black">NO {(modal.data as any).no_pct ?? 50}%</p>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(modal.data as any).yes_pct ?? 50}%`, background: 'linear-gradient(to right,#22c55e,#00f3ff)' }} />
                </div>
              </div>

              {/* Yes/No selector */}
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-2">Select Side</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['yes', 'no'] as const).map(s => (
                    <button key={s} onClick={() => setSide(s)}
                      className="py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      style={{
                        background: side === s ? (s === 'yes' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.03)',
                        border: side === s ? (s === 'yes' ? '2px solid #22c55e' : '2px solid #ef4444') : '2px solid transparent',
                        color: side === s ? (s === 'yes' ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.5)',
                      }}>
                      <div className={cn("w-3 h-3 rounded-full border-2", side===s ? (s==='yes'?'border-green-400 bg-green-400':'border-red-400 bg-red-400') : "border-white/20")} />
                      {s === 'yes' ? 'YES' : 'NO'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                   <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Amount (USD)</p>
                   <p className="text-white/40 text-[10px] font-bold">Balance: {fmt(user?.balance || 0)}</p>
                </div>
                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black text-xl">$</span>
                  <input
                    type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-4 rounded-2xl text-white font-black text-xl outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>
                
                {/* Quick amounts */}
                <div className="flex gap-2">
                   {QUICK_AMOUNTS.map(amt => (
                      <button key={amt} onClick={() => setAmount(amt.toString())} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black transition border border-white/5">
                        +${amt}
                      </button>
                   ))}
                </div>
              </div>

              {/* Confirm */}
              <button onClick={handleConfirm} disabled={submitting || !amount || parseFloat(amount) <= 0}
                className="w-full mt-2 py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: modal.type === 'challenge' ? 'linear-gradient(135deg,#2563eb,#00f3ff)' : 'linear-gradient(135deg,#ea580c,#f59e0b)',
                  color: 'white',
                  boxShadow: modal.type === 'challenge' ? '0 0 30px rgba(37,99,235,0.3)' : '0 0 30px rgba(234,88,12,0.3)',
                }}>
                {submitting ? 'Processing…' : modal.type === 'challenge' ? '💰 Confirm Sponsor' : '🗳️ Confirm Vote'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
