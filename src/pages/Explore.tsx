import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Zap,
  Globe
} from 'lucide-react';
import { mockVideos } from '../mockData';
import { VideoCard, ReelCard } from '../components/common/VideoCard';
import { motion } from 'motion/react';

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Gaming', 'Tech', 'Crypto', 'Politics', 'Sports', 'AI', 'Music'];

  const longVideos = mockVideos.filter(v => v.type === 'long');
  const shortVideos = mockVideos.filter(v => v.type === 'short');

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
              <button className="self-start sm:self-auto text-[10px] font-black text-neon-pink uppercase tracking-widest hover:underline decoration-2 underline-offset-8">VIEW_ALL_REELS</button>
           </div>

           <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-6 sm:pb-8 no-scrollbar group/shelf">
              {/* Multiplying shorts to fill space */}
              {[...shortVideos, ...shortVideos, ...shortVideos, ...shortVideos].map((video, i) => (
                <ReelCard key={`reel-${video.id}-${i}`} video={video} />
              ))}
           </div>
        </section>

        {/* Section 3: Global Data Grid (Standard Grid) */}
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
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-neon-cyan transition-colors" />
                    <input 
                      placeholder="SCAN MARKETS..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-neon-cyan/50 backdrop-blur-3xl transition-all"
                    />
                 </div>
                 <div className="explore-tag-bar w-full xl:w-auto flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`explore-tag-chip px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          activeCategory === cat ? "bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,243,255,0.2)]" : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Professional Fixed Grid with Consistent Spacing */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-10 sm:gap-y-14 gap-x-5 sm:gap-x-8 lg:gap-x-10">
              {[...longVideos, ...longVideos, ...longVideos, ...longVideos, ...longVideos].map((video, i) => (
                <VideoCard key={`grid-${video.id}-${i}`} video={video} />
              ))}
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
                    You have reached the temporary perimeter of this sector. <br/>
                    Initiate deep scan to uncover additional classified transmissions.
                 </p>
                 <button className="mt-4 px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all active:scale-95">
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
