import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, X, ShieldCheck, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  isMandatory?: boolean;
}

export const BetModal: React.FC<BetModalProps> = ({ isOpen, onClose, marketTitle, isMandatory }) => {
  const [amount, setAmount] = useState('');
  const [selection, setSelection] = useState<'YES' | 'NO' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBet = () => {
    if (!selection) {
      toast.error('SELECTION REQUIRED', {
        description: 'Choose YES or NO to continue.',
        className: 'bg-zinc-950 border-rose-500 text-rose-500 font-black tracking-widest uppercase',
      });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('INVALID STAKE', {
        description: 'Enter a valid pulse amount.',
        className: 'bg-zinc-950 border-rose-500 text-rose-500 font-black tracking-widest uppercase',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate chain interaction
    setTimeout(() => {
      toast.success('PULSE RECORDED', {
        description: `Staked ${amount} on ${selection}. Oracle processing...`,
        className: 'bg-zinc-950 border-neon-cyan text-neon-cyan font-black tracking-widest uppercase shadow-[0_0_15px_rgba(0,243,255,0.3)]',
      });
      setIsSubmitting(false);
      onClose();
      // Reset state
      setAmount('');
      setSelection(null);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop - Strict Blocking */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isMandatory && onClose()}
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-[2.5rem] lg:rounded-[3rem] border border-neon-cyan/20 bg-zinc-950 p-6 sm:p-8 lg:p-10 shadow-[0_0_50px_rgba(0,243,255,0.1)]"
          >
            {/* Pulsing Neon Border Effect */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-pulse" />

            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neon-cyan shadow-[0_0_20px_rgba(0,243,255,0.4)]">
                  <TrendingUp className="h-7 w-7 text-black stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">Market Pulse</h2>
                  <p className="text-[10px] font-black tracking-[0.2em] text-neon-cyan uppercase mt-1">Status: Verification Required</p>
                </div>
              </div>
              {!isMandatory && (
                <button 
                  onClick={onClose}
                  className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group hover:border-neon-cyan/50 hover:bg-neon-cyan/10 transition-all"
                >
                  <X className="h-5 w-5 text-zinc-500 group-hover:text-neon-cyan transition-colors" />
                </button>
              )}
            </div>

            <div className="space-y-8">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2">
                   <div className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-[8px] font-black rounded border border-neon-purple/30 uppercase tracking-widest">Active</div>
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Alpha Event</p>
                <h3 className="text-xl font-bold text-zinc-100 leading-tight tracking-tight uppercase">{marketTitle}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSelection('YES')}
                  disabled={isSubmitting}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-8 transition-all active:scale-95 disabled:opacity-50",
                    selection === 'YES' 
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                      : "border-white/5 bg-white/5 text-zinc-500 hover:border-white/20"
                  )}
                >
                  <span className="text-3xl font-black italic">YES</span>
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">1.82x Boost</span>
                </button>
                <button 
                  onClick={() => setSelection('NO')}
                  disabled={isSubmitting}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-8 transition-all active:scale-95 disabled:opacity-50",
                    selection === 'NO' 
                      ? "border-neon-pink bg-neon-pink/10 text-neon-pink shadow-[0_0_20px_rgba(255,0,85,0.2)]" 
                      : "border-white/5 bg-white/5 text-zinc-500 hover:border-white/20"
                  )}
                >
                  <span className="text-3xl font-black italic">NO</span>
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">2.14x Boost</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Stake Amount</p>
                  <p className="text-[10px] font-black text-neon-cyan uppercase tracking-widest underline decoration-neon-cyan/30 underline-offset-4">Available: $12k+</p>
                </div>
                <div className="relative group">
                  <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-cyan group-focus-within:scale-110 transition-transform" />
                  <input 
                    type="number" 
                    value={amount}
                    disabled={isSubmitting}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="ENTER PULSE..." 
                    className="w-full rounded-2xl bg-white/5 px-14 py-5 text-lg font-mono outline-none border border-white/5 focus:border-neon-cyan/50 focus:bg-neon-cyan/5 transition-all text-white placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div className="bg-neon-purple/5 border border-neon-purple/20 rounded-2xl p-5 flex items-center gap-4">
                <ShieldCheck className="h-6 w-6 text-neon-purple flex-shrink-0" />
                <p className="text-[10px] leading-relaxed text-zinc-400 font-medium">
                  Protocol: Secure Pulse Execution. All bets are final once recorded on the V-Pulse Network. High volatility environment detected.
                </p>
              </div>

              <button 
                onClick={handleBet}
                disabled={isSubmitting}
                className="w-full h-20 rounded-[1.5rem] bg-neon-cyan font-black text-black text-xl tracking-[0.2em] hover:brightness-110 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(0,243,255,0.3)] uppercase italic flex items-center justify-center disabled:opacity-50 disabled:grayscale"
              >
                {isSubmitting ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-8 w-8 border-4 border-black/20 border-t-black rounded-full"
                  />
                ) : "CONFIRM POSITION"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Helper function
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
