import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bell, MessageSquare, Send, ThumbsUp, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { api, fixUrl } from '../services/api';
import { BetMarkerTimeline, maxAllowedTimeBeforeNextBet } from '../components/common/BetMarkerTimeline';
import { useAuth } from '../contexts/AuthContext';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { user: currentUser, refreshProfile } = useAuth();

  const [video, setVideo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [stakeByMarker, setStakeByMarker] = useState<Record<string, string>>({});
  const [placingBetKey, setPlacingBetKey] = useState<string | null>(null);
  const [activeTimelineMarkerId, setActiveTimelineMarkerId] = useState<string | null>(null);
  const [selectedOptionByMarker, setSelectedOptionByMarker] = useState<Record<string, string>>({});
  const [markersWithBetPlaced, setMarkersWithBetPlaced] = useState<Set<string>>(new Set());
  const placedRef = useRef<Set<string>>(new Set());
  const [timelineNow, setTimelineNow] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const creatorId = video?.creator?.id ?? video?.creator ?? null;
  const isLive = !!video?.is_live;
  const subscribedToCreator = Boolean(video?.is_following_creator);
  const isOwnVideo =
    !!(currentUser && creatorId && String(currentUser.id) === String(creatorId));
  const mediaUrl = fixUrl(video?.video_file_url || video?.video_url || '');
  const markers = Array.isArray(video?.bet_markers) ? video.bet_markers : [];
  const autoplayFromNotification =
    searchParams.get('autoplay') === '1' || searchParams.get('autoplay') === 'true';
  useEffect(() => {
    placedRef.current = markersWithBetPlaced;
  }, [markersWithBetPlaced]);

  useEffect(() => {
    setMediaDuration(0);
    setTimelineNow(0);
  }, [id]);

  useEffect(() => {
    if (!autoplayFromNotification || isLive || !mediaUrl || loading) return;

    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const el = videoRef.current;
      if (!el) return;
      const tryPlay = () => {
        if (cancelled) return;
        void el.play().catch(() => {
          /* Browser may still block autoplay without a user gesture */
        });
      };
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) tryPlay();
      else el.addEventListener('canplay', tryPlay, { once: true });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [autoplayFromNotification, isLive, mediaUrl, loading, id]);

  const activeTimelineMarker = activeTimelineMarkerId
    ? markers.find((marker: any) => marker.id === activeTimelineMarkerId) || null
    : null;

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 1024);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const fetchComments = async (videoId: string) => {
    try {
      const response = await api.get(`/videos/${videoId}/comments/`);
      setComments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    }
  };

  useEffect(() => {
    const loadWatchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await api.get(`/videos/${id}/`);
        setVideo(response.data);
        await fetchComments(id);
      } catch (error) {
        console.error('Failed to load video', error);
        setVideo(null);
      } finally {
        setLoading(false);
      }
    };
    loadWatchData();
  }, [id, currentUser?.id]);

  const handleFollowCreator = async () => {
    const vid = video?.id ?? id;
    if (!creatorId || !vid) return;
    if (!currentUser) {
      toast.message('Sign in to subscribe.');
      navigate('/login');
      return;
    }
    if (currentUser.id === creatorId) {
      toast.message('This is your video.');
      return;
    }
    try {
      setFollowLoading(true);
      const res = await api.post<{ is_following: boolean }>(`/follow/${creatorId}/`);

      const videoRes = await api.get(`/videos/${vid}/`);
      setVideo(videoRes.data);

      await refreshProfile();
      toast.success(res.data.is_following ? 'Subscribed' : 'Unsubscribed');
    } catch {
      toast.error('Could not update subscription.');
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (!video?.id) return;
    const timer = setTimeout(() => {
      api.post(`/videos/${video.id}/view/`).catch(console.error);
    }, 3000);
    return () => clearTimeout(timer);
  }, [video?.id]);

  const handleLike = async () => {
    if (!video?.id) return;
    const optimisticLiked = !video.has_liked;
    setVideo((prev: any) => ({
      ...prev,
      has_liked: optimisticLiked,
      likes: Math.max(0, (prev?.likes || 0) + (optimisticLiked ? 1 : -1)),
    }));
    try {
      await api.post(`/videos/${video.id}/like/`);
    } catch (error) {
      console.error('Failed to like video', error);
    }
  };

  const handlePostComment = async () => {
    if (!video?.id || !newComment.trim()) return;
    try {
      setPostingComment(true);
      const response = await api.post(`/videos/${video.id}/comments/`, { text: newComment.trim() });
      setComments((prev) => [response.data, ...prev]);
      setVideo((prev: any) => ({ ...prev, comments: (prev?.comments || 0) + 1 }));
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
      toast.error('Unable to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const handlePlaceMarkerBet = async (markerId: string, optionId: string) => {
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
      toast.success('Bet placed successfully.');
      setMarkersWithBetPlaced((prev) => {
        const next = new Set(prev).add(markerId);
        placedRef.current = next;
        return next;
      });
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

  const handleVideoTimeUpdate = () => {
    if (isLive || !videoRef.current || activeTimelineMarkerId) return;
    if (markers.length === 0) return;
    const currentTime = videoRef.current.currentTime;
    const nextMarker = markers.find((marker: any) => {
      if (!marker?.id || markersWithBetPlaced.has(marker.id)) return false;
      const triggerAt = Math.max(0, Number(marker.timestamp || 0) - 1);
      return currentTime >= triggerAt;
    });

    if (nextMarker) {
      videoRef.current.pause();
      setActiveTimelineMarkerId(nextMarker.id);
    }
  };

  const clampPlaybackToUnresolvedBets = () => {
    if (isLive || !videoRef.current || markers.length === 0) return;
    const maxT = maxAllowedTimeBeforeNextBet(markers, placedRef.current);
    if (videoRef.current.currentTime > maxT) {
      videoRef.current.currentTime = maxT;
    }
  };

  const handlePlaceBetForMarker = async (markerId: string) => {
    const selectedOptionId = selectedOptionByMarker[markerId];
    if (!selectedOptionId) {
      toast.error('Select an option first.');
      return;
    }
    const success = await handlePlaceMarkerBet(markerId, selectedOptionId);
    if (success) {
      setActiveTimelineMarkerId(null);
      videoRef.current?.play().catch(() => null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-void flex items-center justify-center text-zinc-300">Loading video...</div>;
  }

  if (!video) {
    return <div className="min-h-screen bg-void flex items-center justify-center text-zinc-300">Video not found.</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8 bg-void min-h-screen font-sans text-white">
      <div className="flex-1 space-y-6">
        <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-white/5">
          {mediaUrl ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="h-full w-full object-contain bg-black"
              controls={!isLive}
              autoPlay={isLive}
              playsInline
              onTimeUpdate={() => {
                setTimelineNow(videoRef.current?.currentTime ?? 0);
                handleVideoTimeUpdate();
              }}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d) && d > 0) setMediaDuration(d);
              }}
              onSeeking={clampPlaybackToUnresolvedBets}
              onSeeked={clampPlaybackToUnresolvedBets}
              onPlay={() => {
                if (activeTimelineMarkerId) {
                  videoRef.current?.pause();
                }
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-500">No video source found.</div>
          )}
          {!isLive && mediaUrl && (
            <div className="absolute bottom-0 left-0 right-0 z-10 px-3 sm:px-4 pb-3 pt-8 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
              <div className="pointer-events-auto max-w-4xl mx-auto">
                <BetMarkerTimeline
                  duration={Math.max(
                    mediaDuration,
                    Number(video.duration_seconds || 0),
                    Number(video.duration || 0)
                  )}
                  currentTime={timelineNow}
                  markers={markers.map((m: any) => ({ id: String(m.id), timestamp: Number(m.timestamp) || 0 }))}
                  activeMarkerId={activeTimelineMarkerId}
                  completedMarkerIds={markersWithBetPlaced}
                  interactive={markers.length === 0}
                  onSeek={
                    markers.length === 0
                      ? (seconds) => {
                          if (!videoRef.current) return;
                          const d = Math.max(
                            mediaDuration,
                            Number(video.duration_seconds || 0),
                            Number(video.duration || 0),
                          );
                          const t =
                            Number.isFinite(d) && d > 0
                              ? Math.min(Math.max(0, seconds), d)
                              : Math.max(0, seconds);
                          videoRef.current.currentTime = t;
                          setTimelineNow(t);
                        }
                      : undefined
                  }
                  label={markers.length > 0 ? 'Timeline · bets' : 'Timeline · scrub to seek'}
                />
              </div>
            </div>
          )}
          {isLive && (
            <div className="absolute top-4 left-4 bg-neon-pink text-white text-[10px] tracking-widest font-bold px-3 py-1 rounded uppercase shadow-[0_0_15px_rgba(255,0,183,0.5)] animate-pulse">
              LIVE
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">{video.title}</h1>
            <p className="text-sm text-zinc-400">
              {isLive ? 'Live stream' : 'Uploaded video'} - {video.views || 0} views
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                to={creatorId ? `/profile/user/${creatorId}` : '#'}
                className={`shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-zinc-900 ${!creatorId ? 'pointer-events-none opacity-70' : ''}`}
              >
                {video.creator_avatar ? (
                  <img src={fixUrl(video.creator_avatar)} alt={video.creator_name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-neon-purple to-neon-pink" />
                )}
              </Link>
              <div className="flex flex-col min-w-0">
                <Link
                  to={creatorId ? `/profile/user/${creatorId}` : '#'}
                  className="font-bold text-white text-sm truncate hover:text-neon-cyan transition-colors"
                >
                  {video.creator_name || 'Creator'}
                </Link>
                {video.creator_username ? (
                  <span className="text-xs text-zinc-500 truncate">@{video.creator_username}</span>
                ) : null}
              </div>
              {!isOwnVideo && creatorId ? (
                <button
                  type="button"
                  disabled={followLoading}
                  onClick={() => void handleFollowCreator()}
                  className={`ml-2 sm:ml-4 shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-sm transition flex items-center gap-2 disabled:opacity-60 ${
                    subscribedToCreator
                      ? 'bg-white/10 text-white border border-white/15 hover:bg-white/15'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  {followLoading ? '…' : subscribedToCreator ? 'Subscribed' : 'Subscribe'}
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={handleLike} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10">
                <ThumbsUp className={`h-4 w-4 ${video.has_liked ? 'text-neon-cyan' : 'text-white'}`} />
                <span className="text-sm font-bold">{video.likes || 0}</span>
              </button>
              <div className="text-sm text-zinc-400">{video.comments || 0} comments</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 mt-4">
          <div className="text-white text-sm mb-1 font-medium">{video.description || 'No description available.'}</div>
        </div>

        <div className="pt-4">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-neon-cyan" />
            {comments.length} Comments
          </h3>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent border-b border-white/20 pb-2 text-sm text-white focus:outline-none focus:border-neon-cyan transition-colors"
            />
            <button
              onClick={handlePostComment}
              disabled={postingComment || !newComment.trim()}
              className="px-4 py-2 rounded-lg bg-neon-cyan text-black text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {comments.map((item) => (
              <div key={item.id} className="flex gap-3">
                <img src={fixUrl(item.user_avatar)} alt={item.user_username} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-bold text-white">@{item.user_username}</div>
                  <div className="text-sm text-zinc-300">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="hidden lg:block lg:w-[380px] flex-shrink-0 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-neon-cyan" />
          <h2 className="text-lg font-bold text-white">Timeline Bets</h2>
        </div>

        {markers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            No timeline bets were added for this video.
          </div>
        ) : (
          <div className="space-y-4">
            {markers.map((marker: any) => (
              <motion.div
                key={marker.id}
                initial={false}
                animate={
                  activeTimelineMarkerId === marker.id
                    ? { scale: [1, 1.02, 1], boxShadow: '0 0 30px rgba(0,243,255,0.25)' }
                    : { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }
                }
                transition={{ duration: 0.45 }}
                className={`rounded-xl border p-4 space-y-3 ${
                  activeTimelineMarkerId === marker.id
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="text-[10px] uppercase tracking-widest text-neon-cyan font-black">
                  At {Number(marker.timestamp || 0).toFixed(1)}s
                </div>
                <div className="text-sm font-bold text-white">{marker.question}</div>
                {activeTimelineMarkerId === marker.id && (
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan animate-pulse">
                    Bet triggered - video paused
                  </div>
                )}
                <input
                  type="number"
                  min="1"
                  value={stakeByMarker[marker.id] || ''}
                  onChange={(e) =>
                    setStakeByMarker((prev) => ({
                      ...prev,
                      [marker.id]: e.target.value,
                    }))
                  }
                  placeholder="Enter stake amount"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-cyan"
                />
                <div className="grid grid-cols-1 gap-2">
                  {(marker.options || []).map((option: any) => {
                    const key = `${marker.id}:${option.id}`;
                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          setSelectedOptionByMarker((prev) => ({
                            ...prev,
                            [marker.id]: option.id,
                          }))
                        }
                        disabled={placingBetKey === key}
                        className={`w-full flex items-center justify-between bg-black/20 hover:bg-black/40 transition rounded-lg p-3 border text-left disabled:opacity-50 ${
                          selectedOptionByMarker[marker.id] === option.id ? 'border-neon-cyan' : 'border-white/10'
                        }`}
                      >
                        <span className="text-sm font-bold text-zinc-200">{option.text}</span>
                        <span className="text-xs font-black text-neon-cyan">x{Number(option.odds || 0).toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePlaceBetForMarker(marker.id)}
                  disabled={!selectedOptionByMarker[marker.id] || placingBetKey?.startsWith(`${marker.id}:`)}
                  className="w-full py-2 rounded-lg bg-neon-cyan text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  Place Bet
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </aside>

      <AnimatePresence>
        {isMobile && activeTimelineMarker && (
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
              className="w-full rounded-t-3xl border-t border-white/10 bg-zinc-950 p-5 space-y-4"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-neon-cyan font-black">
                Timeline Bet Triggered - video paused
              </div>
              <h3 className="text-base font-black text-white">{activeTimelineMarker.question}</h3>
              <p className="text-xs text-zinc-400">
                Marker at {Number(activeTimelineMarker.timestamp || 0).toFixed(1)}s. Place bet to continue playback.
              </p>

              <div className="space-y-2">
                {(activeTimelineMarker.options || []).map((option: any) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      setSelectedOptionByMarker((prev) => ({
                        ...prev,
                        [activeTimelineMarker.id]: option.id,
                      }))
                    }
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left ${
                      selectedOptionByMarker[activeTimelineMarker.id] === option.id
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
                value={stakeByMarker[activeTimelineMarker.id] || ''}
                onChange={(e) =>
                  setStakeByMarker((prev) => ({
                    ...prev,
                    [activeTimelineMarker.id]: e.target.value,
                  }))
                }
                placeholder="Enter stake amount"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-neon-cyan"
              />

              <button
                onClick={() => handlePlaceBetForMarker(activeTimelineMarker.id)}
                disabled={
                  !selectedOptionByMarker[activeTimelineMarker.id] ||
                  !stakeByMarker[activeTimelineMarker.id] ||
                  placingBetKey?.startsWith(`${activeTimelineMarker.id}:`)
                }
                className="w-full py-3 rounded-lg bg-neon-cyan text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                Place Bet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Watch;

