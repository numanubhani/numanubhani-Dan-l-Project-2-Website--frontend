import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Grid, 
  Play, 
  ShoppingBag, 
  TrendingUp, 
  Mail, 
  Settings,
  Edit2,
  Users,
  Plus
} from 'lucide-react';
import { mockUser, mockVideos } from '../mockData';
import { VideoCard } from '../components/common/VideoCard';
import { motion } from 'motion/react';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState<'videos' | 'reels' | 'markets' | 'shop'>('videos');
  const userVideos = mockVideos.filter(v => v.type === 'long');
  const userReels = mockVideos.filter(v => v.type === 'short');

  const stats = [
    { label: 'Subscribers', value: '12.5K', icon: Users },
    { label: 'Following', value: '450', icon: Users },
    { label: 'Pulse Balance', value: `$${mockUser.balance.toLocaleString()}`, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen">
      {/* Header / Banner Area */}
      <div className="relative h-48 w-full bg-gradient-to-r from-neon-purple/20 via-neon-cyan/20 to-neon-pink/20 lg:h-80 overflow-hidden">
         <div className="absolute inset-0 bg-void/60 backdrop-blur-3xl" />
         <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-void to-transparent" />
         {/* HUD Scanlines */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
      </div>

      <div className="px-6 lg:px-16 -mt-20 lg:-mt-32 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-white/5">
          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 text-center lg:text-left">
            <div className="relative group">
              <div className="h-32 w-32 lg:h-48 lg:w-48 overflow-hidden rounded-[2.5rem] border-4 border-void shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-zinc-900 ring-1 ring-white/10 group-hover:border-neon-cyan transition-all duration-500">
                <img src={mockUser.avatar} alt="Me" className="h-full w-full object-cover transition-transform group-hover:scale-110 opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
              </div>
              <button className="absolute -bottom-2 -right-2 rounded-xl bg-neon-cyan p-3 text-black shadow-2xl hover:scale-110 active:scale-95 transition-all">
                <Edit2 className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase italic leading-none">{mockUser.username}</h1>
                <div className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/20 px-3 py-1 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-neon-cyan animate-pulse" />
                  <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">VERIFIED-X</span>
                </div>
              </div>
              <p className="text-zinc-500 font-bold max-w-sm text-xs md:text-sm uppercase tracking-tight leading-relaxed">{mockUser.bio}</p>
              
              <div className="flex justify-center lg:justify-start gap-8 pt-2">
                 {stats.map((stat, i) => (
                   <div key={i} className="flex flex-col items-center lg:items-start">
                      <span className="text-xl font-black text-white italic tracking-tighter">{stat.value}</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">{stat.label}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 lg:gap-4">
             <Link to="/studio" className="flex items-center gap-3 rounded-2xl bg-neon-cyan px-6 lg:px-8 py-3 lg:py-4 text-[10px] font-black text-black transition-all hover:brightness-110 active:scale-95 uppercase tracking-widest shadow-[0_0_20px_rgba(0,243,255,0.3)]">
               <Plus className="h-4 w-4" />
               CREATOR STUDIO
             </Link>
             <button className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-5 lg:px-6 py-3 lg:py-4 text-[10px] font-black text-white hover:bg-white/10 active:scale-95 uppercase tracking-widest transition-all">
               <Edit2 className="h-4 w-4" />
               SYSTEM CONFIG
             </button>
             <div className="flex gap-3">
               <button className="rounded-2xl bg-white/5 p-3 lg:p-4 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-white">
                 <Settings className="h-5 w-5" />
               </button>
               <button className="rounded-2xl bg-white/5 p-3 lg:p-4 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-white">
                 <Mail className="h-5 w-5" />
               </button>
             </div>
          </div>
        </div>

        {/* Dynamic Tabs */}
        <div className="profile-tabs sticky top-20 z-30 flex gap-10 border-b border-white/5 bg-void/80 backdrop-blur-xl mt-6 px-4 no-scrollbar overflow-x-auto">
           {[ 
             { id: 'videos', label: 'Videos', icon: Grid },
             { id: 'reels', label: 'Reels', icon: Play },
             { id: 'markets', label: 'Markets', icon: TrendingUp },
             { id: 'shop', label: 'Store', icon: ShoppingBag }
           ].map((tab) => {
             const isActive = activeTab === tab.id;
             return (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-3 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${
                   isActive ? "text-neon-cyan" : "text-zinc-500 hover:text-white"
                 }`}
               >
                 <tab.icon className={cn("h-4 w-4", isActive && "text-neon-cyan")} />
                 {tab.label}
                 {isActive && (
                   <motion.div 
                     layoutId="profileTab" 
                     className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.5)]" 
                   />
                 )}
               </button>
             )
           })}
        </div>

        <div className="py-8">
           {activeTab === 'videos' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {userVideos.map(v => <VideoCard key={v.id} video={v} />)}
               {userVideos.map(v => <VideoCard key={`dup-${v.id}`} video={v} />)}
             </div>
           )}

           {activeTab === 'reels' && (
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {userReels.map(v => (
                  <div key={v.id} className="aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden border border-white/5 group relative cursor-pointer">
                     <img src={v.thumbnail} alt="reel" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-white">
                           <Play className="h-3 w-3 fill-white" /> {v.views}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'markets' && (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <TrendingUp className="h-16 w-16 text-zinc-800 mb-4" />
                <h3 className="text-xl font-bold text-zinc-100">No active trades</h3>
                <p className="text-sm text-zinc-500 max-w-xs mt-2">You haven't participated in any prediction markets yet. Start trading to earn Pulses.</p>
             </div>
           )}

           {activeTab === 'shop' && (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingBag className="h-16 w-16 text-zinc-800 mb-4" />
                <h3 className="text-xl font-bold text-zinc-100">Store is empty</h3>
                <p className="text-sm text-zinc-500 max-w-xs mt-2">List products in your store to start selling to your audience.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
