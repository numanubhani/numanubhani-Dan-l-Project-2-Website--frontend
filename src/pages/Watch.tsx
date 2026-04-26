import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  MoreVertical, 
  MessageCircle, 
  Play, 
  Settings,
  Zap,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { mockVideos } from '../mockData';
import { VideoCard } from '../components/common/VideoCard';
import { motion, AnimatePresence } from 'motion/react';
import { BetModal } from '../components/common/BetModal';

const Watch = () => {
  const { id } = useParams();
  const video = mockVideos.find(v => v.id === id) || mockVideos[0];
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [betActive, setBetActive] = useState(false);
  const [activeMarketTitle, setActiveMarketTitle] = useState(video.title);
  const [lastTriggeredBetId, setLastTriggeredBetId] = useState<string | null>(null);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const currentTime = e.currentTarget.currentTime;
    
    // Check for timed bets
    if (video.betEvents) {
      const activeBet = video.betEvents.find(
        b => currentTime >= b.timestamp && currentTime <= b.timestamp + 1 && b.id !== lastTriggeredBetId
      );
      
      if (activeBet) {
        setLastTriggeredBetId(activeBet.id);
        setActiveMarketTitle(activeBet.question);
        setBetActive(true);
        e.currentTarget.pause();
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-3 sm:p-4 lg:p-10 bg-zinc-950 min-h-screen">
      {/* Main Video Section */}
      <div className="flex-1 space-y-8">
        <div className="aspect-video w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group border border-white/5">
          <video 
            src={video.videoUrl} 
            className="h-full w-full object-contain"
            controls={!betActive}
            autoPlay
            muted={betActive}
            onTimeUpdate={handleTimeUpdate}
          />
          {/* Active Bet Snippet Indicator */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 z-10"
          >
            <button 
              onClick={() => setBetActive(true)}
              className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-black/40 px-3 sm:px-6 py-2 sm:py-3 backdrop-blur-xl border border-neon-cyan/30 hover:border-neon-cyan hover:bg-black/60 transition-all group/bet"
            >
              <TrendingUp className="h-5 w-5 text-neon-cyan animate-pulse group-hover/bet:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] text-white">Live Market</span>
            </button>
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter leading-tight lg:leading-none text-white uppercase italic break-words">
              {video.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-white/5 px-3 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-sm font-black uppercase tracking-[0.14em] sm:tracking-widest hover:border-neon-pink/50 border border-transparent transition-all group">
                <Heart className="h-5 w-5 group-hover:text-neon-pink group-hover:fill-neon-pink transition-all" />
                {video.likes}
              </button>
              <button className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-white/5 px-3 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-sm font-black uppercase tracking-[0.14em] sm:tracking-widest hover:border-neon-cyan/50 border border-transparent transition-all">
                <Share2 className="h-5 w-5" />
                Share
              </button>
              <button className="rounded-xl sm:rounded-2xl bg-white/5 p-2.5 sm:p-3 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all">
                <MoreVertical className="h-6 w-6 text-zinc-500" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl sm:rounded-3xl bg-white/5 p-4 sm:p-6 border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <Link to="/profile" className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-xl sm:rounded-2xl border-2 border-white/10 shadow-lg group flex-shrink-0">
                <img src={video.creator.avatar} alt="Creator" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
              </Link>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-xl hover:text-neon-cyan transition-colors italic tracking-tight truncate">{video.creator.username}</span>
                  {video.creator.isVerified && <Zap className="h-5 w-5 text-neon-cyan fill-neon-cyan animate-pulse shadow-[0_0_10px_rgba(0,243,255,0.5)]" />}
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.14em] sm:tracking-[0.2em] mt-1">{(video.creator.followers / 1000).toFixed(1)}K SUBSCRIBERS</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSubscribed(!isSubscribed)}
              className={`w-full sm:w-auto rounded-xl sm:rounded-2xl px-5 sm:px-10 py-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] transition-all active:scale-95 shadow-2xl ${
                isSubscribed 
                  ? "bg-white/5 text-zinc-400 border border-white/10" 
                  : "bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:brightness-110"
              }`}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>

          <div className="rounded-2xl sm:rounded-3xl bg-white/5 p-4 sm:p-6 border border-white/5 space-y-5 sm:space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <TrendingUp className="h-32 w-32 text-neon-cyan" />
             </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-widest text-zinc-500">
              <span className="flex items-center gap-2"><Play className="h-3 w-3" /> {(video.views / 1000).toFixed(1)}K Views</span>
              <span className="hidden sm:inline">•</span>
              <span>Uploaded: {video.createdAt}</span>
            </div>
            <p className="text-zinc-400 leading-relaxed max-w-4xl text-sm font-medium">
              {video.description}
            </p>
            <div className="flex flex-wrap gap-3">
              {['#NEON', '#ALPHA', '#VPULSE', '#CRYPTO'].map(tag => (
                <span key={tag} className="text-[10px] font-black text-neon-cyan px-3 py-1 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20 hover:bg-neon-cyan hover:text-black transition-all cursor-pointer tracking-widest">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Mock Comments View */}
        <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-10 border-t border-white/5">
           <div className="flex items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">{video.comments} Comments</h2>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                 <ChevronDown className="h-4 w-4" />
                 LATEST
              </div>
           </div>
           
           <div className="flex gap-3 sm:gap-5">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-xl">
                <img src="https://picsum.photos/seed/operative/100/100" alt="Me" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 space-y-4">
                <input placeholder="Add a comment..." className="w-full bg-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm outline-none border border-white/10 focus:border-neon-cyan/30 transition-all uppercase font-black tracking-[0.16em] sm:tracking-widest placeholder:text-zinc-600" />
                <div className="flex justify-end gap-4">
                   <button className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Discard</button>
                   <button className="rounded-xl bg-white/10 px-6 py-2 text-xs font-black uppercase tracking-widest text-zinc-400 border border-white/10 hover:border-neon-cyan/30 transition-all">Comment</button>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Sidebar - Related Content */}
      <aside className="w-full lg:w-[450px] space-y-8 sm:space-y-10">
        <div className="space-y-6">
           <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <Zap className="h-5 w-5 text-neon-purple fill-neon-purple" />
              Watch Next
           </h3>
           <div className="space-y-6">
             {mockVideos.filter(v => v.id !== id).slice(0, 6).map(v => (
               <VideoCard key={v.id} video={v} horizontal />
             ))}
           </div>
        </div>

        {/* Prediction Market Promotion */}
        <div className="rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-neon-cyan/20 p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                   <TrendingUp className="h-6 w-6 text-neon-cyan" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-cyan">Market Intelligence</span>
              </div>
              <p className="font-black text-lg sm:text-xl leading-tight sm:leading-none uppercase tracking-tighter italic">Will this stream hit 100k Pulses before end of cycle?</p>
              <div className="space-y-2">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    className="h-full bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.5)]" />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span className="text-neon-cyan">YES: 65%</span>
                  <span>NO: 35%</span>
                </div>
              </div>
              <button 
                onClick={() => setBetActive(true)}
                className="w-full py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-[0_10px_20px_rgba(0,0,0,0.4)] active:scale-95"
              >
                 EXECUTE POSITION
              </button>
           </div>
           <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-neon-cyan blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity" />
        </div>
      </aside>

      {/* High-Fidelity Bet Modal */}
      <BetModal 
        isOpen={betActive} 
        onClose={() => setBetActive(false)} 
        marketTitle={activeMarketTitle} 
        isMandatory={false}
      />
    </div>
  );
};

export default Watch;
