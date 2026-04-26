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
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Studio = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState<'long' | 'short'>('long');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Timed Bet States
  const [betTriggers, setBetTriggers] = useState<{ id: string; timestamp: number; question: string }[]>([]);
  const [editingBet, setEditingBet] = useState<{ timestamp: number; question: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length;
  const maxWords = contentType === 'long' ? 200 : 20;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      toast.error("INVALID PAYLOAD", { description: "Operational parameters only allow video files." });
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
    setEditingBet({ timestamp: currentTime, question: "" });
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
  };

  const handleUpload = () => {
    if (!title || !file) {
      toast.error("MISSION INCOMPLETE", { description: "Title and file are mandatory." });
      return;
    }
    if (wordCount > maxWords) {
      toast.error("DATA OVERFLOW", { description: `Description exceeds ${maxWords} word limit.` });
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success("VIDEO UPLOADED", { 
        description: "Your video has been successfully uploaded to the platform." 
      });
      navigate('/profile');
    }, 2000);
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
           <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 space-y-8 relative overflow-hidden group">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2">Video Title</label>
                    <input 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ENTER VIDEO TITLE..."
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white tracking-widest focus:border-neon-cyan/30 outline-none uppercase transition-all"
                    />
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between px-2">
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Description</label>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${wordCount > maxWords ? "text-neon-pink" : "text-zinc-500"}`}>
                        {wordCount} / {maxWords} Words
                      </span>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={`ENTER VIDEO DESCRIPTION (MAX ${maxWords} WORDS)...`}
                      className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] p-6 text-sm font-black text-white tracking-widest focus:border-neon-cyan/30 outline-none uppercase min-h-[150px] transition-all resize-none"
                    />
                 </div>
              </div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-[50px] pointer-events-none" />
           </div>

           {/* Timeline & Bet Manager (Only for Long) */}
           {contentType === 'long' && previewUrl && (
             <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 space-y-8">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Market Timeline</h3>
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Pin market triggers to specific timestamps</p>
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
                           <button onClick={() => removeBet(bet.id)} className="p-2 rounded-xl text-zinc-500 hover:text-neon-pink hover:bg-neon-pink/10 transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                      ))}

                      {editingBet && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 rounded-[1.5rem] bg-neon-purple/5 border border-neon-purple/20 space-y-4"
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
                             className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[10px] font-black text-white tracking-widest focus:border-neon-purple/50 outline-none uppercase"
                           />
                           <button 
                             onClick={saveBet}
                             className="w-full py-3 bg-neon-purple text-white text-[10px] font-black rounded-xl uppercase tracking-widest"
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
               "aspect-video xl:aspect-[9/16] rounded-[2.5rem] bg-zinc-950 border relative overflow-hidden flex flex-col items-center justify-center group shadow-2xl transition-all duration-500",
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
                    controls={contentType === 'long'}
                  />
                  <div className="absolute top-6 left-6 flex gap-2">
                     <div className={cn(
                       "px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl border",
                       contentType === 'long' ? "bg-neon-cyan border-neon-cyan/50 text-black" : "bg-neon-pink border-neon-pink/50 text-white"
                     )}>
                        {contentType === 'long' ? 'Transmission' : 'Velocity'}
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                   <div className="h-24 w-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-neon-cyan/50 transition-all">
                      <Upload className="h-8 w-8 text-zinc-500 group-hover:text-neon-cyan" />
                   </div>
                   <div className="text-center space-y-1">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">DRAG MEDIA TO UPLOAD</p>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">MP4, WEBM, MOV (MAX 500MB)</p>
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
