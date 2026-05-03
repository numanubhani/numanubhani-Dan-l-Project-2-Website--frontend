import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Market } from '../../types';
import { motion } from 'motion/react';
import { marketYieldFromVotes } from '@/lib/marketVotes';
import { cn } from '@/lib/utils';

interface MarketCardProps {
  market: Market;
  /** When set, Vote YES / Vote NO update tallies (typically from parent state). */
  onVote?: (side: 'yes' | 'no') => void;
}

const DEFAULT_YES = 'Vote YES';
const DEFAULT_NO = 'Vote NO';

export const MarketCard: React.FC<MarketCardProps> = ({ market, onVote }) => {
  const { yesPct, noPct, totalVotes, awaitingVotes } = marketYieldFromVotes(market);
  const yesCta = market.buttonLabelYes?.trim() || DEFAULT_YES;
  const noCta = market.buttonLabelNo?.trim() || DEFAULT_NO;
  const hasVoted = market.userVote === 'yes' || market.userVote === 'no';
  const canVote = Boolean(onVote) && !hasVoted;

  return (
    <motion.div 
      whileHover={{ zIndex: 10 }}
      className="market-card group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl transition-all hover:border-neon-cyan/20 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)] hover:z-10"
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
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
          {awaitingVotes ? (
            <>Awaiting votes · both yields start at 0% until the first vote</>
          ) : (
            <>
              {totalVotes} vote{totalVotes === 1 ? '' : 's'} · yields follow vote share
            </>
          )}
        </p>

        {/* Vote-share bars */}
        <div className="space-y-5">
          <div className="relative">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 px-1">
              <span className="text-emerald-400">Yield YES</span>
              <span className="text-zinc-500 font-mono italic">
                <span className="text-emerald-400/90">{yesPct}%</span> YES · ALPHA
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${yesPct}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 px-1">
              <span className="text-neon-pink">Yield NO</span>
              <span className="text-zinc-500 font-mono italic">
                <span className="text-neon-pink/90">{noPct}%</span> NO · ALPHA
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${noPct}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="h-full bg-neon-pink rounded-full shadow-[0_0_10px_rgba(255,0,85,0.5)]"
              />
            </div>
          </div>
        </div>

        {hasVoted && (
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Your vote is final · you chose{' '}
            <span className={market.userVote === 'yes' ? 'text-emerald-400' : 'text-neon-pink'}>
              {market.userVote === 'yes' ? yesCta : noCta}
            </span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-white/5">
          <button
            type="button"
            disabled={!canVote}
            onClick={() => canVote && onVote?.('yes')}
            title={hasVoted ? 'You already voted on this market' : yesCta}
            className={cn(
              'min-h-[3rem] rounded-2xl border bg-emerald-600/10 border-emerald-600/30 px-2 py-3 text-center text-emerald-400 text-[9px] font-black uppercase leading-tight tracking-[0.12em] shadow-lg shadow-emerald-500/5 transition-all sm:text-[10px] sm:tracking-[0.18em]',
              canVote && 'hover:bg-emerald-600 hover:text-black active:scale-95',
              !canVote && 'cursor-not-allowed opacity-45',
            )}
          >
            {yesCta}
          </button>
          <button
            type="button"
            disabled={!canVote}
            onClick={() => canVote && onVote?.('no')}
            title={hasVoted ? 'You already voted on this market' : noCta}
            className={cn(
              'min-h-[3rem] rounded-2xl border bg-neon-pink/10 border-neon-pink/30 px-2 py-3 text-center text-neon-pink text-[9px] font-black uppercase leading-tight tracking-[0.12em] shadow-lg shadow-neon-pink/5 transition-all sm:text-[10px] sm:tracking-[0.18em]',
              canVote && 'hover:bg-neon-pink hover:text-black active:scale-95',
              !canVote && 'cursor-not-allowed opacity-45',
            )}
          >
            {noCta}
          </button>
        </div>
      </div>
      
      {/* Decorative Alpha Glow */}
      <div className="absolute -bottom-10 -right-10 h-24 w-24 bg-neon-cyan/5 blur-3xl group-hover:bg-neon-cyan/10 transition-colors" />
    </motion.div>
  );
};
