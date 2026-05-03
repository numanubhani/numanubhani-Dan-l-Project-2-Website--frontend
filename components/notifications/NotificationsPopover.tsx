import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MoreVertical, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: number;
  is_read: boolean;
  link: string;
  thumbnail_url?: string;
  actor_avatar_url?: string;
};

function formatRelativeTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 45) return 'Just now';
  if (s < 3600) {
    const m = Math.max(1, Math.floor(s / 60));
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
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function displayTitle(n: AppNotification): string {
  if (n.title?.trim()) return n.title;
  if (n.type === 'new_video') return 'New video';
  if (n.type === 'creator_live') return 'Live now';
  if (n.type === 'bet_win') return 'Bet won';
  if (n.type === 'bet_loss') return 'Bet result';
  if (n.type === 'new_follower') return 'New subscriber';
  return 'Notification';
}

async function fetchNotificationsList(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>('/notifications/');
  return Array.isArray(data) ? data : [];
}

async function markNotificationReadApi(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read/`);
}

/** Internal routes to /watch/:id get autoplay—still respects browser autoplay policies after the click gesture. */
function withWatchAutoplay(internalPath: string): string {
  const raw = internalPath.startsWith('/') ? internalPath : `/${internalPath}`;
  const qIdx = raw.indexOf('?');
  const pathname = qIdx === -1 ? raw : raw.slice(0, qIdx);
  const existingSearch = qIdx === -1 ? '' : raw.slice(qIdx + 1);
  if (!/^\/watch\/[^/?#]+/.test(pathname)) {
    return raw;
  }
  const params = new URLSearchParams(existingSearch);
  params.set('autoplay', '1');
  return `${pathname}?${params.toString()}`;
}

function avatarFallbackLetter(n: AppNotification): string {
  const t = (n.title || n.message || '?').trim();
  return t.charAt(0).toUpperCase() || '?';
}

export function NotificationsPopover({ className }: { className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await fetchNotificationsList();
      setItems(list);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const tid = window.setInterval(refresh, 45000);
    return () => window.clearInterval(tid);
  }, [user, refresh]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) setActionMenuId(null);
  }, [open]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markReadLocally = async (n: AppNotification) => {
    if (n.is_read) return;
    try {
      await markNotificationReadApi(n.id);
      setItems((prev) =>
        prev.map((row) => (row.id === n.id ? { ...row, is_read: true } : row)),
      );
    } catch {
      /* ignore */
    }
  };

  const activateNotification = async (n: AppNotification) => {
    const href = n.link?.trim();
    await markReadLocally(n);
    if (!href) {
      return;
    }
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      const path = href.startsWith('/') ? href : `/${href}`;
      navigate(withWatchAutoplay(path));
    }
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5 transition-all hover:bg-white/10',
            className,
          )}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-zinc-500 transition-colors group-hover:text-neon-cyan" />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 min-h-2 min-w-2 rounded-full bg-neon-pink shadow-[0_0_10px_rgba(255,0,85,0.5)] ring-2 ring-void" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(100vw-1.5rem,420px)] border border-white/10 bg-[#121212] p-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <span className="text-sm font-semibold text-white">Notifications</span>
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-medium text-zinc-500 sm:inline">
              {items.length === 0
                ? ''
                : `${items.length}${unreadCount > 0 ? ` · ${unreadCount} new` : ''}`}
            </span>
            <button
              type="button"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Account"
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ScrollArea className="max-h-[min(65vh,480px)]">
          <div className="py-1">
            {loading && items.length === 0 ? (
              <p className="py-8 text-center text-[11px] text-zinc-500">Loading…</p>
            ) : items.length === 0 ? (
              <div className="space-y-1 px-4 py-8 text-center">
                <p className="text-sm font-medium text-white">Nothing here yet</p>
                <p className="text-[11px] text-zinc-500 leading-snug">
                  Subscribes, comments, uploads, and live alerts show up here.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {items.map((n) => {
                  const titled = displayTitle(n);
                  const msg = (n.message || '').trim();
                  const thumb = (n.thumbnail_url || '').trim();
                  const avatarUrl = (n.actor_avatar_url || '').trim();

                  let bodyLine: ReactNode;
                  if (n.type === 'new_video') {
                    bodyLine = (
                      <p className="text-[13px] leading-snug text-white">
                        <span className="font-semibold">{n.title || titled}</span>
                        <span className="text-zinc-300"> uploaded: </span>
                        <span>{msg || 'New video'}</span>
                      </p>
                    );
                  } else if (n.type === 'creator_live') {
                    bodyLine = (
                      <p className="text-[13px] leading-snug text-white">
                        <span className="font-semibold">{n.title || titled}</span>
                        <span className="text-zinc-300"> is live — </span>
                        <span>{msg}</span>
                      </p>
                    );
                  } else {
                    const primary = msg || titled;
                    const secondary =
                      msg && titled !== 'Notification' && titled !== primary ? titled : null;
                    bodyLine = (
                      <>
                        {secondary ? (
                          <p className="mb-0.5 line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                            {secondary}
                          </p>
                        ) : null}
                        <p className="text-[13px] leading-snug text-white line-clamp-3">{primary}</p>
                      </>
                    );
                  }

                  const a11yLabel = `${titled}. ${msg}. ${formatRelativeTime(n.timestamp)}`;

                  return (
                    <li key={n.id} className="relative border-b border-white/[0.06] last:border-0">
                      <div
                        className={cn(
                          'flex w-full items-start gap-2 px-2 py-3 sm:gap-3 sm:px-3',
                          !n.is_read ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]',
                        )}
                      >
                        <div className="flex w-2 shrink-0 justify-center pt-2" aria-hidden>
                          {!n.is_read ? (
                            <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                          ) : (
                            <span className="h-2 w-2" />
                          )}
                        </div>

                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-zinc-400">
                              {avatarFallbackLetter(n)}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => void activateNotification(n)}
                          className="min-w-0 flex-1 cursor-pointer text-left"
                          aria-label={a11yLabel}
                        >
                          {bodyLine}
                          <p className="mt-1 text-[12px] text-zinc-500">
                            {formatRelativeTime(n.timestamp)}
                          </p>
                        </button>

                        <div className="relative flex shrink-0 items-start gap-1.5 pt-0.5">
                          {thumb ? (
                            <button
                              type="button"
                              onClick={() => void activateNotification(n)}
                              className="relative aspect-video w-[88px] shrink-0 overflow-hidden rounded-md bg-zinc-900 ring-1 ring-white/10 sm:w-[104px]"
                              aria-label={n.link ? 'Open video' : 'Mark as read'}
                            >
                              <img
                                src={thumb}
                                alt=""
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                          ) : (
                            <div
                              className="aspect-video w-[88px] shrink-0 rounded-md bg-zinc-800 ring-1 ring-white/5 sm:w-[104px]"
                              aria-hidden
                            />
                          )}
                          <button
                            type="button"
                            className={cn(
                              'rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white',
                              actionMenuId === n.id && 'bg-white/10 text-white',
                            )}
                            aria-label="Notification actions"
                            aria-expanded={actionMenuId === n.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId((id) => (id === n.id ? null : n.id));
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {actionMenuId === n.id ? (
                            <div
                              role="menu"
                              className="absolute right-0 top-8 z-50 min-w-[148px] rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {n.link ? (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-[12px] text-white hover:bg-white/10"
                                  onClick={() => {
                                    setActionMenuId(null);
                                    void activateNotification(n);
                                  }}
                                >
                                  Open
                                </button>
                              ) : null}
                              {!n.is_read ? (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-[12px] text-white hover:bg-white/10"
                                  onClick={() => {
                                    setActionMenuId(null);
                                    void markReadLocally(n);
                                  }}
                                >
                                  Mark as read
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
