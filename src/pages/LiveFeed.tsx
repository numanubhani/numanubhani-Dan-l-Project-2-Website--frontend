import React from 'react';
import { motion } from 'motion/react';
import { Users, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const LiveFeed = () => {
  const activeStreams = [
    {
      id: 's1',
      title: 'MARKET ALPHA: BTC PRE-SESSION BREAKDOWN',
      creator: 'ALEX_STREAM',
      viewers: '12.4K',
      thumbnail: 'https://picsum.photos/seed/stream1/1280/720',
      category: 'CRYPTO'
    },
    {
      id: 's2',
      title: 'WORLD CUP PRE-MATCH ANALYSIS & LIVE ODDS',
      creator: 'GOAT_SPORTS',
      viewers: '45.2K',
      thumbnail: 'https://picsum.photos/seed/stream2/1280/720',
      category: 'SPORTS'
    },
    {
      id: 's3',
      title: 'AI SINGULARITY DEBATE: PREDICTION MARKET',
      creator: 'TECH_GURU',
      viewers: '8.9K',
      thumbnail: 'https://picsum.photos/seed/stream3/1280/720',
      category: 'TECH'
    },
    {
      id: 's4',
      title: 'LATE NIGHT MACRO UPDATES & PULSE DEPLOYMENT',
      creator: 'MACRO_JAKE',
      viewers: '3.1K',
      thumbnail: 'https://picsum.photos/seed/stream4/1280/720',
      category: 'ECONOMY'
    },
  ];

  return (
    <div className="p-4 lg:p-10 space-y-10">

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {['ALL LIVE', 'CRYPTO', 'SPORTS', 'POLITICS', 'TECH', 'MACRO'].map((tag, i) => (
          <button 
            key={tag}
            className={`live-tag-chip px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              i === 0 
              ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.15)]' 
              : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-neon-pink animate-ping" />
             ACTIVE TRANSMISSIONS
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            <Users className="h-4 w-4" />
            {(24.5).toFixed(1)}k Total VIEWERS
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {activeStreams.map((stream) => (
            <motion.div 
              key={stream.id}
              whileHover={{ y: -10 }}
              className="group relative cursor-pointer"
            >
              <div className="live-video-card aspect-video w-full rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 relative shadow-2xl group-hover:border-neon-cyan/30 transition-all">
                <img 
                  src={stream.thumbnail} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70" 
                  alt={stream.title}
                />
                
                {/* Overlays */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                   <div className="bg-neon-pink px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-black shadow-lg">LIVE</div>
                   <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white border border-white/10 flex items-center gap-1.5">
                     <Users className="h-2.5 w-2.5 text-neon-cyan" />
                     {stream.viewers}
                   </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4 sm:p-6 translate-y-2 group-hover:translate-y-0 transition-transform">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-neon-cyan/20 flex items-center justify-center group-hover:bg-neon-cyan group-hover:text-black transition-all">
                        <Play className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest">{stream.category}</p>
                        <h3 className="text-sm font-black text-white leading-tight uppercase line-clamp-1">{stream.title}</h3>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3 px-2">
                 <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${stream.creator}/100/100`} className="h-full w-full object-cover" alt={stream.creator} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase italic tracking-tighter">@{stream.creator}</span>
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">DEPLOYED: 5M AGO</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
