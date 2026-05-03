import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, TrendingUp, Video, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMenu = ({ isOpen, onClose }: CreateMenuProps) => {
  const options = [
    { label: 'Challenge', icon: Flame, color: 'text-blue-400', path: '/studio?tab=challenge', desc: 'Sponsor a creator stunt' },
    { label: 'Prediction', icon: TrendingUp, color: 'text-orange-400', path: '/polymarket', desc: 'Predict global events' },
    { label: 'Video', icon: Video, color: 'text-purple-400', path: '/studio?tab=upload', desc: 'Upload a short or reel' },
    { label: 'Go Live', icon: Radio, color: 'text-red-400', path: '/go-live', desc: 'Start a stream now' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-obsidian border border-white/10 rounded-t-[2.5rem] lg:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Create Something</h2>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                <X className="h-6 w-6 text-zinc-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {options.map((opt) => (
                <Link
                  key={opt.label}
                  to={opt.path}
                  onClick={onClose}
                  className="group flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-cyan/30 hover:bg-white/10 transition-all"
                >
                  <div className={`p-4 rounded-xl bg-white/5 group-hover:scale-110 transition-transform ${opt.color}`}>
                    <opt.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-widest text-xs text-white">{opt.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 font-bold">{opt.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] text-center">Fueling the neon pulse</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
