import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  X,
  Zap,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { BetModal } from '../components/common/BetModal';
import { api } from '../services/api';

const VerticalFeed = () => {
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showBetting, setShowBetting] = useState(false);
  
  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await api.get('/videos/feed/?type=reels');
        // If there are no reels, maybe fetch all videos as fallback just for prototype
        if (response.data.length === 0) {
           const fallback = await api.get('/videos/feed/');
           setShorts(fallback.data);
        } else {
           setShorts(response.data);
        }
      } catch (err) {
        console.error("Failed to load reels", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const height = e.currentTarget.clientHeight;
    const newIndex = Math.round(e.currentTarget.scrollTop / height);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const currentVideo = shorts[currentIndex];
  const [activeMarketTitle, setActiveMarketTitle] = useState("Active Market Prediction");
  const [lastTriggeredBetId, setLastTriggeredBetId] = useState<string | null>(null);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const currentTime = e.currentTarget.currentTime;
    
    if (currentVideo?.bet_events) {
      const activeBet = currentVideo.bet_events.find(
        (b: any) => currentTime >= b.timestamp && currentTime <= b.timestamp + 1 && b.id !== lastTriggeredBetId
      );
      
      if (activeBet) {
        setLastTriggeredBetId(activeBet.id);
        setActiveMarketTitle(activeBet.question);
        setShowBetting(true);
      }
    }
  };

  useEffect(() => {
    setLastTriggeredBetId(null);
    setActiveMarketTitle(currentVideo?.title || "Active Market Prediction");
  }, [currentIndex, currentVideo]);

  // View tracking
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (currentVideo && !viewedVideos.has(currentVideo.id)) {
      const timer = setTimeout(() => {
        api.post(`/videos/${currentVideo.id}/view/`).catch(console.error);
        setViewedVideos(prev => new Set(prev).add(currentVideo.id));
        setShorts(prev => prev.map(v => v.id === currentVideo.id ? { ...v, views: v.views + 1 } : v));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentVideo, viewedVideos]);

  const handleLike = async (videoId: string) => {
    setShorts(prev => prev.map(v => {
      if (v.id === videoId) {
        const hasLiked = !v.has_liked;
        return { ...v, has_liked: hasLiked, likes: v.likes + (hasLiked ? 1 : -1) };
      }
      return v;
    }));
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
      setNewComment("");
      setShorts(prev => prev.map(v => v.id === currentVideo.id ? { ...v, comments: v.comments + 1 } : v));
    } catch (err) {
      console.error(err);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count;
  };

  const ActionBar = ({ video }: { video: any }) => {
    if (!video) return null;
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <button onClick={() => handleLike(video.id)} aria-label="Like reel" className="group active:scale-90 transition-transform">
            <div className={`w-12 h-12 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all ${video.has_liked ? 'bg-neon-pink/20 border-neon-pink' : 'bg-white/5 border-white/10 hover:border-neon-pink/50'}`}>
              <Heart className={`h-6 w-6 transition-all ${video.has_liked ? 'text-neon-pink fill-neon-pink' : 'text-white group-hover:text-neon-pink'}`} />
            </div>
          </button>
          <span className="text-[8px] font-black text-white mt-1.5 uppercase tracking-widest">{formatCount(video.likes)}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <button onClick={() => openComments(video.id)} aria-label="Open comments" className="group active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:border-neon-purple/50 transition-all">
              <MessageCircle className="h-6 w-6 text-white group-hover:text-neon-purple transition-all" />
            </div>
          </button>
          <span className="text-[8px] font-black text-white mt-1.5 uppercase tracking-widest">{formatCount(video.comments)}</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={() => setShowBetting(true)}
            className="h-14 w-14 rounded-2xl bg-neon-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.3)] animate-pulse active:scale-90 transition-all border border-white/20"
          >
            <TrendingUp className="h-7 w-7 text-black stroke-[3]" />
          </button>
          <span className="text-[8px] font-black text-neon-cyan mt-2 uppercase tracking-widest animate-pulse">BET</span>
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
     return <div className="min-h-screen bg-void flex items-center justify-center"><div className="h-8 w-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;
  }

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
        <div className="flex gap-6 pointer-events-auto px-2 py-1">
          <button className="text-zinc-300 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">Following</button>
          <button className="text-neon-cyan text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(0,243,255,0.45)]">For You</button>
        </div>
        <button className="pointer-events-auto p-1 text-neon-purple hover:text-neon-pink transition-colors">
          <TrendingUp className="h-6 w-6" />
        </button>
      </div>

      <div className="relative h-full w-full flex items-center justify-center lg:gap-8 px-0 lg:px-6">
        <div className="relative h-full w-full lg:h-[86vh] lg:aspect-[9/16] lg:max-h-[900px] lg:max-w-[506px] bg-black lg:rounded-[3rem] lg:border-[8px] border-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden lg:z-10 lg:ring-1 lg:ring-neon-pink/30">
          <div
            className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
            onScroll={handleScroll}
          >
            {shorts.map((video, index) => (
              <div key={video.id} className="relative h-full w-full snap-start flex items-center justify-center">
                <video
                  src={video.video_file_url || video.video_url}
                  className="h-full w-full object-cover"
                  loop
                  muted={isMuted || showBetting}
                  autoPlay={index === currentIndex && !showBetting && !showComments}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none" />
                
                <div className="absolute bottom-8 left-5 right-16 lg:right-5 pointer-events-none">
                  <div className="flex items-center gap-3 mb-4 pointer-events-auto">
                    <Link to={`/profile/${video.creator}`} className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white/10 shadow-xl">
                      <img src={video.creator_avatar} alt={video.creator_name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </Link>
                    <div className="flex flex-col">
                      <span className="font-black text-white flex items-center gap-2 text-sm italic tracking-tighter uppercase whitespace-nowrap">
                        @{video.creator_name}
                      </span>
                      <button className="text-[8px] bg-neon-cyan/20 border border-neon-cyan/30 px-2 py-0.5 rounded-lg font-black text-neon-cyan w-fit uppercase tracking-widest mt-1">SUBSCRIBE</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 line-clamp-3 font-bold drop-shadow-lg tracking-tight leading-relaxed uppercase">
                    {video.description}
                  </p>
                </div>

                <div className="absolute bottom-8 right-3 flex lg:hidden">
                  <ActionBar video={video} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex min-w-[88px] pt-20 -ml-1">
          <ActionBar video={currentVideo} />
        </div>
      </div>

      <BetModal 
        isOpen={showBetting} 
        onClose={() => setShowBetting(false)} 
        marketTitle={activeMarketTitle}
        isMandatory={true}
      />
      
      {/* Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
                 comments.map(c => (
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
    </div>
  );
};

export default VerticalFeed;
