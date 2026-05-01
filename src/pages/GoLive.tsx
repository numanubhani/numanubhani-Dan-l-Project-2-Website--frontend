import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, MonitorUp, Radio, Square, Mic, MicOff, Video, VideoOff, Type } from 'lucide-react';
import { api } from '../services/api';
import LivePlayerChat from '../components/live/LivePlayerChat';

function sameOriginPath(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('/')) return raw;
  try {
    const u = new URL(raw);
    return u.pathname + u.search + u.hash;
  } catch {
    return raw;
  }
}

const GoLive = () => {
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const whipResourceRef = useRef<string>('');

  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<'camera' | 'screen' | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [pcState, setPcState] = useState<string>('new');
  const [savingTitle, setSavingTitle] = useState(false);
  const [switching, setSwitching] = useState(false);

  const whipEndpoint = useMemo(() => sameOriginPath(streamInfo?.whip_url || ''), [streamInfo?.whip_url]);

  /** HLS URL for “viewer preview” — same-origin path works with Vite /hls proxy */
  const viewerPreviewHls = useMemo(() => {
    if (!streamInfo?.stream_key) return '';
    const fromApi = (streamInfo.hls_url || '').trim();
    if (fromApi) return fromApi;
    return `/hls/${streamInfo.stream_key}/index.m3u8`;
  }, [streamInfo?.stream_key, streamInfo?.hls_url]);

  const showViewerPreview = !!(streamInfo?.stream_key && viewerPreviewHls && (isPublishing || streamInfo?.is_live));

  const refresh = React.useCallback(async () => {
    try {
      const { data } = await api.get('/streams/my-key/');
      setStreamInfo(data);
      setTitle((prev) => prev || data.title || '');
    } catch {
      console.error('Failed to refresh stream info');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  const syncAVState = (stream: MediaStream | null) => {
    const a = stream?.getAudioTracks()[0];
    const v = stream?.getVideoTracks()[0];
    setMicOn(!!a?.enabled);
    setCamOn(!!v?.enabled);
  };

  const attachPreview = (stream: MediaStream) => {
    if (!previewRef.current) return;
    previewRef.current.srcObject = stream;
    previewRef.current.muted = true;
    previewRef.current.play().catch(() => {});
    syncAVState(stream);
  };

  const pickCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      attachPreview(stream);
      setSource('camera');
    } catch {
      toast.error('Could not access camera/microphone.');
    }
  };

  const pickScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      attachPreview(stream);
      setSource('screen');
    } catch {
      toast.error('Could not start screen sharing.');
    }
  };

  const applyH264Prefs = (pc: RTCPeerConnection) => {
    const videoCaps = RTCRtpSender.getCapabilities('video');
    const h264Codecs = (videoCaps?.codecs || []).filter((c) => c.mimeType.toLowerCase() === 'video/h264');
    if (h264Codecs.length > 0) {
      for (const tr of pc.getTransceivers()) {
        if (tr.sender?.track?.kind === 'video') tr.setCodecPreferences(h264Codecs);
      }
    }
  };

  const startLive = async () => {
    if (!streamRef.current) {
      toast.error('Select camera or screen first.');
      return;
    }
    if (!whipEndpoint) {
      toast.error('WHIP endpoint unavailable. Check backend stream config.');
      return;
    }
    setStarting(true);
    try {
      if (title.trim()) {
        await api.post('/streams/update-title/', { title: title.trim() });
      }

      const pc = new RTCPeerConnection();
      pc.onconnectionstatechange = () => setPcState(pc.connectionState || 'unknown');
      pcRef.current = pc;
      streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current as MediaStream));

      const vCapsLen = RTCRtpSender.getCapabilities('video').codecs.filter(
        (c) => c.mimeType.toLowerCase() === 'video/h264'
      ).length;
      if (vCapsLen === 0) {
        toast.warning('H264 not advertised by browser; HLS viewers may buffer or fail.');
      }
      applyH264Prefs(pc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch(whipEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp || '',
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `WHIP publish failed (${res.status})`);
      }

      const location = res.headers.get('Location');
      whipResourceRef.current = location ? sameOriginPath(location) : '';
      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      setPcState(pc.connectionState || 'connected');
      setIsPublishing(true);
      toast.success('Live publishing started.');
      refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to start live publishing.');
      pcRef.current?.close();
      pcRef.current = null;
    } finally {
      setStarting(false);
    }
  };

  const stopLive = async () => {
    try {
      if (whipResourceRef.current) {
        await fetch(whipResourceRef.current, { method: 'DELETE' });
      }
    } catch {
      // ignore teardown errors
    }
    whipResourceRef.current = '';
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setSource(null);
    setIsPublishing(false);
    setPcState('closed');
    if (previewRef.current) previewRef.current.srcObject = null;
    toast.success('Live ended for viewers.');
    refresh();
  };

  const toggleMic = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const t = stream.getAudioTracks()[0];
    if (!t) {
      toast.error('No microphone track.');
      return;
    }
    t.enabled = !t.enabled;
    setMicOn(t.enabled);
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'audio');
    if (sender?.track) sender.track.enabled = t.enabled;
  };

  const toggleCamera = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const t = stream.getVideoTracks()[0];
    if (!t) {
      toast.error('No camera/video track.');
      return;
    }
    t.enabled = !t.enabled;
    setCamOn(t.enabled);
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
    if (sender?.track) sender.track.enabled = t.enabled;
  };

  const updateTitleLive = async () => {
    if (!title.trim()) {
      toast.error('Title is empty.');
      return;
    }
    try {
      setSavingTitle(true);
      await api.post('/streams/update-title/', { title: title.trim() });
      toast.success('Title updated on channel.');
      refresh();
    } catch {
      toast.error('Failed to update title.');
    } finally {
      setSavingTitle(false);
    }
  };

  const switchBroadcastSource = async (next: 'camera' | 'screen') => {
    if (!pcRef.current || !isPublishing) return;
    setSwitching(true);
    try {
      const pc = pcRef.current;
      const oldStream = streamRef.current;
      const newStream =
        next === 'camera'
          ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

      const vNew = newStream.getVideoTracks()[0];
      const aNew = newStream.getAudioTracks()[0];
      const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');
      const audioSender = pc.getSenders().find((s) => s.track?.kind === 'audio');

      if (videoSender && vNew) {
        await videoSender.replaceTrack(vNew);
        oldStream?.getVideoTracks().forEach((t) => {
          if (t.id !== vNew.id) t.stop();
        });
      }
      if (audioSender && aNew) {
        await audioSender.replaceTrack(aNew);
        oldStream?.getAudioTracks().forEach((t) => {
          if (t.id !== aNew.id) t.stop();
        });
      } else if (aNew && !audioSender) {
        pc.addTrack(aNew, newStream);
      }

      streamRef.current = newStream;
      attachPreview(newStream);
      applyH264Prefs(pc);
      setSource(next);
      toast.success(next === 'camera' ? 'Switched to camera' : 'Switched to screen share');

      if (next === 'screen' && vNew) {
        vNew.addEventListener('ended', () => toast.message('Screen share ended.'));
      }
    } catch {
      toast.error('Could not switch source while live.');
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    return () => {
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Go Live</h1>
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
            {streamInfo?.is_live ? 'Live on channel' : 'Offline'}
          </div>
          {isPublishing && (
            <span className="text-[10px] font-mono text-neon-cyan uppercase">Publisher: {pcState}</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={pickCamera}
            disabled={isPublishing}
            className="rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-left disabled:opacity-40"
          >
            <div className="flex items-center gap-2 text-white font-bold"><Camera className="h-4 w-4" /> Camera + Mic</div>
            <p className="text-xs text-zinc-400 mt-1">Use webcam before you go live, or switch while live below.</p>
          </button>
          <button
            type="button"
            onClick={pickScreen}
            disabled={isPublishing}
            className="rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-left disabled:opacity-40"
          >
            <div className="flex items-center gap-2 text-white font-bold"><MonitorUp className="h-4 w-4" /> Screen Share</div>
            <p className="text-xs text-zinc-400 mt-1">Share screen before live, or switch while live.</p>
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live title</label>
          <div className="flex gap-2 flex-wrap">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 min-w-[200px] rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" />
            <button
              type="button"
              onClick={updateTitleLive}
              disabled={savingTitle || !streamInfo}
              className="inline-flex items-center gap-2 rounded-xl border border-neon-cyan/40 bg-neon-cyan/15 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-neon-cyan disabled:opacity-40"
            >
              <Type className="h-3.5 w-3.5" />
              {savingTitle ? 'Saving…' : 'Apply title'}
            </button>
          </div>
          <p className="text-[10px] text-zinc-500">Updating title pushes to your channel for all viewers.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={startLive}
            disabled={starting || isPublishing || !source}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2"><Radio className="h-3.5 w-3.5" /> {starting ? 'Starting...' : 'Start live'}</span>
          </button>
          <button
            onClick={stopLive}
            disabled={!isPublishing}
            className="rounded-xl bg-zinc-800 border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2"><Square className="h-3.5 w-3.5" /> End stream</span>
          </button>
          <span className="text-[11px] text-zinc-400">
            Source: <strong className="text-zinc-200 uppercase">{source || 'none'}</strong>
          </span>
        </div>

        {isPublishing && (
          <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Live controls</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black uppercase ${
                  micOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {micOn ? 'Mic on' : 'Mic off'}
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black uppercase ${
                  camOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {camOn ? 'Video on' : 'Video off'}
              </button>
              <button
                type="button"
                onClick={() => switchBroadcastSource('camera')}
                disabled={switching}
                className="inline-flex items-center gap-2 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2 text-[11px] font-black uppercase text-neon-cyan disabled:opacity-50"
              >
                <Camera className="h-4 w-4" /> Use camera
              </button>
              <button
                type="button"
                onClick={() => switchBroadcastSource('screen')}
                disabled={switching}
                className="inline-flex items-center gap-2 rounded-lg border border-neon-purple/30 bg-neon-purple/10 px-3 py-2 text-[11px] font-black uppercase text-neon-purple disabled:opacity-50"
              >
                <MonitorUp className="h-4 w-4" /> Share screen
              </button>
            </div>
            <p className="text-[10px] text-zinc-500">
              Viewers watch HLS playback with a short delay. Mic/video toggles apply immediately.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black overflow-hidden">
          <video ref={previewRef} className="w-full aspect-video bg-black" autoPlay playsInline muted />
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Publish endpoints</p>
          <p className="text-[11px] text-zinc-300 break-all">WHIP: {streamInfo?.whip_url || '-'}</p>
          <p className="text-[11px] text-zinc-300 break-all">RTMP: {streamInfo?.ingest_url || '-'}</p>
          <p className="text-[11px] text-zinc-300 break-all">Stream key: {streamInfo?.stream_key || '-'}</p>
        </div>
      </div>

      {showViewerPreview && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Viewer preview <span className="text-zinc-500 normal-case font-medium">— same HLS viewers see (~few s delay)</span>
          </p>
          <LivePlayerChat
            streamKey={streamInfo.stream_key}
            hlsUrl={viewerPreviewHls}
            initialViewerCount={streamInfo.viewer_count || 0}
          />
        </div>
      )}
    </div>
  );
};

export default GoLive;
