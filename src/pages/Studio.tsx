import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  X,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Eye,
  DollarSign,
  Info,
  ImagePlus,
  FileVideo,
  MessageCircle,
  ChevronDown,
  Radio,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../services/api';
import { BetMarkerTimeline } from '../components/common/BetMarkerTimeline';
import LivePlayerChat from '../components/live/LivePlayerChat';
import { cn } from '@/lib/utils';
import { eventApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_PRESETS = [
  'Education',
  'Entertainment',
  'Technology',
  'Vlog',
  'Gaming',
  'Music',
  'Sports',
  'News',
] as const;

const Studio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [studioTab, setStudioTab] = useState<'long' | 'short' | 'live'>('long');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [streamTitle, setStreamTitle] = useState('');
  const [savingStreamTitle, setSavingStreamTitle] = useState(false);
  
  // Timed Bet States
  const [betTriggers, setBetTriggers] = useState<{ id: string; timestamp: number; question: string; options: string[] }[]>([]);
  const [editingBet, setEditingBet] = useState<{ timestamp: number; question: string; options: string[] } | null>(null);
  const [previewingBet, setPreviewingBet] = useState<{ id: string; timestamp: number; question: string; options: string[] } | null>(null);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamTitleDirtyRef = useRef(false);
  const prevLiveRef = useRef<boolean | undefined>(undefined);

  const [category, setCategory] = useState('Education');
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [commentsSectionOpen, setCommentsSectionOpen] = useState(true);

  // Event Reel States
  const [isEventReel, setIsEventReel] = useState(false);
  const [eventReelType, setEventReelType] = useState<'challenge' | 'prediction'>('challenge');
  const [eventEndDate, setEventEndDate] = useState('');
  const [btnYes, setBtnYes] = useState('Vote YES');
  const [btnNo, setBtnNo] = useState('Vote NO');

  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length;
  const maxWords = studioTab === 'long' ? 200 : studioTab === 'short' ? 20 : 200;

  const refreshLiveSnapshot = React.useCallback(async () => {
    try {
      const response = await api.get('/streams/my-key/');
      const data = response.data;
      setStreamInfo(data);
      if (!streamTitleDirtyRef.current) {
        setStreamTitle(data.title || '');
      }
      const prev = prevLiveRef.current;
      const nowLive = !!data.is_live;
      if (prev === false && nowLive) {
        toast.success("You're live", { description: 'Encoder connected. Preview below — viewers see this on your channel.' });
      }
      prevLiveRef.current = nowLive;
    } catch {
      console.error('Failed to refresh stream status');
    }
  }, []);

  useEffect(() => {
    refreshLiveSnapshot();
  }, [refreshLiveSnapshot]);

  useEffect(() => {
    const id = window.setInterval(refreshLiveSnapshot, 2800);
    return () => clearInterval(id);
  }, [refreshLiveSnapshot]);

  const saveLiveTitle = async () => {
    if (!streamTitle.trim()) {
      toast.error('Title is required.');
      return;
    }
    try {
      setSavingStreamTitle(true);
      await api.post('/streams/update-title/', { title: streamTitle.trim() });
      toast.success('Live stream title updated.');
      streamTitleDirtyRef.current = false;
      await refreshLiveSnapshot();
    } catch (error) {
      console.error('Failed to update stream title', error);
      toast.error('Failed to update stream title.');
    } finally {
      setSavingStreamTitle(false);
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch (error) {
      toast.error(`Failed to copy ${label}.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      toast.error("INVALID THUMBNAIL", { description: "Please upload an image file for thumbnail." });
      return;
    }
    setThumbnailFile(selectedFile);
    setThumbnailPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const getVideoDuration = (selectedFile: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const objectUrl = URL.createObjectURL(selectedFile);
      tempVideo.src = objectUrl;
      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration;
        URL.revokeObjectURL(objectUrl);
        if (!Number.isFinite(duration)) {
          reject(new Error('Unable to read duration'));
          return;
        }
        resolve(duration);
      };
      tempVideo.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Invalid video file'));
      };
    });
  };

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      toast.error("INVALID PAYLOAD", { description: "Operational parameters only allow video files." });
      return;
    }

    try {
      const duration = await getVideoDuration(selectedFile);
      setVideoDurationSeconds(duration);
    } catch (error) {
      toast.error("INVALID VIDEO", { description: "Could not read video duration." });
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setPreviewCurrentTime(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const addBetTrigger = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    setEditingBet({ timestamp: currentTime, question: "", options: ["YES", "NO"] });
  };

  const saveBet = () => {
    if (!editingBet || !editingBet.question.trim()) return;
    setBetTriggers([...betTriggers, { ...editingBet, id: Math.random().toString(36).substr(2, 9) }].sort((a, b) => a.timestamp - b.timestamp));
    setEditingBet(null);
    toast.success("BET TRIGGER ATTACHED", { 
      description: `Market will initiate at ${editingBet.timestamp.toFixed(2)}s` 
    });
  };

  const removeBet = (id: string) => {
    setBetTriggers(betTriggers.filter(b => b.id !== id));
    if (previewingBet?.id === id) setPreviewingBet(null);
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(
        'vpulse-studio-draft',
        JSON.stringify({
          title,
          description,
          studioTab,
          category,
          visibility,
          tags,
          savedAt: Date.now(),
        }),
      );
      toast.success('Draft saved', { description: 'Stored on this device.' });
    } catch {
      toast.error('Could not save draft.');
    }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    if (tags.length >= 12) {
      toast.message('Maximum 12 tags.');
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((x) => x !== tag));

  const handleUpload = async () => {
    if (!title || !file) {
      toast.error("MISSION INCOMPLETE", { description: "Title and file are mandatory." });
      return;
    }
    if (!thumbnailFile) {
      toast.error("THUMBNAIL REQUIRED", { description: "Upload a thumbnail image or the video cannot be published." });
      return;
    }
    if (studioTab === 'live') {
      toast.error('Switch to Long video or Reels to publish a recording.');
      return;
    }
    if (studioTab === 'long' && videoDurationSeconds && videoDurationSeconds > 3600) {
      toast.error("DURATION LIMIT EXCEEDED", { description: "Long videos must be 60 minutes or less." });
      return;
    }
    if (wordCount > maxWords) {
      toast.error("DATA OVERFLOW", { description: `Description exceeds ${maxWords} word limit.` });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('video_type', studioTab === 'short' ? 'short' : 'long');
      formData.append('video_file', file);
      formData.append('duration_seconds', String(Math.round(videoDurationSeconds || 0)));
      formData.append('thumbnail', thumbnailFile);

      if (isEventReel && studioTab === 'short') {
        const eventData = new FormData();
        eventData.append('title', title);
        eventData.append('category', category);
        eventData.append('description', description);
        if (eventEndDate) eventData.append('end_date', eventEndDate);
        eventData.append('video_file', file);
        if (thumbnailFile) {
           eventData.append('image', thumbnailFile); // We use thumbnail as image fallback
        }
        
        if (eventReelType === 'challenge') {
           await eventApi.createChallenge(eventData);
        } else {
           eventData.append('button_label_yes', btnYes);
           eventData.append('button_label_no', btnNo);
           await eventApi.createPrediction(eventData);
        }
        
        toast.success("EVENT REEL PUBLISHED", { 
          description: "Your event reel is now live!" 
        });
        navigate('/events');
      } else {
        await api.post('/videos/upload/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
        
        toast.success("VIDEO UPLOADED", { 
          description: "Your video has been successfully uploaded to the platform." 
        });
        navigate('/profile');
      }
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      const ax = error as { response?: { data?: Record<string, unknown> } };
      const data = ax.response?.data;
      const thumbErr =
        data &&
        typeof data === 'object' &&
        'thumbnail' in data &&
        Array.isArray((data as { thumbnail?: string[] }).thumbnail)
          ? (data as { thumbnail: string[] }).thumbnail[0]
          : null;
      toast.error("UPLOAD FAILED", {
        description:
          thumbErr ||
          (typeof data === 'object' && data && 'detail' in data && typeof (data as { detail?: string }).detail === 'string'
            ? (data as { detail: string }).detail
            : "An error occurred while communicating with the server."),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="studio-page min-h-full bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">
              {studioTab === 'live' ? 'Live Studio' : 'Upload Studio'}
            </h1>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              {studioTab === 'live'
                ? 'Start a broadcast from the app or send RTMP from any encoder.'
                : 'Publish high-fidelity videos and reels to your channel'}
            </p>
            <div className="mt-4 inline-flex flex-wrap rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setStudioTab('long')}
                className={cn(
                  'rounded-md px-4 py-2 text-xs font-bold transition-colors',
                  studioTab === 'long' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50',
                )}
              >
                Long video
              </button>
              <button
                type="button"
                onClick={() => setStudioTab('short')}
                className={cn(
                  'rounded-md px-4 py-2 text-xs font-bold transition-colors',
                  studioTab === 'short' ? 'bg-[#FF2D55] text-white' : 'text-zinc-600 hover:bg-zinc-50',
                )}
              >
                Reels
              </button>
              <button
                type="button"
                onClick={() => setStudioTab('live')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold transition-colors',
                  studioTab === 'live'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-50',
                )}
              >
                <Radio className="h-3.5 w-3.5" />
                Live
              </button>
            </div>
          </div>
          {studioTab !== 'live' ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveDraft}
                className="rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={isUploading || !thumbnailFile || !file || !title.trim()}
                className="rounded-lg bg-[#FF2D55] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-200/80 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isUploading ? 'Publishing…' : 'Publish Content'}
              </button>
            </div>
          ) : null}
        </header>

        {studioTab === 'live' ? (
          <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Go Live Setup</h2>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest max-w-xl">
                  Go live either directly from this app (camera/screen share) or from external encoder. Once MediaMTX receives stream, your channel turns live automatically.
                </p>
              </div>
              {streamInfo && (
                <div className="flex flex-wrap items-center gap-2">
                  {streamInfo.is_live ? (
                    <span className="rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white animate-pulse">Live</span>
                  ) : (
                    <span className="rounded-lg bg-zinc-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-600">Waiting for encoder</span>
                  )}
                  {user?.username && (
                    <Link to={`/channel/${user.username}`} className="text-[10px] font-black uppercase tracking-widest text-neon-purple hover:underline">
                      Open channel
                    </Link>
                  )}
                </div>
              )}
            </div>
            {streamInfo && (
              <>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Steps</p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-[11px] font-bold text-zinc-700">
                    <li>Save your <strong className="uppercase">live title</strong> (what viewers see).</li>
                    <li>Click <strong className="uppercase">Start In-App Live</strong> for camera/screen broadcast, or use the ingest details below with any encoder.</li>
                    <li>When publishing starts, this page detects it and loads preview + chat.</li>
                  </ol>
                  <Link to="/go-live" className="inline-flex mt-2 rounded-xl bg-neon-cyan px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black">
                    Start In-App Live
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-200">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">Encoder Server URL (RTMP)</p>
                    <p className="text-xs font-mono text-zinc-900 break-all">{streamInfo.ingest_url}</p>
                    <button type="button" onClick={() => copyToClipboard(streamInfo.ingest_url, 'RTMP URL')} className="mt-2 text-[10px] font-black uppercase text-neon-purple">Copy</button>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-200">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">Encoder Stream key</p>
                    <p className="text-xs font-mono text-zinc-900 break-all">{streamInfo.stream_key}</p>
                    <button type="button" onClick={() => copyToClipboard(streamInfo.stream_key, 'stream key')} className="mt-2 text-[10px] font-black uppercase text-neon-purple">Copy</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1">Live Title</label>
                  <div className="flex gap-2">
                    <input value={streamTitle} onFocus={() => { streamTitleDirtyRef.current = true; }} onChange={(e) => { streamTitleDirtyRef.current = true; setStreamTitle(e.target.value); }} className="flex-1 bg-white border border-neon-cyan/30 rounded-xl p-3 text-xs font-black text-zinc-900 uppercase" />
                    <button type="button" onClick={saveLiveTitle} disabled={savingStreamTitle} className="px-4 rounded-xl bg-neon-cyan text-black text-[10px] font-black uppercase tracking-widest">
                      {savingStreamTitle ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-[8px] text-zinc-500 uppercase tracking-wider">
                    {user?.username && (
                      <span>
                        Channel ·{' '}
                        <Link to={`/channel/${user.username}`} className="text-neon-purple font-black">
                          @{user.username}
                        </Link>
                      </span>
                    )}
                  </div>
                </div>

                {streamInfo.is_live && streamInfo.stream_key && streamInfo.hls_url && (
                  <div className="space-y-2 pt-2 border-t border-zinc-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Broadcast preview ({streamInfo.viewer_count ?? 0} watching)</p>
                    <LivePlayerChat streamKey={streamInfo.stream_key} hlsUrl={streamInfo.hls_url} initialViewerCount={streamInfo.viewer_count ?? 0} />
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">

          {/* Drop zone or video preview */}
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all',
              previewUrl ? 'border-zinc-200' : 'border-2 border-dashed border-zinc-200',
              isDragging && !previewUrl ? 'border-zinc-400 bg-zinc-50' : '',
              studioTab === 'short' && previewUrl ? 'mx-auto max-w-sm' : 'w-full',
              studioTab === 'long' ? 'aspect-video' : previewUrl ? 'aspect-[9/16]' : '',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="h-full w-full bg-black object-cover"
                  controls={!previewingBet}
                  onTimeUpdate={() => setPreviewCurrentTime(videoRef.current?.currentTime ?? 0)}
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span
                    className={cn(
                      'rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg',
                      studioTab === 'long'
                        ? 'border-cyan-500/50 bg-cyan-400 text-black'
                        : isEventReel ? 'border-orange-500/50 bg-orange-500 text-white' : 'border-pink-500/50 bg-[#FF2D55] text-white',
                    )}
                  >
                    {studioTab === 'long' ? 'Long video' : isEventReel ? 'Event Reel' : 'Reel'}
                  </span>
                </div>
                {videoDurationSeconds != null && videoDurationSeconds > 0 ? (
                  <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-[15] bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
                    <BetMarkerTimeline
                      duration={videoDurationSeconds}
                      currentTime={previewCurrentTime}
                      markers={betTriggers.map((b) => ({ id: b.id, timestamp: b.timestamp }))}
                      activeMarkerId={previewingBet?.id ?? null}
                      label={
                        studioTab === 'short'
                          ? 'Reels timeline · bet markers'
                          : 'Play timeline · bet markers'
                      }
                      interactive
                      onSeek={(sec) => {
                        if (!videoRef.current || previewingBet) return;
                        videoRef.current.currentTime = Math.min(sec, videoRef.current.duration || sec);
                        setPreviewCurrentTime(videoRef.current.currentTime);
                      }}
                    />
                  </div>
                ) : null}
                <AnimatePresence>
                  {previewingBet && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute bottom-0 right-0 top-0 z-20 flex w-full flex-col overflow-y-auto border-l border-pink-500/30 bg-zinc-950/95 p-6 shadow-[-20px_0_50px_rgba(255,0,85,0.1)] backdrop-blur-2xl sm:w-[320px] no-scrollbar"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-pulse" />
                      <div className="mb-6 flex shrink-0 items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                            <TrendingUp className="h-5 w-5 stroke-[3] text-black" />
                          </div>
                          <div>
                            <h2 className="text-lg font-black uppercase italic leading-none tracking-tighter text-white">
                              Live Market
                            </h2>
                            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400">
                              Pool: Preview
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewingBet(null);
                            videoRef.current?.play();
                          }}
                          className="group flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                        >
                          <X className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-cyan-400" />
                        </button>
                      </div>
                      <div className="flex flex-1 flex-col justify-center space-y-6">
                        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5">
                          <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                            Alpha Event Preview
                          </p>
                          <h3 className="text-sm font-bold uppercase leading-tight tracking-tight text-zinc-100">
                            {previewingBet.question}
                          </h3>
                        </div>
                        <div
                          className={`grid gap-3 ${previewingBet.options.length > 2 ? 'grid-cols-1' : 'grid-cols-2'}`}
                        >
                          {previewingBet.options?.map((opt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-white/5 p-4 text-zinc-500"
                            >
                              <span className="text-xl font-black italic">{opt || `OPTION ${idx + 1}`}</span>
                              <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">
                                1.82x Boost
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Stake Amount</p>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                            <input
                              disabled
                              placeholder="ENTER PULSE..."
                              className="w-full rounded-xl border border-white/5 bg-white/5 px-10 py-3 font-mono text-sm text-white outline-none placeholder:text-zinc-700"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-cyan-400/50 py-4 text-sm font-black uppercase italic tracking-[0.2em] text-black grayscale"
                        >
                          CONFIRM POSITION
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <label className="flex flex-col items-center px-8 py-12 text-center cursor-pointer group">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 transition-transform group-hover:scale-110">
                  <Upload className="h-10 w-10 text-zinc-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Drag and drop video files to upload</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
                  Your videos stay private until you publish. MP4, WEBM, MOV — long videos up to 60 minutes.
                </p>
                <div className="mt-8 rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold tracking-wide text-white transition-colors group-hover:bg-zinc-800">
                  Select files
                </div>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {isUploading ? (
            <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <FileVideo className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-zinc-900">{file?.name ?? 'Uploading…'}</p>
                    <p className="text-xs text-zinc-500">Publishing to your channel…</p>
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-zinc-900" />
              </div>
            </div>
          ) : null}

          <section className="space-y-6 rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm">
            <h3 className="flex items-center text-lg font-bold text-zinc-900">
              <FileVideo className="mr-2 h-5 w-5 text-zinc-600" />
              Video details
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Video title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title that describes your video"
                className="w-full rounded-xl border border-zinc-200 py-3 px-4 text-sm text-zinc-900 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Description</label>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    wordCount > maxWords ? 'text-[#FF2D55]' : 'text-zinc-400',
                  )}
                >
                  {wordCount} / {maxWords} words
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                rows={4}
                className="w-full resize-none rounded-xl border border-zinc-200 py-3 px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="studio-category-input" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Category
                </label>
                <input
                  id="studio-category-input"
                  type="text"
                  list="studio-category-presets"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Choose or type a category"
                  autoComplete="off"
                  className="w-full rounded-xl border border-zinc-200 bg-white py-3 px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
                <datalist id="studio-category-presets">
                  {CATEGORY_PRESETS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="text-[11px] text-zinc-400">Pick a suggestion from the list or enter any category.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-200 bg-white py-3 px-4 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tags</label>
              <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-200 p-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-zinc-500 hover:text-zinc-900"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag…"
                  className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-xs outline-none ring-0 placeholder:text-zinc-400"
                />
              </div>
              <p className="text-[11px] text-zinc-400">Press Enter to add. Stored locally with your draft.</p>
            </div>
          </section>

          {/* Timeline & Bet Manager */}
          {previewUrl && (
             <div className="space-y-6 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                   <div className="space-y-1">
                      <h3 className="text-lg font-bold text-zinc-900">Market timeline</h3>
                      <p className="text-xs text-zinc-500">
                        Pin bets on the scrubber for long uploads and reels. Seek the preview, then add a trigger.
                      </p>
                   </div>
                   <button 
                     type="button"
                     onClick={addBetTrigger}
                     className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition-all hover:bg-violet-700"
                   >
                     <TrendingUp className="h-4 w-4" />
                     Add bet marker
                   </button>
                </div>

                <div className="space-y-4">
                   {betTriggers.length === 0 && !editingBet && (
                     <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center">
                        <Clock className="h-8 w-8 text-zinc-400" />
                        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">No bet markers yet</p>
                     </div>
                   )}

                   <div className="space-y-3">
                      {betTriggers.map((bet) => (
                        <div key={bet.id} className="group flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition-all hover:border-cyan-500/40">
                           <div className="flex items-center gap-4">
                              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-black text-cyan-700">
                                 {bet.timestamp.toFixed(1)}s
                              </div>
                              <span className="text-sm font-semibold text-zinc-900">{bet.question}</span>
                           </div>
                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => {
                                  setPreviewingBet(bet);
                                  videoRef.current?.pause();
                                  if (videoRef.current) {
                                    videoRef.current.currentTime = bet.timestamp;
                                  }
                                }} 
                                className="p-2 rounded-xl text-zinc-500 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                                title="Preview Bet UI"
                              >
                                 <Eye className="h-4 w-4" />
                              </button>
                              <button onClick={() => removeBet(bet.id)} className="p-2 rounded-xl text-zinc-500 hover:text-neon-pink hover:bg-neon-pink/10 transition-all">
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                      ))}

                      {editingBet && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 rounded-[1.5rem] bg-zinc-50 border border-zinc-200 space-y-4"
                        >
                           <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-neon-purple uppercase tracking-widest">NEW MARKET CONFIG @ {editingBet.timestamp.toFixed(1)}s</span>
                              <button onClick={() => setEditingBet(null)}><X className="h-4 w-4 text-zinc-500" /></button>
                           </div>
                           <input 
                             autoFocus
                             value={editingBet.question}
                             onChange={(e) => setEditingBet({...editingBet, question: e.target.value})}
                             placeholder="WHAT SHOULD THE PREDICTION BE? (E.G. WILL HE WIN THIS FIGHT?)"
                             className="w-full bg-white border border-zinc-200 rounded-xl p-4 text-[10px] font-black text-zinc-900 tracking-widest focus:border-neon-purple outline-none uppercase placeholder:text-zinc-400"
                           />
                           
                           <div className="space-y-2">
                             {editingBet.options.map((opt, idx) => (
                               <div key={idx} className="flex items-center gap-2">
                                 <input 
                                   value={opt}
                                   onChange={(e) => {
                                     const newOpts = [...editingBet.options];
                                     newOpts[idx] = e.target.value;
                                     setEditingBet({...editingBet, options: newOpts});
                                   }}
                                   placeholder={`OPTION ${idx + 1}`}
                                   className="flex-1 bg-white border border-zinc-200 rounded-xl p-3 text-[10px] font-black text-zinc-900 tracking-widest focus:border-neon-purple outline-none uppercase placeholder:text-zinc-400"
                                 />
                                 {editingBet.options.length > 2 && (
                                   <button 
                                     onClick={() => {
                                       const newOpts = editingBet.options.filter((_, i) => i !== idx);
                                       setEditingBet({...editingBet, options: newOpts});
                                     }}
                                     className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </button>
                                 )}
                               </div>
                             ))}
                             {editingBet.options.length < 4 && (
                               <button 
                                 onClick={() => setEditingBet({...editingBet, options: [...editingBet.options, ""]})}
                                 className="w-full py-2 bg-zinc-100 text-zinc-500 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 hover:text-zinc-700 transition-all"
                               >
                                 <Plus className="h-3 w-3" /> Add Option
                               </button>
                             )}
                           </div>

                           <button 
                             onClick={saveBet}
                             className="w-full py-3 bg-neon-purple text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-[0_4px_15px_rgba(112,0,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                           >
                             CONFIRM TRIGGER
                           </button>
                        </motion.div>
                      )}
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Right column: thumbnail, tips, toggles */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center text-base font-bold text-zinc-900">
              <ImagePlus className="mr-2 h-5 w-5" />
              Thumbnail
            </h3>
            <p className="mb-4 text-xs text-zinc-500">
              Select or upload a picture that shows what&apos;s in your video.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition-colors hover:border-zinc-900">
                <input
                  id="studio-thumb-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                <ImagePlus className="mb-1 h-6 w-6 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Custom</span>
              </label>
              <div
                className={cn(
                  'relative aspect-video cursor-pointer overflow-hidden rounded-lg border-2 bg-zinc-200 transition-colors',
                  thumbnailFile ? 'border-zinc-900' : 'border-transparent hover:opacity-90'
                )}
                onClick={() => document.getElementById('studio-thumb-input')?.click()}
              >
                {thumbnailPreviewUrl ? (
                  <>
                    <img src={thumbnailPreviewUrl} alt="" className="h-full w-full object-cover opacity-90" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <CheckCircle2 className="h-8 w-8 text-white drop-shadow-md" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-500">
                    Pick image
                  </div>
                )}
              </div>
              <div className="aspect-video cursor-pointer overflow-hidden rounded-lg bg-zinc-300 opacity-80 transition-opacity hover:opacity-100" />
              <div className="aspect-video cursor-pointer overflow-hidden rounded-lg bg-zinc-400 opacity-80 transition-opacity hover:opacity-100" />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('studio-thumb-input')?.click()}
              className="w-full rounded-lg border border-zinc-200 py-2.5 text-sm font-bold transition-colors hover:bg-zinc-50"
            >
              Upload custom thumbnail
            </button>
          </section>

          {studioTab === 'short' && (
            <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-lg shadow-inner">⚡</div>
                   <div>
                     <h3 className="text-sm font-bold text-zinc-900 leading-tight">Make it an Event Reel</h3>
                     <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500 mt-0.5">Attach Challenge / Prediction</p>
                   </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEventReel(!isEventReel)}
                  className={cn(
                    'relative h-6 w-12 shrink-0 rounded-full transition-colors border',
                    isEventReel ? 'bg-orange-500 border-orange-600' : 'bg-zinc-200 border-zinc-300',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all',
                      isEventReel ? 'right-1' : 'left-1',
                    )}
                  />
                </button>
              </div>

              {isEventReel && (
                <div className="space-y-4 pt-5 border-t border-orange-500/20">
                  <div className="flex gap-2">
                     <button type="button" onClick={() => setEventReelType('challenge')} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition", eventReelType === 'challenge' ? "bg-blue-600 text-white shadow-md" : "bg-white border border-zinc-200 text-zinc-500")}>Challenge</button>
                     <button type="button" onClick={() => setEventReelType('prediction')} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition", eventReelType === 'prediction' ? "bg-orange-600 text-white shadow-md" : "bg-white border border-zinc-200 text-zinc-500")}>Prediction</button>
                  </div>
                  
                  {eventReelType === 'prediction' && (
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Yes Label</label>
                          <input value={btnYes} onChange={e=>setBtnYes(e.target.value)} className="w-full mt-1 bg-white border border-green-500/50 rounded-xl px-3 py-2.5 text-zinc-900 text-xs font-bold outline-none focus:border-green-500 transition shadow-sm" />
                       </div>
                       <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">No Label</label>
                          <input value={btnNo} onChange={e=>setBtnNo(e.target.value)} className="w-full mt-1 bg-white border border-red-500/50 rounded-xl px-3 py-2.5 text-zinc-900 text-xs font-bold outline-none focus:border-red-500 transition shadow-sm" />
                       </div>
                    </div>
                  )}

                  <div>
                     <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">End Date (optional)</label>
                     <input value={eventEndDate} onChange={e=>setEventEndDate(e.target.value)} placeholder="e.g. Dec 31, 2026" className="w-full mt-1 bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-900 text-xs outline-none focus:border-orange-500 transition shadow-sm" />
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="rounded-2xl bg-zinc-900 p-6 text-white shadow-xl">
            <div className="mb-4 flex items-center space-x-3">
              <div className="rounded-lg bg-zinc-800 p-2">
                <Info className="h-5 w-5 text-zinc-400" />
              </div>
              <h4 className="text-sm font-bold">Optimization tips</h4>
            </div>
            <ul className="space-y-3 text-xs leading-relaxed text-zinc-400">
              <li className="flex items-start">
                <span className="mr-2 font-bold text-zinc-200">01.</span>
                Keep titles under 60 characters for better mobile visibility.
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold text-zinc-200">02.</span>
                Add at least 3 descriptive tags to improve search ranking.
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold text-zinc-200">03.</span>
                High-contrast thumbnails get more clicks on average.
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setCommentsSectionOpen((v) => !v)}
              aria-expanded={commentsSectionOpen}
              className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-zinc-50"
            >
              <div className="flex min-w-0 items-center space-x-3">
                <MessageCircle className="h-5 w-5 shrink-0 text-zinc-500" />
                <div className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-900">Comments</span>
                  <span className="text-xs text-zinc-500">
                    {commentsEnabled ? 'Viewers can comment' : 'Comments are hidden'}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200',
                  commentsSectionOpen && 'rotate-180',
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {commentsSectionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-zinc-100"
                >
                  <div className="flex items-center justify-between gap-4 p-4 pt-3">
                    <span className="text-sm font-medium text-zinc-900">Enable comments</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={commentsEnabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommentsEnabled((v) => !v);
                      }}
                      className={cn(
                        'relative h-5 w-10 shrink-0 rounded-full transition-colors',
                        commentsEnabled ? 'bg-zinc-900' : 'bg-zinc-200',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
                          commentsEnabled ? 'right-0.5' : 'left-0.5',
                        )}
                      />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full rounded-xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Studio;
