import React from 'react';

export type TimelineMarker = { id: string; timestamp: number };

type BetMarkerTimelineProps = {
  duration: number;
  currentTime: number;
  markers: TimelineMarker[];
  activeMarkerId?: string | null;
  /** Markers the viewer has already placed a bet on */
  completedMarkerIds?: Set<string>;
  className?: string;
  /** Creator / editor: click bar to seek */
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

  const barClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onSeek || safeDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, x / rect.width));
    onSeek(ratio * safeDuration);
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
        role={interactive ? 'slider' : undefined}
        aria-valuemin={0}
        aria-valuemax={safeDuration}
        aria-valuenow={currentTime}
        onClick={barClick}
        className={`relative h-2 w-full rounded-full bg-black/40 border border-white/10 overflow-visible ${
          interactive ? 'cursor-pointer hover:border-neon-cyan/40' : ''
        }`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon-cyan/60 to-neon-purple/50 pointer-events-none"
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
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
              style={{ left: `${mp}%` }}
              title={`Bet @ ${t.toFixed(1)}s`}
            >
              <div
                className={`h-4 w-1 rounded-full shadow-[0_0_12px_currentColor] transition-all ${
                  active
                    ? 'bg-neon-pink text-neon-pink scale-y-125 animate-pulse'
                    : done
                      ? 'bg-emerald-500/70 text-emerald-400'
                      : 'bg-neon-cyan text-neon-cyan'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Max time (seconds) the user may seek to until every earlier marker has a bet placed. */
export function maxAllowedTimeBeforeNextBet(
  markers: { id: string; timestamp: number }[],
  markersWithBetPlaced: Set<string>,
  epsilon = 0.2
): number {
  const sorted = [...markers].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  const next = sorted.find((m) => m.id && !markersWithBetPlaced.has(m.id));
  if (!next) return Number.POSITIVE_INFINITY;
  return Math.max(0, Number(next.timestamp) - epsilon);
}
