import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  X, 
  Video, 
  Layers, 
  Zap, 
  Clock, 
  Plus, 
  Trash2, 
  Save,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  Eye,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../services/api';

const Studio = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState<'long' | 'short'>('long');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Timed Bet States
  const [betTriggers, setBetTriggers] = useState<{ id: string; timestamp: number; question: string; options: string[] }[]>([]);
  const [editingBet, setEditingBet] = useState<{ timestamp: number; question: string; options: string[] } | null>(null);
  const [previewingBet, setPreviewingBet] = useState<{ id: string; timestamp: number; question: string; options: string[] } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length;
  const maxWords = contentType === 'long' ? 200 : 20;

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

  const handleUpload = async () => {
    if (!title || !file) {
      toast.error("MISSION INCOMPLETE", { description: "Title and file are mandatory." });
      return;
    }
    if (contentType === 'long' && videoDurationSeconds && videoDurationSeconds > 3600) {
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
      formData.append('video_type', contentType);
      formData.append('video_file', file);
      formData.append('duration_seconds', String(Math.round(videoDurationSeconds || 0)));
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      if (betTriggers.length > 0) {
        formData.append('bet_markers', JSON.stringify(betTriggers.map(b => ({
          timestamp: b.timestamp,
          question: b.question,
          options: b.options.map((opt, i) => ({ text: opt, odds: 2.0 }))
        }))));
      }

      await api.post('/videos/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      toast.success("VIDEO UPLOADED", { 
        description: "Your video has been successfully uploaded to the platform." 
      });
      navigate('/profile');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error("UPLOAD FAILED", { description: "An error occurred while communicating with the server." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void lg:p-10 p-4 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Creator Studio</h1>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Manage and Upload Content</p>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
           <button 
             onClick={() => setContentType('long')}
             className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               contentType === 'long' ? "bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,243,255,0.3)]" : "text-zinc-500 hover:text-white"
             }`}
           >
             Long Video
           </button>
           <button 
             onClick={() => setContentType('short')}
             className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               contentType === 'short' ? "bg-neon-pink text-white shadow-[0_0_20px_rgba(255,0,85,0.3)]" : "text-zinc-500 hover:text-white"
             }`}
           >
             Shorts / Reels
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left Column: Form */}
        <div className="xl:col-span-2 space-y-8">
           <div className="studio-creator-form-card p-8 rounded-[3rem] bg-white border-2 border-neon-pink space-y-8 relative overflow-hidden group">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-2">Video Title</label>
                    <input 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ENTER VIDEO TITLE..."
                      className="studio-creator-form-field w-full bg-white border border-neon-pink/30 rounded-2xl p-5 text-sm font-black text-zinc-900 tracking-widest focus:border-neon-pink focus:ring-0 outline-none uppercase transition-all placeholder:text-zinc-400"
                    />
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between px-2">
                      <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Description</label>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${wordCount > maxWords ? "text-neon-pink" : "text-zinc-500"}`}>
                        {wordCount} / {maxWords} Words
                      </span>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={`ENTER VIDEO DESCRIPTION (MAX ${maxWords} WORDS)...`}
                      className="studio-creator-form-field w-full bg-white border border-neon-pink/30 rounded-[1.5rem] p-6 text-sm font-black text-zinc-900 tracking-widest focus:border-neon-pink focus:ring-0 outline-none uppercase min-h-[150px] transition-all resize-none placeholder:text-zinc-400"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-2">Thumbnail (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="studio-creator-form-field w-full bg-white border border-neon-pink/30 rounded-2xl p-4 text-xs font-black text-zinc-900 tracking-widest focus:border-neon-pink focus:ring-0 outline-none uppercase transition-all file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-[10px] file:font-black file:text-zinc-700"
                    />
                    {thumbnailPreviewUrl && (
                      <div className="rounded-xl overflow-hidden border border-neon-pink/20 w-full max-w-xs">
                        <img src={thumbnailPreviewUrl} alt="Thumbnail preview" className="w-full h-32 object-cover" />
                      </div>
                    )}
                 </div>
              </div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-[50px] pointer-events-none" />
           </div>

          {/* Timeline & Bet Manager */}
          {previewUrl && (
             <div className="p-8 rounded-[3rem] bg-white border-2 border-neon-pink space-y-8">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black text-zinc-900 italic uppercase tracking-tighter">Market Timeline</h3>
                      <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Pin market triggers to specific timestamps</p>
                   </div>
                   <button 
                     onClick={addBetTrigger}
                     className="flex items-center gap-2 px-6 py-3 bg-neon-purple text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(112,0,255,0.2)]"
                   >
                     <TrendingUp className="h-4 w-4" />
                     DRIP TRIGGER
                   </button>
                </div>

                <div className="space-y-4">
                   {betTriggers.length === 0 && !editingBet && (
                     <div className="p-10 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center text-center space-y-4 opacity-50">
                        <Clock className="h-8 w-8 text-zinc-700" />
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No Temporal Pulse Detected</p>
                     </div>
                   )}

                   <div className="space-y-3">
                      {betTriggers.map((bet) => (
                        <div key={bet.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-neon-cyan/30 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="px-3 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-mono font-black">
                                 {bet.timestamp.toFixed(1)}s
                              </div>
                              <span className="text-xs font-bold text-white uppercase tracking-tight">{bet.question}</span>
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

        {/* Right Column: Preview & Upload */}
        <div className="space-y-8">
           <div className={cn(
               "rounded-[2.5rem] bg-zinc-950 border relative overflow-hidden flex flex-col items-center justify-center group shadow-2xl transition-all duration-500",
               contentType === 'long' ? "aspect-video w-full" : "aspect-[9/16] w-full max-w-[360px] mx-auto",
               isDragging ? "border-neon-cyan bg-neon-cyan/5 scale-[1.02]" : "border-white/5"
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
                    className="w-full h-full object-cover opacity-80"
                    controls={contentType === 'long' && !previewingBet}
                  />
                  <div className="absolute top-6 left-6 flex gap-2">
                     <div className={cn(
                       "px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl border",
                       contentType === 'long' ? "bg-neon-cyan border-neon-cyan/50 text-black" : "bg-neon-pink border-neon-pink/50 text-white"
                     )}>
                        {contentType === 'long' ? 'Transmission' : 'Velocity'}
                     </div>
                  </div>

                  <AnimatePresence>
                    {previewingBet && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute right-0 top-0 bottom-0 w-full sm:w-[320px] bg-zinc-950/95 backdrop-blur-2xl border-l border-neon-pink/30 p-6 flex flex-col z-20 shadow-[-20px_0_50px_rgba(255,0,85,0.1)] overflow-y-auto no-scrollbar"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-neon-pink to-transparent animate-pulse" />

                        <div className="mb-6 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                              <TrendingUp className="h-5 w-5 text-black stroke-[3]" />
                            </div>
                            <div>
                              <h2 className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">Live Market</h2>
                              <p className="text-[8px] font-black tracking-[0.2em] text-neon-cyan uppercase mt-1">Pool: Preview</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setPreviewingBet(null);
                              videoRef.current?.play();
                            }}
                            className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group hover:border-neon-cyan/50 hover:bg-neon-cyan/10 transition-all"
                          >
                            <X className="h-4 w-4 text-zinc-500 group-hover:text-neon-cyan transition-colors" />
                          </button>
                        </div>

                        <div className="space-y-6 flex-1 flex flex-col justify-center">
                          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Alpha Event Preview</p>
                            <h3 className="text-sm font-bold text-zinc-100 leading-tight tracking-tight uppercase">{previewingBet.question}</h3>
                          </div>

                          <div className={`grid gap-3 ${previewingBet.options.length > 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {previewingBet.options?.map((opt, idx) => (
                              <button key={idx} className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-white/5 p-4 text-zinc-500">
                                <span className="text-xl font-black italic">{opt || `OPTION ${idx + 1}`}</span>
                                <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">1.82x Boost</span>
                              </button>
                            ))}
                          </div>

                          <div className="space-y-3">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Stake Amount</p>
                            <div className="relative group">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neon-cyan" />
                              <input 
                                disabled
                                placeholder="ENTER PULSE..." 
                                className="w-full rounded-xl bg-white/5 px-10 py-3 text-sm font-mono outline-none border border-white/5 text-white placeholder:text-zinc-700"
                              />
                            </div>
                          </div>

                          <button 
                            disabled
                            className="w-full py-4 rounded-xl bg-neon-cyan/50 font-black text-black text-sm tracking-[0.2em] uppercase italic flex items-center justify-center grayscale cursor-not-allowed mt-4"
                          >
                            CONFIRM POSITION
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                   <div className="h-24 w-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-neon-cyan/50 transition-all">
                      <Upload className="h-8 w-8 text-zinc-500 group-hover:text-neon-cyan" />
                   </div>
                   <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">DRAG MEDIA TO UPLOAD</p>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">MP4, WEBM, MOV (LONG VIDEOS: UP TO 60 MIN)</p>
                   </div>
                   <input 
                     type="file" 
                     accept="video/*" 
                     className="absolute inset-0 opacity-0 cursor-pointer"
                     onChange={handleFileChange}
                   />
                </div>
              )}
           </div>

           <div className="space-y-4">
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-5 bg-white text-black font-black uppercase tracking-[.2em] text-sm rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
              >
                {isUploading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                    UPLOADING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    UPLOAD VIDEO
                  </>
                )}
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full py-5 bg-white/5 border border-white/5 text-zinc-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all"
              >
                CANCEL
              </button>
           </div>

           <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Operative Protocol</p>
                 <p className="text-[8px] font-bold text-zinc-500 leading-normal uppercase">BY INITIATING THIS BROADCAST, YOU VERIFY THAT NO INTEL IS CLASSIFIED ILLEGALLY AND ADHERE TO GRID HARMONY GUIDELINES.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Studio;
