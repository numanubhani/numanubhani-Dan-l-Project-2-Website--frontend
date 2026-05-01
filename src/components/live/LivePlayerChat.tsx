import React, { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useAuth } from '../../contexts/AuthContext';

type ChatItem = {
  id: string;
  username: string;
  message: string;
};

type Props = {
  streamKey: string;
  hlsUrl: string;
  initialViewerCount?: number;
  onStreamEnded?: () => void;
};

/** Use path on current origin so Vite can proxy `/hls/` to MediaMTX in dev */
function playbackUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('/')) return raw;
  try {
    const u = new URL(raw);
    return u.pathname + u.search + u.hash;
  } catch {
    return raw;
  }
}

export default function LivePlayerChat({ streamKey, hlsUrl, initialViewerCount = 0, onStreamEnded }: Props) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [message, setMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(initialViewerCount);
  const [ended, setEnded] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const src = playbackUrl(hlsUrl);

  const wsUrl = useMemo(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/ws/stream/${streamKey}/`;
  }, [streamKey]);

  useEffect(() => {
    setPlaybackError(null);
    if (!videoRef.current || !src) return;
    if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src;
      return;
    }
    if (!Hls.isSupported()) return;

    let retries = 0;
    const maxManifestRetries = 30;
    const hls = new Hls({
      lowLatencyMode: true,
      manifestLoadingMaxRetry: 30,
      manifestLoadingRetryDelay: 500,
    });
    const onErr = (_e: unknown, data: any) => {
      if (!data?.fatal) return;
      const isManifest =
        data.type === Hls.ErrorTypes.NETWORK_ERROR &&
        (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
          data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR);
      if (isManifest && retries < maxManifestRetries) {
        retries++;
        window.setTimeout(() => {
          hls.startLoad();
        }, 500);
        return;
      }
      setPlaybackError('Live stream unreachable (MediaMTX on :8888, or publisher not feeding HLS yet).');
    };
    hls.on(Hls.Events.ERROR, onErr);
    hls.loadSource(src);
    hls.attachMedia(videoRef.current);
    return () => hls.destroy();
  }, [src]);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ event: 'viewer.join' }));
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.event === 'chat.message') {
        setChat((prev) => [...prev.slice(-99), { id: crypto.randomUUID(), username: payload.username, message: payload.message }]);
      }
      if (payload.event === 'viewer.count') {
        setViewerCount(Number(payload.viewer_count || 0));
      }
      if (payload.event === 'stream.ended') {
        setEnded(true);
        onStreamEnded?.();
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'viewer.leave' }));
      }
      ws.close();
    };
  }, [onStreamEnded, wsUrl]);

  const sendMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !message.trim()) return;
    wsRef.current.send(
      JSON.stringify({
        event: 'chat.message',
        username: user?.username || 'Viewer',
        message: message.trim(),
      })
    );
    setMessage('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black relative">
        <video ref={videoRef} controls autoPlay playsInline className="w-full aspect-video bg-black" />
        {playbackError && !ended && (
          <div className="absolute inset-x-0 bottom-14 mx-4 rounded-lg bg-amber-500/90 px-3 py-2 text-[10px] font-bold text-black">
            {playbackError}
          </div>
        )}
        {ended && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xl font-black uppercase tracking-widest">
            Stream Ended
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col h-[420px]">
        <div className="text-xs font-black uppercase tracking-widest text-neon-cyan mb-3">Live Chat - {viewerCount} Watching</div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {chat.map((item) => (
            <div key={item.id} className="text-xs">
              <span className="font-black text-neon-cyan">{item.username}: </span>
              <span className="text-zinc-200">{item.message}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={user ? 'Say something...' : 'Login to chat'}
            disabled={!user}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
          />
          <button onClick={sendMessage} disabled={!user} className="px-3 py-2 rounded-lg bg-neon-cyan text-black text-xs font-black uppercase">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
