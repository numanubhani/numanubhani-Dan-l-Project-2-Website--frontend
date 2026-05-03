import React, { useCallback, useEffect, useRef, useState } from 'react';

export type TimelineMarker = { id: string; timestamp: number };

type BetMarkerTimelineProps = {
  duration: number;
  currentTime: number;
  markers: TimelineMarker[];
  activeMarkerId?: string | null;
  /** Markers the viewer has already placed a bet on */
  completedMarkerIds?: Set<string>;
  className?: string;
  /** Free scrubbing (click / drag) — use only when video has no timeline bets */
  interactive?: boolean;
  onSeek?: (seconds: number) => void;
  label?: string;
};

export function BetMarkerTimeline({
  duration,
  currentTime,
  markers,
  activeMarkerId = null,
  completedMarkerIds,
  className = '',
  interactive = false,
  onSeek,
  label = 'Playhead',
}: BetMarkerTimelineProps) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const pct = safeDuration > 0 ? Math.min(100, Math.max(0, (currentTime / safeDuration) * 100)) : 0;

  const barRef = useRef<HTMLDivElement>(null);
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const [dragging, setDragging] = useState(false);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      const seek = onSeekRef.current;
      if (!el || !seek || safeDuration <= 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      seek(ratio * safeDuration);
    },
    [safeDuration],
  );

  useEffect(() => {
    if (!dragging || !interactive) return;

    const move = (e: PointerEvent) => seekFromClientX(e.clientX);
    const stop = () => setDragging(false);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [dragging, interactive, seekFromClientX]);

  const barPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !onSeek || safeDuration <= 0) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    seekFromClientX(e.clientX);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label ? (
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500">
          <span>{label}</span>
          <span className="font-mono text-zinc-400">
            {currentTime.toFixed(1)}s / {safeDuration > 0 ? safeDuration.toFixed(1) : '—'}s
          </span>
        </div>
      ) : null}
      <div
        ref={barRef}
        role={interactive ? 'slider' : undefined}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? safeDuration : undefined}
        aria-valuenow={interactive ? currentTime : undefined}
        aria-label={interactive ? 'Video timeline — drag or click to seek' : undefined}
        onPointerDown={interactive ? barPointerDown : undefined}
        className={`relative w-full rounded-full bg-black/40 border border-white/10 overflow-visible touch-none select-none ${
          interactive ? 'min-h-[14px] cursor-grab active:cursor-grabbing py-1 hover:border-neon-cyan/40' : 'h-2 pointer-events-none'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon-cyan/60 to-neon-purple/50"
          style={{ width: `${pct}%` }}
        />
        {markers.map((m) => {
          const t = Number(m.timestamp) || 0;
          const mp = safeDuration > 0 ? Math.min(100, Math.max(0, (t / safeDuration) * 100)) : 0;
          const done = completedMarkerIds?.has(m.id);
          const active = activeMarkerId === m.id;
          return (
            <div
              key={m.id}
              className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${mp}%` }}
              title={`Bet @ ${t.toFixed(1)}s`}
            >
              <div
                className={`h-4 w-1 rounded-full shadow-[0_0_12px_currentColor] transition-all ${
                  active
                    ? 'scale-y-125 animate-pulse bg-neon-pink text-neon-pink'
                    : done
                      ? 'bg-emerald-500/70 text-emerald-400'
                      : 'bg-neon-cyan text-neon-cyan'
                }`}
              />
            </div>
          );
        })}
        {interactive && safeDuration > 0 ? (
          <div
            className="pointer-events-none absolute top-1/2 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.6)]"
            style={{ left: `${pct}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Max time (seconds) the user may seek to until every earlier marker has a bet placed. */
export function maxAllowedTimeBeforeNextBet(
  markers: { id: string; timestamp: number }[],
  markersWithBetPlaced: Set<string>,
  epsilon = 0.2,
): number {
  const sorted = [...markers].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  const next = sorted.find((m) => m.id && !markersWithBetPlaced.has(m.id));
  if (!next) return Number.POSITIVE_INFINITY;
  return Math.max(0, Number(next.timestamp) - epsilon);
}
