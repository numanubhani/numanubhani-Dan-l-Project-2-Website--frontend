import React, { useState } from 'react';
import { mockMarkets } from '../mockData';
import { MarketCard } from '../components/common/MarketCard';
import { TrendingUp, Search, Filter, Globe, Cpu, User } from 'lucide-react';
import { motion } from 'motion/react';

const PredictionMarket = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Politics', 'Crypto', 'Sports', 'Gaming', 'Entertainment'];

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-cyan-vpulse/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-cyan-vpulse" />
             </div>
             <h1 className="text-3xl font-black uppercase tracking-tighter">Prediction Markets</h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight">Trade on world outcomes. Stake your pulses on reality.</p>
        </div>

        <div className="flex flex-wrap gap-2">
           <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-bold hover:bg-white/10 transition-all">
             My Trades
           </button>
           <button className="flex items-center gap-2 rounded-xl bg-cyan-vpulse text-black px-6 py-3 text-sm font-bold hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/20 active:scale-95">
             <TrendingUp className="h-4 w-4" />
             Create Market
           </button>
        </div>
      </div>

      {/* Discovery / Filter Rail */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex-1 no-scrollbar overflow-x-auto">
          <div className="market-tag-bar flex gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`market-tag-chip rounded-full px-6 py-2 text-xs font-black uppercase tracking-widest border transition-all ${
                  activeCategory === cat 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative group min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-vpulse transition-colors" />
          <input 
            type="text" 
            placeholder="Search markets..." 
            className="w-full rounded-xl bg-white/5 border border-white/5 py-3 pl-11 pr-4 text-sm outline-none focus:border-cyan-vpulse transition-all"
          />
        </div>
      </div>

      {/* Grid of Markets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockMarkets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
        {/* Fill for visual density */}
        {[...mockMarkets, ...mockMarkets, ...mockMarkets].map((market, i) => (
          <MarketCard key={`${market.id}-${i}`} market={market} />
        ))}
      </div>

      {/* Ecosystem Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-12">
         <div className="rounded-3xl bg-gradient-to-br from-purple-vpulse/40 to-void p-10 border border-white/10 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
               <Globe className="h-10 w-10 text-purple-vpulse" />
               <h2 className="text-3xl font-black uppercase tracking-tighter">Decentralized Trust</h2>
               <p className="text-zinc-400 font-medium max-w-md">VPULSE markets use community-driven evidence to resolve outcomes. No central middleman, just pure prediction.</p>
               <button className="px-8 py-3 rounded-xl bg-white text-black font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5">
                 Learn How It Works
               </button>
            </div>
            <div className="absolute -top-10 -right-10 h-64 w-64 bg-purple-600 rounded-full blur-[100px] opacity-10 group-hover:opacity-30 transition-opacity" />
         </div>

         <div className="rounded-3xl bg-gradient-to-br from-cyan-vpulse/40 to-void p-10 border border-white/10 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
               <Cpu className="h-10 w-10 text-cyan-vpulse" />
               <h2 className="text-3xl font-black uppercase tracking-tighter">Creator Odds</h2>
               <p className="text-zinc-400 font-medium max-w-md">Apply for Pro Creator status to launch exclusive markets for your community and earn a percentage of the volume.</p>
               <button className="px-8 py-3 rounded-xl bg-cyan-vpulse text-black font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyan-500/20">
                 Apply for Pro
               </button>
            </div>
             <div className="absolute -top-10 -right-10 h-64 w-64 bg-cyan-400 rounded-full blur-[100px] opacity-10 group-hover:opacity-30 transition-opacity" />
         </div>
      </div>
    </div>
  );
};

export default PredictionMarket;
