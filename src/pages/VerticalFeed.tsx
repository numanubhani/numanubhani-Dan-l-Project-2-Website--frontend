import React, { useState, useRef, useEffect, useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import {
  Heart,
  MessageCircle,
  TrendingUp,
  Volume2,
  VolumeX,
  ArrowLeft,
  X,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BetMarkerTimeline, maxAllowedTimeBeforeNextBet } from '../components/common/BetMarkerTimeline';
import { api, eventApi, fixUrl } from '../services/api';

const VerticalFeed = () => {
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedType, setFeedType] = useState<'foryou' | 'following' | 'events'>('foryou');
  const [isMuted, setIsMuted] = useState(true);

  const [betOverlay, setBetOverlay] = useState<{ videoId: string; markerId: string } | null>(null);
  const placedRef = useRef<Record<string, Set<string>>>({});
  const [, forcePlaybackTick] = useState(0);
  const bumpPlayback = () => forcePlaybackTick((x) => x + 1);

  const [reelTimeById, setReelTimeById] = useState<Record<string, number>>({});
  const [durationById, setDurationById] = useState<Record<string, number>>({});
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  const [stakeByMarker, setStakeByMarker] = useState<Record<string, string>>({});
  const [selectedOptionByMarker, setSelectedOptionByMarker] = useState<Record<string, string>>({});
  const [placingBetKey, setPlacingBetKey] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());
  
  // Event Modal State
  const [eventModal, setEventModal] = useState<any | null>(null);
  const [sponsorAmount, setSponsorAmount] = useState('');
  const [sponsorSide, setSponsorSide] = useState<'yes' | 'no'>('yes');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        let endpoint = '/videos/feed/?type=reels';
        if (feedType === 'events') {
          endpoint = '/events/feed/';
        } else if (feedType === 'following') {
          endpoint = '/videos/feed/?following=true';
        }

        const response = await api.get(endpoint);
        let data = response.data;

        // If foryou is empty, fallback to general feed
        if (feedType === 'foryou' && data.length === 0) {
          const fallback = await api.get('/videos/feed/');
          data = fallback.data;
        }

        setShorts(data);
        setCurrentIndex(0); // Reset to first item on type change
      } catch (err) {
        console.error('Failed to load feed', err);
        toast.error('Failed to load feed data.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [feedType]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const height = e.currentTarget.clientHeight;
    const newIndex = Math.round(e.currentTarget.scrollTop / height);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const currentVideo = shorts[currentIndex];

  const getPlaced = (videoId: string) => {
    if (!placedRef.current[videoId]) {
      placedRef.current[videoId] = new Set();
    }
    return placedRef.current[videoId];
  };

  const overlayMarker = useMemo(() => {
    if (!betOverlay || !currentVideo || betOverlay.videoId !== currentVideo.id) return null;
    const markers = Array.isArray(currentVideo.bet_markers) ? currentVideo.bet_markers : [];
    return markers.find((m: any) => String(m.id) === betOverlay.markerId) || null;
  }, [betOverlay, currentVideo]);

  const clampReelSeek = (videoId: string, el: HTMLVideoElement, markers: any[]) => {
    if (!markers.length) return;
    const placed = getPlaced(videoId);
    const maxT = maxAllowedTimeBeforeNextBet(
      markers.map((m: any) => ({ id: String(m.id), timestamp: Number(m.timestamp) || 0 })),
      placed
    );
    if (el.currentTime > maxT) {
      el.currentTime = maxT;
    }
  };

  const handleReelTimeUpdate = (video: any, index: number, el: HTMLVideoElement) => {
    if (index !== currentIndex) return;

    setReelTimeById((prev) => ({ ...prev, [video.id]: el.currentTime }));

    const markers = Array.isArray(video.bet_markers) ? video.bet_markers : [];
    clampReelSeek(video.id, el, markers);

    if (betOverlay?.videoId === video.id) {
      return;
    }

    const placed = getPlaced(video.id);
    const currentTime = el.currentTime;

    const nextMarker = markers.find((marker: any) => {
      if (!marker?.id || placed.has(String(marker.id))) return false;
      const triggerAt = Math.max(0, Number(marker.timestamp || 0) - 1);
      return currentTime >= triggerAt;
    });

    if (nextMarker) {
      el.pause();
      setBetOverlay({ videoId: video.id, markerId: String(nextMarker.id) });
    }
  };

  const handlePlaceMarkerBet = async (videoId: string, markerId: string, optionId: string) => {
    const rawAmount = stakeByMarker[markerId];
    const amount = Number(rawAmount);
    if (!rawAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid stake amount first.');
      return false;
    }

    const key = `${markerId}:${optionId}`;
    try {
      setPlacingBetKey(key);
      await api.post('/bets/place-marker/', {
        marker_id: markerId,
        option_id: optionId,
        amount,
      });
      toast.success('Bet placed.');
      getPlaced(videoId).add(markerId);
      bumpPlayback();
      return true;
    } catch (error: any) {
      console.error('Failed to place marker bet', error);
      const backendMessage =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Failed to place bet.';
      toast.error(backendMessage);
      return false;
    } finally {
      setPlacingBetKey(null);
    }
  };

  const resolveBetOverlay = () => {
    const v = activeVideoRef.current;
    const vid = betOverlay?.videoId;
    setBetOverlay(null);
    if (v && vid && currentVideo?.id === vid) {
      v.play().catch(() => null);
    }
  };

  const handlePlaceBetForOverlay = async () => {
    if (!betOverlay || !overlayMarker) return;
    const opt = selectedOptionByMarker[overlayMarker.id];
    if (!opt) {
      toast.error('Select an option first.');
      return;
    }
    const ok = await handlePlaceMarkerBet(betOverlay.videoId, String(overlayMarker.id), opt);
    if (ok) {
      resolveBetOverlay();
    }
  };

  useEffect(() => {
    if (!currentVideo || viewedVideos.has(currentVideo.id)) return;
    const timer = setTimeout(() => {
      api.post(`/videos/${currentVideo.id}/view/`).catch(console.error);
      setViewedVideos((prev) => new Set(prev).add(currentVideo.id));
      setShorts((prev) =>
        prev.map((v) => (v.id === currentVideo.id ? { ...v, views: (v.views || 0) + 1 } : v))
      );
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentIndex, currentVideo, viewedVideos]);

  const handleLike = async (videoId: string) => {
    setShorts((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const hasLiked = !v.has_liked;
          return { ...v, has_liked: hasLiked, likes: v.likes + (hasLiked ? 1 : -1) };
        }
        return v;
      })
    );
    try {
      await api.post(`/videos/${videoId}/like/`);
    } catch (err) {
      console.error(err);
    }
  };

  const openComments = async (videoId: string) => {
    setShowComments(true);
    setComments([]);
    try {
      const response = await api.get(`/videos/${videoId}/comments/`);
      setComments(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || !currentVideo) return;
    try {
      const response = await api.post(`/videos/${currentVideo.id}/comments/`, { text: newComment });
      setComments([response.data, ...comments]);
      setNewComment('');
      setShorts((prev) =>
        prev.map((v) => (v.id === currentVideo.id ? { ...v, comments: v.comments + 1 } : v))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count;
  };

  const openBetFromActionBar = (video: any) => {
    const markers = Array.isArray(video?.bet_markers) ? video.bet_markers : [];
    if (!markers.length) {
      toast.message('No timeline bets on this reel', {
        description: 'Creators add bets in Studio when uploading.',
      });
      return;
    }
    const placed = getPlaced(video.id);
    const pending = [...markers]
      .sort((a: any, b: any) => Number(a.timestamp) - Number(b.timestamp))
      .find((m: any) => !placed.has(String(m.id)));
    if (!pending) {
      toast.success('You are caught up on all bets for this reel.');
      return;
    }
    activeVideoRef.current?.pause();
    
    // If it's an event item, open the specialized sponsor modal
    if (video.type === 'challenge' || video.type === 'prediction') {
      setEventModal(video);
      setSponsorAmount('');
      setSponsorSide('yes');
      return;
    }

    setBetOverlay({ videoId: video.id, markerId: String(pending.id) });
  };

  const ActionBar = ({ video }: { video: any }) => {
    if (!video) return null;
    const itemId = video.id || video.data?.id;
    const hasInteracted = video.has_liked || video.user_voted || video.user_sponsored;
    const likeCount = video.likes || (video.data?.pool_amount ? 0 : 0); // Events might not have likes in this schema yet

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <button onClick={() => video.type ? openBetFromActionBar(video) : handleLike(itemId)} aria-label="Like or Interact" className="group active:scale-90 transition-transform">
            <div
              className={`w-12 h-12 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all ${hasInteracted ? 'bg-neon-pink/20 border-neon-pink' : 'bg-white/5 border-white/10 hover:border-neon-pink/50'}`}
            >
              <Heart
                className={`h-6 w-6 transition-all ${hasInteracted ? 'text-neon-pink fill-neon-pink' : 'text-white group-hover:text-neon-pink'}`}
              />
            </div>
          </button>
          <span className="text-[8px] font-black text-white mt-1.5 uppercase tracking-widest">{formatCount(video.type ? (video.data.sponsor_count || 0) : video.likes)}</span>
        </div>

        <div className="flex flex-col items-center">
          <button onClick={() => !video.type && openComments(itemId)} aria-label="Open comments" className="group active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:border-neon-purple/50 transition-all">
              <MessageCircle className="h-6 w-6 text-white group-hover:text-neon-purple transition-all" />
            </div>
          </button>
          <span className="text-[8px] font-black text-white mt-1.5 uppercase tracking-widest">{formatCount(video.type ? 0 : video.comments)}</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={() => openBetFromActionBar(video)}
            className="h-14 w-14 rounded-2xl bg-neon-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.3)] animate-pulse active:scale-90 transition-all border border-white/20"
          >
            <TrendingUp className="h-7 w-7 text-black stroke-[3]" />
          </button>
          <span className="text-[8px] font-black text-neon-cyan mt-2 uppercase tracking-widest animate-pulse">{video.type ? 'PULSE' : 'BET'}</span>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="rounded-xl bg-white/5 p-3 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const reelTimelineDuration = (v: any, markers: any[]) =>
    Math.max(
      Number(v?.duration_seconds || 0),
      Number(v?.duration || 0),
      durationById[v?.id] || 0,
      ...markers.map((m: any) => Number(m.timestamp) || 0),
      0.001
    );

  return (
    <div className="relative h-screen w-full bg-void flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-purple/5 blur-[120px] animate-pulse" />
      </div>

      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 lg:px-12 pointer-events-none">
        <button onClick={() => navigate(-1)} className="pointer-events-auto p-1 text-white/90 hover:text-neon-cyan transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex gap-6 pointer-events-auto px-2 py-1 items-baseline">
          <button 
            onClick={() => setFeedType('following')}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              feedType === 'following' ? "text-neon-cyan drop-shadow-[0_0_10px_rgba(0,243,255,0.45)]" : "text-zinc-500 hover:text-white"
            )}
          >
            Following
          </button>
          <button 
            onClick={() => setFeedType('foryou')}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              feedType === 'foryou' ? "text-neon-cyan drop-shadow-[0_0_10px_rgba(0,243,255,0.45)]" : "text-zinc-500 hover:text-white"
            )}
          >
            For You
          </button>
          <button 
            onClick={() => setFeedType('events')}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              feedType === 'events' ? "text-neon-cyan drop-shadow-[0_0_10px_rgba(0,243,255,0.45)]" : "text-zinc-500 hover:text-white"
            )}
          >
            Events
          </button>
        </div>
        <button className="pointer-events-auto p-1 text-neon-purple hover:text-neon-pink transition-colors">
          <TrendingUp className="h-6 w-6" />
        </button>
      </div>

      <div className="relative h-full w-full flex items-center justify-center lg:gap-8 px-0 lg:px-6">
        <div className="relative h-full w-full lg:h-[86vh] lg:aspect-[9/16] lg:max-h-[900px] lg:max-w-[506px] bg-black lg:rounded-[3rem] lg:border-[8px] border-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden lg:z-10 lg:ring-1 lg:ring-neon-pink/30">
          <div className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar" onScroll={handleScroll}>
            {shorts.map((video, index) => {
              const markers = Array.isArray(video.bet_markers) ? video.bet_markers : [];
              const isActive = index === currentIndex;
              const overlayThis = betOverlay?.videoId === video.id;
              const placed = getPlaced(video.id);
              const allMarkersResolved =
                markers.length > 0 && markers.every((m: any) => placed.has(String(m.id)));

              return (
                <div key={video.id} className="relative h-full w-full snap-start flex items-center justify-center">
                  {video.type === 'challenge' || video.type === 'prediction' ? (
                    <div className="absolute inset-0">
                      {video.data.image && (
                        <img 
                          src={fixUrl(video.data.image)} 
                          alt="" 
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/90" />
                      
                      {/* Event Badge */}
                      <div className="absolute top-24 left-5 z-20">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border",
                          video.type === 'challenge' ? "bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan" : "bg-neon-purple/20 border-neon-purple/30 text-neon-purple"
                        )}>
                          {video.type === 'challenge' ? '⚡ Challenge' : '🔮 Prediction'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <video
                      src={video.video_file_url || video.video_url}
                      className="h-full w-full object-cover"
                      loop={markers.length === 0 || allMarkersResolved}
                      muted={isMuted || !!overlayThis}
                      autoPlay={isActive && !showComments && !overlayThis}
                      playsInline
                      ref={(el) => {
                        if (isActive) {
                          activeVideoRef.current = el;
                        }
                      }}
                      onLoadedMetadata={(e) => {
                        const d = e.currentTarget.duration;
                        if (Number.isFinite(d) && d > 0) {
                          setDurationById((prev) => ({ ...prev, [video.id]: d }));
                        }
                      }}
                      onTimeUpdate={(e) => handleReelTimeUpdate(video, index, e.currentTarget)}
                      onSeeking={(e) => clampReelSeek(video.id, e.currentTarget, markers)}
                      onSeeked={(e) => clampReelSeek(video.id, e.currentTarget, markers)}
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none" />

                  {video.type === 'challenge' || video.type === 'prediction' ? (
                    <div className="absolute bottom-24 left-5 right-20 z-[30] pointer-events-none">
                      <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl space-y-3 pointer-events-auto">
                        <div className="flex justify-between items-center">
                          <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Live Pulse</span>
                          <span className="text-white font-black text-xs tracking-tighter">${(video.data.pool_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                            <span className="text-neon-cyan">Yes {video.data.yes_pct || 50}%</span>
                            <span className="text-neon-pink">No {video.data.no_pct || 50}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${video.data.yes_pct || 50}%` }}
                              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    markers.length > 0 ? (
                      <div className="absolute bottom-[4.25rem] left-5 right-[4.75rem] lg:right-6 z-[30] pointer-events-none">
                        <div className="pointer-events-auto">
                          <BetMarkerTimeline
                            duration={reelTimelineDuration(video, markers)}
                            currentTime={reelTimeById[video.id] ?? 0}
                            markers={markers.map((m: any) => ({ id: String(m.id), timestamp: Number(m.timestamp) || 0 }))}
                            activeMarkerId={overlayThis ? betOverlay?.markerId ?? null : null}
                            completedMarkerIds={placed}
                            label="Bets"
                          />
                        </div>
                      </div>
                    ) : null
                  )}

                  <div className="absolute bottom-8 left-5 right-16 lg:right-5 pointer-events-none z-20">
                    <div className="flex items-center gap-3 mb-4 pointer-events-auto">
                      <Link to={`/profile/${video.creator || video.data.creator}`} className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white/10 shadow-xl">
                        <img src={video.creator_avatar || video.data.creator_avatar} alt={video.creator_name || video.data.creator_name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </Link>
                      <div className="flex flex-col">
                        <span className="font-black text-white flex items-center gap-2 text-sm italic tracking-tighter uppercase whitespace-nowrap">
                          @{video.creator_name || video.data.creator_name}
                        </span>
                        <button className="text-[8px] bg-neon-cyan/20 border border-neon-cyan/30 px-2 py-0.5 rounded-lg font-black text-neon-cyan w-fit uppercase tracking-widest mt-1">
                          SUBSCRIBE
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-300 line-clamp-3 font-bold drop-shadow-lg tracking-tight leading-relaxed uppercase">
                      {video.description || video.data.description || video.data.title}
                    </p>
                  </div>

                  <div className="absolute bottom-8 right-3 flex lg:hidden">
                    <ActionBar video={video} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex min-w-[88px] pt-20 -ml-1">
          <ActionBar video={currentVideo} />
        </div>
      </div>

      <AnimatePresence>
        {betOverlay && overlayMarker && currentVideo?.id === betOverlay.videoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-end"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full rounded-t-3xl border-t border-white/10 bg-zinc-950 p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-neon-cyan font-black">
                Timeline bet — place a stake to continue
              </div>
              <h3 className="text-base font-black text-white">{overlayMarker.question}</h3>
              <p className="text-xs text-zinc-400">
                Marker at {Number(overlayMarker.timestamp || 0).toFixed(1)}s. You cannot skip past this point until you place a bet.
              </p>

              <div className="space-y-2">
                {(overlayMarker.options || []).map((option: any) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setSelectedOptionByMarker((prev) => ({
                        ...prev,
                        [overlayMarker.id]: String(option.id),
                      }))
                    }
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left ${
                      selectedOptionByMarker[overlayMarker.id] === String(option.id)
                        ? 'border-neon-cyan bg-neon-cyan/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <span className="text-sm font-bold text-zinc-100">{option.text}</span>
                    <span className="text-xs font-black text-neon-cyan">x{Number(option.odds || 0).toFixed(2)}</span>
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                value={stakeByMarker[overlayMarker.id] || ''}
                onChange={(e) =>
                  setStakeByMarker((prev) => ({
                    ...prev,
                    [overlayMarker.id]: e.target.value,
                  }))
                }
                placeholder="Enter stake amount"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-cyan"
              />

              <button
                type="button"
                onClick={handlePlaceBetForOverlay}
                disabled={
                  !selectedOptionByMarker[overlayMarker.id] ||
                  !stakeByMarker[overlayMarker.id] ||
                  placingBetKey?.startsWith(`${overlayMarker.id}:`)
                }
                className="w-full py-3 rounded-lg bg-neon-cyan text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                Place bet to continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 lg:left-auto lg:right-10 lg:w-[400px] h-[60vh] lg:h-[80vh] lg:bottom-10 bg-zinc-950/95 backdrop-blur-3xl z-[100] rounded-t-3xl lg:rounded-3xl border border-white/10 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-neon-purple" />
                Comments
                <span className="text-zinc-500 text-[10px] ml-2">{comments.length}</span>
              </h3>
              <button onClick={() => setShowComments(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
              {comments.length === 0 ? (
                <div className="text-center text-zinc-500 font-bold text-xs uppercase tracking-widest mt-10">No comments yet. Be the first!</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <img src={c.user_avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">@{c.user_username}</span>
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Just now</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 font-medium">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/50">
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && postComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-neon-purple transition-all"
                />
                <button
                  onClick={postComment}
                  disabled={!newComment.trim()}
                  className="p-3 bg-neon-purple rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neon-purple/80 transition-all"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {eventModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setEventModal(null)}
          >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg rounded-t-[2.5rem] bg-zinc-950 border-t border-white/10 p-8 space-y-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    eventModal.type === 'challenge' ? "text-neon-cyan" : "text-neon-purple"
                  )}>
                    {eventModal.type === 'challenge' ? '⚡ Challenge Sponsor' : '🔮 Pulse Prediction'}
                  </span>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{eventModal.data.title}</h3>
                </div>
                <button 
                  onClick={() => setEventModal(null)} 
                  className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Global Pool</span>
                  <span className="text-white font-black text-sm">${(eventModal.data.pool_amount || 0).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-neon-cyan">YES {eventModal.data.yes_pct || 50}%</span>
                    <span className="text-neon-pink">NO {eventModal.data.no_pct || 50}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple" 
                      style={{ width: `${eventModal.data.yes_pct || 50}%` }} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {(['yes', 'no'] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => setSponsorSide(side)}
                      className={cn(
                        "py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border",
                        sponsorSide === side 
                          ? (side === 'yes' ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_20px_rgba(0,243,255,0.2)]" : "bg-neon-pink/20 border-neon-pink text-neon-pink shadow-[0_0_20px_rgba(255,46,145,0.2)]")
                          : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"
                      )}
                    >
                      {side === 'yes' ? '✅ Believe' : '❌ Doubt'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-black">$</span>
                  <input
                    type="number"
                    value={sponsorAmount}
                    onChange={(e) => setSponsorAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-5 text-sm font-black text-white outline-none focus:border-neon-cyan transition-all"
                  />
                </div>

                <button
                  onClick={async () => {
                    const amt = parseFloat(sponsorAmount);
                    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
                    setIsSubmitting(true);
                    try {
                      if (eventModal.type === 'challenge') {
                        await eventApi.sponsorChallenge(eventModal.data.id, amt, sponsorSide);
                      } else {
                        await eventApi.votePrediction(eventModal.data.id, sponsorSide, amt);
                      }
                      toast.success('🎉 Participation successful!');
                      setEventModal(null);
                    } catch (err: any) {
                      toast.error(err?.response?.data?.detail || 'Failed to submit');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting || !sponsorAmount}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-black shadow-2xl transition-all active:scale-95 disabled:opacity-50",
                    eventModal.type === 'challenge' ? "bg-neon-cyan" : "bg-neon-purple text-white"
                  )}
                >
                  {isSubmitting ? 'PROCESSING...' : 'CONFIRM SPONSOR'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerticalFeed;
