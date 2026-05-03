import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MarketCard } from '../components/common/MarketCard';
import { CreateMarketModal } from '../components/common/CreateMarketModal';
import { Market } from '../types';
import { fetchMarkets, voteMarket } from '../services/predictionMarkets';
import { TrendingUp, Search } from 'lucide-react';
import { toast } from 'sonner';

const PredictionMarket = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const categories = ['All', 'Politics', 'Crypto', 'Sports', 'Gaming', 'Entertainment'];

  const loadMarkets = useCallback(async () => {
    try {
      const list = await fetchMarkets();
      setMarkets(list);
    } catch {
      toast.error('Could not load markets', { description: 'Check that the API is running.' });
    }
  }, []);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const visibleMarkets = useMemo(() => {
    if (activeCategory === 'All') return markets;
    return markets.filter((m) => m.category === activeCategory);
  }, [markets, activeCategory]);

  const registerVote = async (marketId: string, side: 'yes' | 'no') => {
    try {
      const updated = await voteMarket(marketId, side);
      setMarkets((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (e: unknown) {
      const st = (e as { response?: { status?: number } }).response?.status;
      if (st === 400) {
        await loadMarkets();
        toast.message('Already voted', {
          description: 'Each account gets one vote per market.',
        });
        return;
      }
      toast.error('Vote not recorded', { description: 'Sign in to vote on markets.' });
    }
  };

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
           <button
             type="button"
             onClick={() => setCreateOpen(true)}
             className="flex items-center gap-2 rounded-xl bg-cyan-vpulse text-white px-6 py-3 text-sm font-bold transition-all shadow-xl shadow-cyan-500/20 hover:bg-cyan-400 hover:text-black active:scale-95"
           >
             <TrendingUp className="h-4 w-4" />
             Create Market
           </button>
        </div>
      </div>

      <CreateMarketModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(market) =>
          setMarkets((prev) => [market, ...prev.filter((m) => m.id !== market.id)])
        }
      />

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
      {visibleMarkets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onVote={(side) => registerVote(market.id, side)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-8 py-16 text-center">
          <p className="text-sm font-bold text-zinc-400">No markets yet.</p>
          <p className="mt-2 text-xs text-zinc-600">Create a market to see it listed here.</p>
        </div>
      )}
    </div>
  );
};

export default PredictionMarket;
