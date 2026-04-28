import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  Users,
  Radio,
  ShoppingBag,
  TrendingUp,
  PlusSquare,
  User,
  Bell,
  MoreVertical,
  LayoutDashboard,
  ShieldCheck,
  Search,
  Zap,
  Sun,
  Moon,
  CreditCard,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = ({
  collapsed,
  onToggle
}: {
  collapsed: boolean;
  onToggle: () => void
}) => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Explore', icon: Compass, path: '/explore' },
    { label: 'Following', icon: Users, path: '/following' },
    { label: 'Live', icon: Radio, path: '/live' },
    { label: 'Shop', icon: ShoppingBag, path: '/shop' },
    { label: 'Markets', icon: TrendingUp, path: '/polymarket' },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 hidden h-full flex-col border-r-2 border-neon-pink bg-void p-6 lg:flex z-50 transition-all duration-300",
      collapsed ? "w-24 items-center" : "w-64"
    )}>
      <div className="flex items-center justify-between mb-10 w-full">
        <Link to="/" className={cn("flex items-center gap-3 px-2 overflow-hidden", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
          <div className="flex h-10 w-10 min-w-[40px] items-center justify-center rounded-xl bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.4)] font-black text-black italic">
            V
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic">VPULSE</span>
        </Link>
        <button
          onClick={onToggle}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-500 hover:text-neon-cyan"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <LayoutDashboard className="h-5 w-5" />
          </motion.div>
        </button>
      </div>

      <nav className="flex-1 space-y-2 w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-4 rounded-2xl transition-all",
                collapsed ? "justify-center p-3.5" : "px-4 py-3.5",
                isActive ? "bg-white/5 text-neon-cyan shadow-xl shadow-cyan-500/5 border border-white/5" : "text-zinc-500 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-neon-cyan" : "text-zinc-500 group-hover:text-white")} />
              {!collapsed && <span className="font-black uppercase tracking-widest text-[10px] whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn(
        "creator-hub-card mt-auto p-6 rounded-[2rem] bg-white/5 border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-300",
        collapsed ? "scale-0 opacity-0 h-0 p-0 overflow-hidden" : "scale-100 opacity-100"
      )}>
        <div className="relative z-10 text-center lg:text-left">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-2 flex items-center gap-2">
            <Zap className="h-3 w-3 text-neon-purple animate-pulse" />
            {!collapsed && "Creator Hub"}
          </p>
          {!collapsed && (
            <>
              <p className="text-[10px] text-zinc-400 mb-6 font-bold leading-relaxed tracking-tight group-hover:text-white transition-colors">Upload videos, go live, and create pulse markets.</p>
              <Link to="/stream/start" className="block w-full py-3 bg-neon-cyan text-black text-center rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:brightness-110 active:scale-95 transition-all">
                GO LIVE NOW
              </Link>
            </>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
      </div>
    </aside>
  );
};

import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export const TopBar = ({
  collapsed,
  onAddCoins,
  theme,
  onToggleTheme
}: {
  collapsed: boolean;
  onAddCoins: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}) => {
  const { user, logout } = useAuth();
  return (
    <header className="app-topbar sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-void/80 px-4 backdrop-blur-xl lg:px-10">
      <div className="flex flex-1 items-center gap-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-neon-cyan flex items-center justify-center font-black text-black italic shadow-[0_0_15px_rgba(0,243,255,0.3)]">V</div>
        </Link>
        <div className="h-10 w-[2px] bg-white/5" />
      </div>

      <div className="hidden max-w-xl flex-1 lg:block">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-neon-cyan" />
          <input
            type="text"
            placeholder="SEARCH CREATORS, STREAMS OR MARKETS..."
            className={cn(
              "top-search-input rounded-2xl bg-white/5 px-6 py-3.5 pl-12 text-[10px] font-black tracking-widest outline-none border border-white/5 focus:border-neon-cyan/30 focus:ring-0 transition-all text-white placeholder:text-zinc-600 uppercase w-full max-w-[450px]"
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleTheme}
          className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:border-neon-cyan transition-all"
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Link
          to="/stream/start"
          className="flex md:hidden items-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan text-black text-[9px] font-black uppercase tracking-[0.14em] shadow-[0_0_16px_rgba(0,243,255,0.25)] active:scale-95 transition-all"
        >
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Live
        </Link>

        <div
          onClick={onAddCoins}
          className="top-wallet hidden md:flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 group cursor-pointer hover:border-white/20 transition-all"
        >
          <div className="top-wallet-coin w-4 h-4 bg-amber-coin rounded-full flex items-center justify-center text-[10px] text-black font-black">$</div>
          <span className="top-wallet-amount text-xs font-black text-white tracking-widest">12,450.00</span>
          <button className="top-wallet-plus ml-2 text-neon-cyan font-black text-xl hover:scale-110 active:scale-90 transition-transform">+</button>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/stream/start" className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-neon-cyan text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:brightness-110 transition-all">
            <Radio className="h-3 w-3 animate-pulse" />
            GO LIVE
          </Link>

          <div className="h-10 w-[1px] bg-white/5 hidden sm:block" />

          <button className="relative w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/5 transition-all group">
            <Bell className="h-5 w-5 text-zinc-500 group-hover:text-neon-cyan transition-colors" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-neon-pink rounded-full shadow-[0_0_10px_rgba(255,0,85,0.5)]"></span>
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-white shadow-xl overflow-hidden group-hover:border-neon-purple transition-all">
                  {user.avatar || user.avatar_url ? (
                    <img src={user.avatar || user.avatar_url} alt={user.username} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <span className="uppercase text-lg">{user.username.charAt(0)}</span>
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none gap-1">
                  <span className="text-xs font-black text-white uppercase italic tracking-tighter">{user.username}</span>
                  <span className="text-[8px] font-black text-neon-purple uppercase tracking-[0.2em] animate-pulse">Online</span>
                </div>
              </Link>
              <button onClick={logout} className="p-2 rounded-xl text-zinc-500 hover:bg-white/5 hover:text-neon-pink transition-all">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="px-6 py-2.5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export const MobileNav = () => {
  const location = useLocation();
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Compass, path: '/explore', label: 'Explore' },
    { icon: Radio, path: '/live', label: 'Live' },
    { icon: TrendingUp, path: '/polymarket', label: 'Markets' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="app-mobile-nav fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-white/5 bg-void/90 px-4 backdrop-blur-2xl lg:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 transition-all active:scale-90",
              isActive ? "text-neon-cyan" : "text-zinc-600"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              isActive && "bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,243,255,0.2)] border border-neon-cyan/20"
            )}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('vpulse-theme');
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vpulse-theme', theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-void text-zinc-300 font-sans selection:bg-neon-cyan/30 selection:text-white overflow-x-hidden">
      <Toaster
        richColors
        position="top-right"
        theme={theme}
        toastOptions={{
          className: 'bg-void border border-white/5 rounded-2xl shadow-2xl font-black uppercase tracking-widest text-[10px]',
        }}
      />

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-void border border-white/10 rounded-[2.5rem] p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Injective Assets</h2>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Add payment method to start staking</p>
                </div>
                <button onClick={() => setShowAddCard(false)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-500">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Cardholder Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Name on Card</label>
                    <input type="text" placeholder="John Doe" className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white text-sm outline-none focus:border-neon-cyan transition-colors placeholder:text-zinc-600" />
                  </div>

                  {/* Card Number */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input type="text" placeholder="0000 0000 0000 0000" className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-white font-mono text-sm outline-none focus:border-neon-cyan transition-colors placeholder:text-zinc-600 tracking-wider" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex">
                        <div className="w-6 h-4 bg-red-500/80 rounded-full opacity-80" />
                        <div className="w-6 h-4 bg-amber-500/80 rounded-full opacity-80 -ml-3 mix-blend-screen" />
                      </div>
                    </div>
                  </div>

                  {/* Expiry & CVC */}
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Expiry Date</label>
                      <input type="text" placeholder="MM/YY" className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-mono text-sm outline-none focus:border-neon-cyan transition-colors placeholder:text-zinc-600 tracking-wider" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">CVC</label>
                      <div className="relative">
                        <input type="password" placeholder="123" maxLength={4} className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-mono text-sm outline-none focus:border-neon-cyan transition-colors placeholder:text-zinc-600 tracking-widest" />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-500 bg-white/5 p-3 rounded-xl border border-white/5">
                  <ShieldCheck className="h-4 w-4 text-neon-cyan" />
                  <span className="text-[9px] uppercase tracking-widest font-bold">Payments are secure and encrypted</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddCard(false)}
                    className="flex-1 py-3.5 bg-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 py-3.5 bg-neon-cyan text-black rounded-xl text-[10px] font-black uppercase tracking-[0.1em] shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all">
                    Proceed Payment
                  </button>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300 min-w-0",
        isSidebarCollapsed ? "lg:pl-24" : "lg:pl-64"
      )}>
        <TopBar
          collapsed={isSidebarCollapsed}
          onAddCoins={() => setShowAddCard(true)}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />
        <main className="flex-1 pb-24 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={useLocation().pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
