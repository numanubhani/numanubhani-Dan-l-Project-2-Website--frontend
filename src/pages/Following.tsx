import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { User } from '../types';

function formatSubscribers(n?: number): string {
  const c = Number(n || 0);
  if (c >= 1_000_000) return `${(c / 1_000_000).toFixed(1)}M`;
  if (c >= 1000) return `${(c / 1000).toFixed(c >= 10000 ? 0 : 1)}K`;
  return String(c);
}

type FollowingRow = User & { is_live?: boolean };

export default function Following() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FollowingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<{ following: FollowingRow[] }>('/profile/me/following/')
      .then((res) => {
        if (!cancelled) setRows(Array.isArray(res.data?.following) ? res.data.following : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setRows([]);
          if (e.response?.status !== 401) {
            toast.error('Could not load following list.');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="p-8 lg:p-12 space-y-6 max-w-xl">
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Your Inner Circle</h1>
        <p className="text-sm text-zinc-400">Sign in to see channels you subscribe to.</p>
        <button
          type="button"
          onClick={() => navigate('/login', { state: { from: '/following' } })}
          className="rounded-2xl bg-neon-cyan px-6 py-3 text-xs font-black uppercase tracking-widest text-black"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Your Inner Circle</h1>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Operatives you are currently tracking</p>
      </div>

      {loading ? (
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500">
          You are not subscribed to any channels yet. Open a creator profile and tap Subscribe.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rows.map((profile) => {
            const profilePath = `/profile/user/${profile.id}`;
            const displayName = (profile.name || '').trim() || profile.username;
            const avatarSrc = (profile.avatar_url || (profile as { avatar?: string }).avatar || '').trim();
            return (
              <div
                key={profile.id}
                className="following-card group relative rounded-[2rem] bg-white/5 border border-white/5 p-6 hover:border-neon-cyan/30 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <Link to={profilePath} className="block">
                      <div
                        className={cn(
                          'h-24 w-24 rounded-[2rem] overflow-hidden border-2 transition-all duration-500 group-hover:rotate-6',
                          profile.is_live
                            ? 'border-neon-pink shadow-[0_0_20px_rgba(255,0,85,0.3)]'
                            : 'border-white/10'
                        )}
                      >
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt=""
                            className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-lg font-black text-zinc-300">
                            {(displayName || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </Link>
                    {profile.is_live ? (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-neon-pink text-white text-[8px] font-black rounded-lg uppercase tracking-widest shadow-xl">
                        LIVE
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <h3 className="text-sm font-black text-white tracking-widest uppercase italic truncate">{displayName}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold font-mono">@{profile.username}</p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                    <Users className="h-3 w-3 text-neon-cyan shrink-0" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {formatSubscribers(profile.followers_count)} subscribers
                    </span>
                  </div>

                  <Link
                    to={profilePath}
                    className="w-full py-3 rounded-xl bg-white/5 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all text-center"
                  >
                    View Profile
                  </Link>
                </div>

                <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      )}

      <div className="p-10 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-zinc-700 text-center space-y-4">
        <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
          <Radio className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest">Expansion Protocol Ready</p>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">
            Discover new creators to expand your grid awareness.
          </p>
        </div>
        <Link
          to="/explore"
          className="text-[10px] font-black uppercase tracking-widest text-neon-cyan hover:underline"
        >
          Open explore
        </Link>
      </div>
    </div>
  );
}
