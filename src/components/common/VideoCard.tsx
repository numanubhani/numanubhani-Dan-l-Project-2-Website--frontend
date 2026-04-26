import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, MessageCircle, MoreVertical } from 'lucide-react';
import { Video } from '../../types';
import { motion } from 'motion/react';

interface VideoCardProps {
  video: Video;
  horizontal?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, horizontal }) => {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={horizontal 
        ? "video-card flex flex-col md:flex-row gap-6 group w-full" 
        : "video-card flex flex-col gap-4 group w-full h-full"
      }
    >
      <Link to={`/watch/${video.id}`} className={horizontal ? "w-full md:w-64 aspect-video flex-shrink-0" : "w-full aspect-video flex-shrink-0"}>
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/5 shadow-2xl group-hover:border-neon-cyan/30 transition-all duration-500">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-0 transition-opacity duration-500" />
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10">
             <div className="h-14 w-14 rounded-full bg-neon-cyan/20 backdrop-blur-xl flex items-center justify-center border border-neon-cyan/40 shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                <Play className="h-7 w-7 text-neon-cyan fill-neon-cyan" />
             </div>
          </div>
          
          <div className="absolute bottom-4 right-4 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-black text-white tracking-widest">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </Link>

      <div className="flex gap-4 px-2 min-w-0 flex-1">
        {!horizontal && (
          <Link to="/profile" className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white/5 group-hover:border-neon-purple/50 transition-all ring-2 ring-transparent group-hover:ring-neon-purple/20">
            <img src={video.creator.avatar} alt={video.creator.username} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          </Link>
        )}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h3 className="line-clamp-2 font-black text-zinc-100 group-hover:text-neon-cyan transition-colors leading-tight text-sm uppercase tracking-tight h-[40px] italic">
              {video.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
              <Link to="/profile" className="hover:text-neon-purple transition-colors">@{video.creator.username}</Link>
              <span className="h-1 w-1 rounded-full bg-zinc-800" />
              <span>{(video.views / 1000).toFixed(1)}K TRANSMISSIONS</span>
            </div>
          </div>
          <div className="mt-2 text-[8px] uppercase tracking-[0.3em] font-black text-zinc-800 group-hover:text-neon-purple/40 transition-colors flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-neon-cyan/20" />
            DEPLOY_SYNC: {video.createdAt}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ReelCard: React.FC<{ video: Video }> = ({ video }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="reel-card relative flex-shrink-0 group cursor-pointer"
    >
      <Link to={`/reel?v=${video.id}`} className="block relative aspect-[9/16] w-[160px] sm:w-[190px] lg:w-[220px] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 bg-zinc-900 shadow-2xl transition-all group-hover:border-neon-pink/40">
        <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
           <button className="h-10 w-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:text-neon-pink hover:border-neon-pink/30 transition-all">
             <Heart className="h-5 w-5" />
           </button>
           <button className="h-10 w-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
             <MessageCircle className="h-5 w-5" />
           </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg overflow-hidden border border-white/10">
              <img src={video.creator.avatar} alt={video.creator.username} className="h-full w-full object-cover" />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">@{video.creator.username}</span>
          </div>
          <h4 className="line-clamp-2 text-xs font-black text-white italic uppercase tracking-tight leading-snug drop-shadow-lg">{video.title}</h4>
          <div className="pt-2 flex items-center gap-2 text-[8px] font-black text-neon-cyan uppercase tracking-[0.2em]">
             <Play className="h-3 w-3 fill-neon-cyan" />
             <span>{(video.views / 1000).toFixed(0)}K PULSES</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
