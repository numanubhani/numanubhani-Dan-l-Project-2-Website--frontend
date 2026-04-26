import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  MoreVertical,
  Plus,
  X,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockVideos } from '../mockData';
import { Link, useNavigate } from 'react-router-dom';
import { BetModal } from '../components/common/BetModal';

const VerticalFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showBetting, setShowBetting] = useState(false);
  const shorts = mockVideos.filter(v => v.type === 'short' || v.type === 'long'); // Using all for feed
  const navigate = useNavigate();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const height = e.currentTarget.clientHeight;
    const newIndex = Math.round(e.currentTarget.scrollTop / height);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const currentVideo = shorts[currentIndex];
  const [activeMarketTitle, setActiveMarketTitle] = useState(currentVideo?.title || "Active Market Prediction");
  const [lastTriggeredBetId, setLastTriggeredBetId] = useState<string | null>(null);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const currentTime = e.currentTarget.currentTime;
    
    // Check for timed bets
    if (currentVideo?.betEvents) {
      const activeBet = currentVideo.betEvents.find(
        b => currentTime >= b.timestamp && currentTime <= b.timestamp + 1 && b.id !== lastTriggeredBetId
      );
      
      if (activeBet) {
        setLastTriggeredBetId(activeBet.id);
        setActiveMarketTitle(activeBet.question);
        setShowBetting(true);
      }
    }
  };

  useEffect(() => {
    // Reset bet tracking when switching videos
    setLastTriggeredBetId(null);
    setActiveMarketTitle(currentVideo?.title || "Active Market Prediction");
  }, [currentIndex]);

  const ActionBar = ({ video }: { video: typeof shorts[number] }) => (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center">
        <button aria-label="Like reel" className="group active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:border-neon-pink/50 transition-all">
            <Heart className="h-6 w-6 text-white group-hover:text-neon-pink group-hover:fill-neon-pink transition-all" />
          </div>
        </button>
        <span className="text-[8px] font-black text-white mt-1.5 uppercase tracking-widest">{(video.likes / 1000).toFixed(1)}K</span>
      </div>
      
      <div className="flex flex-col items-center">
        <button aria-label="Open comments" className="group active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:border-neon-purple/50 transition-all">
            <MessageCircle className="h-6 w-6 text-white group-hover:text-neon-purple transition-all" />
          </div>
        </button>
        <span className="text-[8px] font-black text-white mt-1.5 uppercase tracking-widest">{video.comments}</span>
      </div>

      <div className="flex flex-col items-center">
        <button
          aria-label="Open prediction market"
          onClick={() => setShowBetting(true)}
          className="h-14 w-14 rounded-2xl bg-neon-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.3)] animate-pulse active:scale-90 transition-all border border-white/20"
        >
          <TrendingUp className="h-7 w-7 text-black stroke-[3]" />
        </button>
        <span className="text-[8px] font-black text-neon-cyan mt-2 uppercase tracking-widest animate-pulse">BET</span>
      </div>

      <button
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        onClick={() => setIsMuted(!isMuted)}
        className="rounded-xl bg-white/5 p-3 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  );

  return (
    <div className="relative h-screen w-full bg-void flex items-center justify-center overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-purple/5 blur-[120px] animate-pulse" />
      </div>

      {/* Top Controls - Floating */}
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

      {/* Reel Layout: 9:16 frame + desktop right action rail */}
      <div className="relative h-full w-full flex items-center justify-center lg:gap-8 px-0 lg:px-6">
        <div className="relative h-full w-full lg:h-[86vh] lg:aspect-[9/16] lg:max-h-[900px] lg:max-w-[506px] bg-black lg:rounded-[3rem] lg:border-[8px] border-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden lg:z-10 lg:ring-1 lg:ring-neon-pink/30">
          <div
            className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
            onScroll={handleScroll}
          >
            {shorts.map((video, index) => (
              <div key={video.id} className="relative h-full w-full snap-start flex items-center justify-center">
                <video
                  src={video.videoUrl}
                  className="h-full w-full object-cover"
                  loop
                  muted={isMuted || showBetting}
                  autoPlay={index === currentIndex && !showBetting}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                />

                {/* Video Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none" />
                
                <div className="absolute bottom-8 left-5 right-16 lg:right-5 pointer-events-none">
                  <div className="flex items-center gap-3 mb-4 pointer-events-auto">
                    <Link to="/profile" className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white/10 shadow-xl">
                      <img src={video.creator.avatar} alt={video.creator.username} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </Link>
                    <div className="flex flex-col">
                      <span className="font-black text-white flex items-center gap-2 text-sm italic tracking-tighter uppercase whitespace-nowrap">
                        @{video.creator.username}
                        {video.creator.isVerified && <Zap className="h-3 w-3 text-neon-cyan fill-neon-cyan" />}
                      </span>
                      <button className="text-[8px] bg-neon-cyan/20 border border-neon-cyan/30 px-2 py-0.5 rounded-lg font-black text-neon-cyan w-fit uppercase tracking-widest mt-1">SUBSCRIBE</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 line-clamp-3 font-bold drop-shadow-lg tracking-tight leading-relaxed uppercase">
                    {video.description} <span className="text-neon-cyan">#ALPHA #GRID</span>
                  </p>
                </div>

                {/* Mobile/Tablet Side Action Bar - Inside Frame */}
                <div className="absolute bottom-12 right-4 flex lg:hidden">
                  <ActionBar video={video} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop/Laptop Side Action Bar - Outside 9:16 Frame */}
        <div className="hidden lg:flex min-w-[88px]">
          <ActionBar video={currentVideo} />
        </div>
      </div>

      {/* Verified Bet Modal */}
      <BetModal 
        isOpen={showBetting} 
        onClose={() => setShowBetting(false)} 
        marketTitle={activeMarketTitle}
        isMandatory={true}
      />
    </div>
  );
};

export default VerticalFeed;
