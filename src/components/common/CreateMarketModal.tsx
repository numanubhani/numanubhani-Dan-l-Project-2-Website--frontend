import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { Market } from '../../types';
import { MarketCard } from './MarketCard';
import { cn } from '@/lib/utils';
import { createMarketDraft } from '../../services/predictionMarkets';

const CATEGORIES: Market['category'][] = [
  'Politics',
  'Crypto',
  'Sports',
  'Gaming',
  'Entertainment',
];

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (market: Market) => void;
}

export const CreateMarketModal: React.FC<CreateMarketModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<Market['category']>('Entertainment');
  const [endDate, setEndDate] = useState('');
  const [labelYes, setLabelYes] = useState('Vote YES');
  const [labelNo, setLabelNo] = useState('Vote NO');

  useEffect(() => {
    if (isOpen) {
      setQuestion('');
      setCategory('Entertainment');
      setEndDate('');
      setLabelYes('Vote YES');
      setLabelNo('Vote NO');
    }
  }, [isOpen]);

  const resolvedLabelYes = labelYes.trim() || 'Vote YES';
  const resolvedLabelNo = labelNo.trim() || 'Vote NO';

  const previewMarket: Market = {
    id: 'preview',
    title: question.trim() || 'Your question will appear here',
    category,
    votesYes: 0,
    votesNo: 0,
    buttonLabelYes: resolvedLabelYes,
    buttonLabelNo: resolvedLabelNo,
    userVote: null,
    volume: 0,
    endDate: endDate.trim() || '—',
    image: `https://picsum.photos/seed/${Math.abs(question.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 1)}/400/200`,
  };

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q) {
      toast.error('QUESTION REQUIRED', {
        description: 'Enter what traders will predict on.',
      });
      return;
    }

    try {
      const market = await createMarketDraft({
        title: q,
        category,
        buttonLabelYes: resolvedLabelYes,
        buttonLabelNo: resolvedLabelNo,
        volume: 0,
        endDate: endDate.trim() || 'TBD',
        image: `https://picsum.photos/seed/${encodeURIComponent(q.slice(0, 32))}/400/200`,
      });
      onCreate(market);
      toast.success('MARKET LIVE', {
        description: 'Your real-time market is saved and listed.',
      });
      onClose();
    } catch (e: unknown) {
      const ax = e as { response?: { status?: number; data?: { detail?: string } } };
      if (ax.response?.status === 401) {
        toast.error('SIGN IN REQUIRED', { description: 'Log in to publish a market.' });
        return;
      }
      const detail =
        typeof ax.response?.data?.detail === 'string' ? ax.response.data.detail : 'Could not save the market.';
      toast.error('PUBLISH FAILED', { description: detail });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 24 }}
            className="relative my-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-neon-cyan/20 bg-zinc-950 shadow-[0_0_50px_rgba(0,243,255,0.12)]"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />

            <div className="flex max-h-[90vh] flex-col overflow-hidden lg:max-h-[min(90vh,860px)] lg:flex-row">
              {/* Form */}
              <div className="flex min-h-0 flex-1 flex-col border-b border-white/5 p-6 sm:p-8 lg:max-w-xl lg:border-b-0 lg:border-r">
                <div className="mb-8 flex shrink-0 items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neon-cyan shadow-[0_0_20px_rgba(0,243,255,0.35)]">
                      <TrendingUp className="h-6 w-6 text-black stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase italic tracking-tighter text-white sm:text-2xl">
                        Create market
                      </h2>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-neon-cyan">
                        Real-time preview
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:border-neon-cyan/50 hover:bg-neon-cyan/10"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5 text-zinc-500 transition-colors group-hover:text-neon-cyan" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
                  <div>
                    <label
                      htmlFor="market-question"
                      className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
                    >
                      Question
                    </label>
                    <textarea
                      id="market-question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={3}
                      placeholder="Will AI surpass human coding by 2027?"
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-neon-cyan/50"
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Category
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                            category === c
                              ? 'border-white bg-white text-black'
                              : 'border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-white',
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-zinc-500">
                    YES and NO yields are not set by the creator. Both start at 0% with zero votes; each vote updates the
                    bars to match the vote split. You can rename the two outcome buttons below (defaults: Vote YES / Vote NO).
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="market-label-yes"
                        className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
                      >
                        YES button label
                      </label>
                      <input
                        id="market-label-yes"
                        type="text"
                        value={labelYes}
                        onChange={(e) => setLabelYes(e.target.value)}
                        placeholder="Vote YES"
                        maxLength={48}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="market-label-no"
                        className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
                      >
                        NO button label
                      </label>
                      <input
                        id="market-label-no"
                        type="text"
                        value={labelNo}
                        onChange={(e) => setLabelNo(e.target.value)}
                        placeholder="Vote NO"
                        maxLength={48}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="market-end"
                      className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
                    >
                      Resolution / end <span className="font-normal normal-case tracking-normal text-zinc-600">(optional)</span>
                    </label>
                    <input
                      id="market-end"
                      type="text"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="Leave empty or add a date"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                </div>

                <div className="mt-6 flex shrink-0 flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end sm:gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-zinc-600/80 bg-zinc-900/50 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-300 transition-all hover:border-zinc-500 hover:bg-white/5 hover:text-white sm:w-auto sm:min-w-[11rem]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-cyan-vpulse px-6 text-sm font-black tracking-[0.18em] text-white shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 hover:text-black active:scale-[0.98] sm:w-auto sm:min-w-[12rem]"
                  >
                    Publish Market...
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="flex min-h-0 flex-1 flex-col bg-black/20 p-6 sm:p-8">
                <p className="mb-4 shrink-0 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                  Card preview
                </p>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="mx-auto max-w-md pb-2">
                    <MarketCard market={previewMarket} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
