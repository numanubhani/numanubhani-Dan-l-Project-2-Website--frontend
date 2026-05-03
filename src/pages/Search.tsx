import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { VideoCard } from '../components/common/VideoCard';
import { useAuth } from '../contexts/AuthContext';
import type { User, Video } from '../types';

type SearchChannelBlock = {
  profile: User;
  latest_videos: Video[];
};

type SearchPayload = {
  query: string;
  channels: SearchChannelBlock[];
  videos: Video[];
};

function formatSubscribers(n?: number): string {
  const c = Number(n || 0);
  if (c >= 1_000_000) return `${(c / 1_000_000).toFixed(1)}M subscribers`;
  if (c >= 1000) return `${(c / 1000).toFixed(1)}K subscribers`;
  return `${c} subscribers`;
}

function passesVideoChip(
  video: Record<string, unknown>,
  chip: 'all' | 'short' | 'long' | 'live'
): boolean {
  if (chip === 'all') return true;
  const vt = String((video as { video_type?: string }).video_type || '').toLowerCase();
  return vt === chip;
}

export default function Search() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qParam = (params.get('q') || '').trim();

  const [loading, setLoading] = useState(() => qParam.trim().length >= 2);
  const [data, setData] = useState<SearchPayload | null>(null);
  const [chip, setChip] = useState<'all' | 'short' | 'long' | 'live'>('all');

  useEffect(() => {
    if (qParam.length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<SearchPayload>(`/search/?q=${encodeURIComponent(qParam)}`)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          toast.error('Search failed — try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qParam]);

  const previewIds = useMemo(() => {
    const ids = new Set<string>();
    (data?.channels || []).forEach((c) => {
      (c.latest_videos || []).forEach((v) => ids.add(v.id));
    });
    return ids;
  }, [data]);

  const moreVideos = useMemo(() => {
    const hits = data?.videos || [];
    const filtered = hits.filter((v) => passesVideoChip(v as unknown as Record<string, unknown>, chip));
    return filtered.filter((v) => !previewIds.has(v.id));
  }, [data, previewIds, chip]);

  const filterLatest = useCallback(
    (list: Video[]) =>
      list.filter((v) => passesVideoChip(v as unknown as Record<string, unknown>, chip)),
    [chip]
  );

  const chips: { key: typeof chip; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'short', label: 'Shorts' },
    { key: 'long', label: 'Videos' },
    { key: 'live', label: 'Live' },
  ];

  return (
    <div className="min-h-[60vh] px-4 py-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-screen-2xl space-y-5">
        {qParam.length >= 2 ? (
          <div className="max-w-3xl border-b border-white/5 pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
              Results
            </p>
            <p className="mt-2 text-xl font-black uppercase italic tracking-tight text-white truncate">
              “{qParam}”
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
              Refine using the search field in the header — avoids duplicating controls here.
            </p>
          </div>
        ) : (
          <p className="max-w-xl text-center text-sm text-zinc-500 lg:text-left lg:mx-0 mx-auto pt-4">
            Type in the{' '}
            <span className="text-zinc-300 font-semibold uppercase tracking-wider">
              header search
            </span>{' '}
            and press Enter — results open on this page.
          </p>
        )}

        {qParam.length >= 2 ? (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setChip(c.key)}
                  className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    chip === c.key
                      ? 'bg-white text-black'
                      : 'bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <Filter className="h-3.5 w-3.5" /> Filters
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="h-8 w-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">Searching…</p>
              </div>
            ) : data ? (
              <div className="space-y-14">
                {(data.channels || []).map((block) => (
                  <ChannelSection
                    key={block.profile.id}
                    block={block}
                    user={user}
                    filterVideos={filterLatest}
                  />
                ))}

                {moreVideos.length > 0 ? (
                  <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">
                      More results
                    </h2>
                    <div className="flex flex-col gap-10">
                      {moreVideos.map((v) => (
                        <VideoCard key={v.id} video={v} horizontal />
                      ))}
                    </div>
                  </section>
                ) : null}

                {(data.channels || []).length === 0 &&
                (data.videos || []).filter((v) =>
                  passesVideoChip(v as unknown as Record<string, unknown>, chip)
                ).length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-8 py-16 text-center">
                    <p className="text-white font-semibold">No results for «{data.query}»</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      Try another name, handle, or video title.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                <p className="text-sm font-semibold text-white">Could not load results</p>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
                  The search request failed or was interrupted. Check that the API is running and try again from the header search.
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ChannelSection({
  block,
  user,
  filterVideos,
}: {
  block: SearchChannelBlock;
  user: User | null;
  filterVideos: (v: Video[]) => Video[];
}) {
  const navigate = useNavigate();
  const { profile } = block;
  const [following, setFollowing] = useState(!!profile.is_following);

  useEffect(() => {
    setFollowing(!!profile.is_following);
  }, [profile.id, profile.is_following]);

  const latest = filterVideos(block.latest_videos || []);
  const displayName =
    profile.name?.trim() || profile.username || 'Creator';
  const avatarSrc =
    profile.avatar_url ||
    (profile as { avatar?: string }).avatar ||
    '';

  const onSubscribe = async () => {
    if (!user) {
      toast.message('Sign in to subscribe.');
      navigate('/login');
      return;
    }
    if (profile.id === user.id) {
      toast.message('That is your channel.');
      return;
    }
    try {
      const res = await api.post<{ is_following: boolean }>(`/follow/${profile.id}/`);
      setFollowing(res.data.is_following);
      toast.success(res.data.is_following ? 'Subscribed' : 'Unsubscribed');
    } catch {
      toast.error('Could not update subscription.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-6 rounded-[1.75rem] border border-white/8 bg-[#0c0c0e] p-6 sm:flex-row sm:items-center">
        <Link
          to={`/profile/user/${profile.id}`}
          className="h-28 w-28 flex-shrink-0 self-start overflow-hidden rounded-full border-2 border-white/10 shadow-xl transition-transform hover:scale-[1.02] sm:h-32 sm:w-32"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-2xl font-black text-white">
              {(profile.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/profile/user/${profile.id}`}
              className="text-xl font-black text-white hover:text-neon-cyan truncate"
            >
              {displayName}
            </Link>
            {profile.role === 'CREATOR' ? (
              <BadgeCheck className="h-5 w-5 shrink-0 text-neon-cyan" aria-hidden />
            ) : null}
          </div>
          <p className="text-sm text-zinc-500">
            @{profile.username} · {formatSubscribers(profile.followers_count)}
          </p>
          {profile.bio ? (
            <p className="line-clamp-2 max-w-xl text-sm text-zinc-400">{profile.bio}</p>
          ) : (
            <p className="text-sm text-zinc-600 italic">No channel bio.</p>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col gap-2 sm:w-44">
          <button
            type="button"
            onClick={() => void onSubscribe()}
            className={`rounded-full px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              following
                ? 'border border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10'
                : 'bg-neon-cyan text-black hover:brightness-110'
            }`}
          >
            {following ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>

      {latest.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">
            Latest from {displayName}
          </h3>
          <div className="flex flex-col gap-8 lg:gap-10">
            {latest.map((v) => (
              <VideoCard key={v.id} video={v} horizontal />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
