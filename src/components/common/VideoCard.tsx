import React from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import { Video } from '../../types';
import { fixUrl } from '../../services/api';

/** e.g. 1:24:15 or 15:02 */
function formatDurationSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatRelativePublished(iso?: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) {
    const m = Math.floor(s / 60);
    return m === 1 ? '1 minute ago' : `${m} minutes ago`;
  }
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    return h === 1 ? '1 hour ago' : `${h} hours ago`;
  }
  if (s < 86400 * 7) {
    const d = Math.floor(s / 86400);
    return d === 1 ? '1 day ago' : `${d} days ago`;
  }
  if (s < 86400 * 30) {
    const w = Math.floor(s / (86400 * 7));
    return w === 1 ? '1 week ago' : `${w} weeks ago`;
  }
  if (s < 86400 * 365) {
    const mo = Math.floor(s / (86400 * 30));
    return mo === 1 ? '1 month ago' : `${mo} months ago`;
  }
  const y = Math.floor(s / (86400 * 365));
  return y === 1 ? '1 year ago' : `${y} years ago`;
}

function formatViewLine(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(views >= 10000 ? 0 : 1)}K views`;
  return `${views} view${views === 1 ? '' : 's'}`;
}

interface VideoCardProps {
  video: Video;
  /** Wide search-result row: thumbnail left, meta right */
  horizontal?: boolean;
  /** Hide hover ⋮ when parent supplies its own menu (e.g. profile owner) */
  hideOverflowMenu?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  horizontal,
  hideOverflowMenu,
}) => {
  const creatorId = (video as any)?.creator?.id || (video as any)?.creator;
  const creatorUsername =
    (video as any)?.creator?.username || (video as any)?.creator_username || 'creator';
  const creatorDisplay =
    (video as any)?.creator_name?.trim() ||
    (video as any)?.creator?.name?.trim() ||
    creatorUsername;
  const creatorAvatar = fixUrl(
    (video as any)?.creator_avatar ||
    (video as any)?.creator?.avatar ||
    (video as any)?.creator?.avatar_url ||
    ''
  );
  const thumbnailSrc = fixUrl((video as any)?.thumbnail_url || (video as any)?.thumbnail || '');
  const apiDuration = Number((video as any)?.duration || (video as any)?.duration_seconds || 0);
  const videoSource = fixUrl(
    (video as any)?.video_file_url || (video as any)?.videoUrl || (video as any)?.video_url || ''
  );
  const [resolvedDuration, setResolvedDuration] = React.useState<number>(apiDuration);

  const createdIso =
    (video as any)?.created_at || (video as any)?.createdAt || '';
  const views = Number((video as any)?.views || 0);
  const publishedLabel = formatRelativePublished(createdIso);

  React.useEffect(() => {
    setResolvedDuration(apiDuration);
    if (apiDuration > 0 || !videoSource) return;

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = videoSource;

    const onLoadedMetadata = () => {
      if (Number.isFinite(tempVideo.duration) && tempVideo.duration > 0) {
        setResolvedDuration(Math.round(tempVideo.duration));
      }
    };

    tempVideo.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      tempVideo.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [apiDuration, videoSource]);

  const profileVideosPath = `/profile/user/${creatorId}/videos`;
  const profilePath = `/profile/user/${creatorId}`;
  const watchPath = `/watch/${video.id}`;

  const thumbBlock = (
    <Link
      to={watchPath}
      className={`relative block overflow-hidden rounded-xl bg-zinc-800/80 ring-1 ring-white/[0.06] ${
        horizontal ? 'aspect-video w-full shrink-0 md:w-64 lg:w-72' : 'aspect-video w-full'
      }`}
    >
      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="h-full w-full bg-zinc-900" />
      )}
      <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
        {formatDurationSeconds(resolvedDuration)}
      </div>
    </Link>
  );

  const metaBlock = (
    <div className={`flex min-w-0 flex-1 gap-3 ${horizontal ? '' : 'mt-3'}`}>
      <Link
        to={profileVideosPath}
        className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {creatorAvatar ? (
          <img
            src={creatorAvatar}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-xs font-bold text-zinc-200">
            {(creatorDisplay || 'U').charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      <div className="relative min-w-0 flex-1 pr-7">
        <Link to={watchPath} className="block">
          <h3 className="mb-1 line-clamp-2 text-left text-[15px] font-semibold leading-snug tracking-tight text-white sm:text-base">
            {video.title}
          </h3>
        </Link>
        <Link
          to={profilePath}
          className="block truncate text-left text-xs font-medium text-zinc-400 hover:text-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          {creatorDisplay}
        </Link>
        <p className="mt-0.5 truncate text-left text-xs text-zinc-500">
          {formatViewLine(views)}
          {publishedLabel ? ` • ${publishedLabel}` : ''}
        </p>
        {!hideOverflowMenu ? (
          <button
            type="button"
            className="absolute right-0 top-0 rounded-full p-1 text-zinc-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
            aria-label="More actions"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );

  if (horizontal) {
    return (
      <article className="group flex w-full flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {thumbBlock}
        <div className="min-w-0 flex-1">{metaBlock}</div>
      </article>
    );
  }

  return (
    <article className="group flex w-full cursor-pointer flex-col">
      {thumbBlock}
      {metaBlock}
    </article>
  );
};

export const ReelCard: React.FC<{ video: Video }> = ({ video }) => {
  const creatorUsername =
    (video as any)?.creator?.username ||
    (video as any)?.creator_username ||
    (video as any)?.creator_name ||
    'creator';
  const creatorAvatar = fixUrl(
    (video as any)?.creator?.avatar || (video as any)?.creator_avatar || ''
  );
  const thumbnailSrc = fixUrl((video as any)?.thumbnail_url || (video as any)?.thumbnail || '');
  const apiDuration = Number((video as any)?.duration || (video as any)?.duration_seconds || 0);
  const videoSource = fixUrl(
    (video as any)?.video_file_url || (video as any)?.videoUrl || (video as any)?.video_url || ''
  );
  const [resolvedDuration, setResolvedDuration] = React.useState<number>(apiDuration);

  React.useEffect(() => {
    setResolvedDuration(apiDuration);
    if (apiDuration > 0 || !videoSource) return;

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = videoSource;

    const onLoadedMetadata = () => {
      if (Number.isFinite(tempVideo.duration) && tempVideo.duration > 0) {
        setResolvedDuration(Math.round(tempVideo.duration));
      }
    };

    tempVideo.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      tempVideo.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [apiDuration, videoSource]);

  return (
    <div className="group relative flex-shrink-0 cursor-pointer">
      <Link to={`/reel?v=${video.id}`} className="block">
        <div className="relative aspect-[9/16] w-[160px] overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 shadow-xl transition-all group-hover:border-neon-pink/40 sm:w-[190px] lg:w-[220px] sm:rounded-3xl">
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={video.title}
              className="h-full w-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-100"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full bg-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-black tracking-widest text-white backdrop-blur-md">
            {formatDurationSeconds(resolvedDuration)}
          </div>

          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 overflow-hidden rounded-lg border border-white/10">
                {creatorAvatar ? (
                  <img
                    src={creatorAvatar}
                    alt={creatorUsername}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-[10px] font-black uppercase text-white">
                    {creatorUsername?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                @{creatorUsername}
              </span>
            </div>
            <h4 className="line-clamp-2 text-xs font-black uppercase italic leading-snug tracking-tight text-white drop-shadow-lg">
              {video.title}
            </h4>
          </div>
        </div>
      </Link>
    </div>
  );
};
