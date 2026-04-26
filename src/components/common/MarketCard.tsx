import React from 'react';
import { TrendingUp, Users, Clock } from 'lucide-react';
import { Market } from '../../types';
import { motion } from 'motion/react';

interface MarketCardProps {
  market: Market;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="market-card group relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/40 p-8 shadow-2xl transition-all hover:border-neon-cyan/20 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)]"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black mb-1.5 opacity-60">Real-Time Market</p>
          <h3 className="line-clamp-2 font-display text-xl font-bold text-white group-hover:text-neon-cyan transition-colors leading-tight uppercase italic tracking-tighter">
            {market.title}
          </h3>
        </div>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 group-hover:border-neon-cyan transition-all">
          <TrendingUp className="h-6 w-6 text-neon-cyan group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Probability Bars */}
        <div className="space-y-5">
          <div className="relative">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 px-1">
              <span className="text-emerald-400">Yield YES</span>
              <span className="text-zinc-500 font-mono italic">{market.probability}% ALPHA</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${market.probability}%` }}
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 px-1">
              <span className="text-neon-pink">Yield NO</span>
              <span className="text-zinc-500 font-mono italic">{100 - market.probability}% ALPHA</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${100 - market.probability}%` }}
                className="h-full bg-neon-pink rounded-full shadow-[0_0_10px_rgba(255,0,85,0.5)]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-white/5">
          <button className="py-3.5 rounded-2xl bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 text-[10px] font-black hover:bg-emerald-600 hover:text-black transition-all uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/5 active:scale-95">
            Stake YES
          </button>
          <button className="py-3.5 rounded-2xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-[10px] font-black hover:bg-neon-pink hover:text-black transition-all uppercase tracking-[0.2em] shadow-lg shadow-neon-pink/5 active:scale-95">
            Stake NO
          </button>
        </div>
      </div>
      
      {/* Decorative Alpha Glow */}
      <div className="absolute -bottom-10 -right-10 h-24 w-24 bg-neon-cyan/5 blur-3xl group-hover:bg-neon-cyan/10 transition-colors" />
    </motion.div>
  );
};
