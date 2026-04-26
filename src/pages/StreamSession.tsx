import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings, 
  Users, 
  TrendingUp, 
  MessageSquare,
  Zap,
  Radio,
  Plus,
  Send,
  Heart,
  Activity,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const StreamSession = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showBetCreator, setShowBetCreator] = useState(false);
  const [betActive, setBetActive] = useState(false);
  const [betQuestion, setBetQuestion] = useState("");
  const [betPool, setBetPool] = useState(0);
  const [selectedBetSide, setSelectedBetSide] = useState<'yes' | 'no' | null>(null);
  const [stakeAmount, setStakeAmount] = useState(100);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('vpulse-theme');
    return stored === 'light' ? 'light' : 'dark';
  });

  const [comments, setComments] = useState([
    { user: 'BULL_RAIDER', text: 'LETS GOOOO!! 🚀', color: 'text-cyan-400' },
    { user: 'BEAR_TRAP', text: 'Probability check?', color: 'text-pink-500' },
    { user: 'ALPHA_DOG', text: 'Market looks ready for a squeeze.', color: 'text-purple-400' },
  ]);

  const [newComment, setNewComment] = useState("");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast.success("HARDWARE SYNCED", {
        description: "Camera and Microphone are now under operative control."
      });
    } catch (err) {
      console.error("Camera access failed:", err);
      toast.error("HARDWARE FAILURE", {
        description: "Could not establish secure link to camera/mic. Check terminal permissions."
      });
      setIsVideoOff(true);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup: Stop all tracks when leaving the mission
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vpulse-theme', theme);
  }, [theme]);

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        
        if (videoTrack.enabled) {
          toast.success("CAMERA ENABLED", {
            description: "Visual transmission has been restored."
          });
        } else {
          toast.info("CAMERA DISABLED", {
            description: "Privacy mode active. Feed is masked."
          });
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        if (streamRef.current && videoRef.current) {
          const videoTrack = streamRef.current.getVideoTracks()[0];
          const sender = streamRef.current; // Simplified for this mock
          
          // In a real app, we'd replace the track on the peer connection
          // Here we update the local preview
          videoRef.current.srcObject = screenStream;
          setIsScreenSharing(true);
          setIsVideoOff(false);

          screenTrack.onended = () => {
            stopScreenShare();
          };
        }
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Screen share failed:", err);
      toast.error("SCREEN SYNC FAILURE", {
        description: "Could not establish screen capture link."
      });
    }
  };

  const stopScreenShare = () => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      setIsScreenSharing(false);
      toast.info("SCREEN LINK SEVERED", {
        description: "Reverted to camera transmission."
      });
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([...comments, { user: 'HOST', text: newComment, color: 'text-neon-cyan' }]);
    setNewComment("");
  };

  const handleCreateBet = () => {
    if (!betQuestion.trim()) {
      toast.error("MISSION OBJECTIVE REQUIRED");
      return;
    }
    setBetActive(true);
    setBetPool(2500);
    setSelectedBetSide(null);
    setShowBetCreator(false);
    toast.success("CLASSIFIED MARKET DEPLOYED", {
      description: "Operatives can now stake on the outcome."
    });
    // Simulate pool growth
    const interval = setInterval(() => {
      setBetPool(prev => prev + Math.floor(Math.random() * 500));
    }, 2000);
    return () => clearInterval(interval);
  };

  const handlePlaceBet = () => {
    if (!selectedBetSide) {
      toast.error("SELECT BET SIDE", {
        description: "Choose YES or NO before placing your stake."
      });
      return;
    }
    const amount = Math.max(1, stakeAmount || 0);
    setBetPool((prev) => prev + amount);
    toast.success("BET EXECUTED", {
      description: `Stake $${amount} added to ${selectedBetSide.toUpperCase()}.`
    });
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-black flex flex-col lg:flex-row lg:overflow-hidden font-sans">
      {/* Main Stream Area */}
      <div className="flex-1 relative flex flex-col min-h-[58vh] lg:min-h-0">
        {/* Virtual & Real Camera View */}
        <div className="absolute inset-0 bg-zinc-950 overflow-hidden">
           <video 
             ref={videoRef}
             autoPlay 
             playsInline 
             muted 
             className={cn(
               "h-full w-full object-cover transition-opacity duration-700",
               (isVideoOff && !isScreenSharing) ? "opacity-0" : "opacity-100"
             )}
           />
           
           <div className={cn(
             "absolute inset-0 flex items-center justify-center transition-opacity duration-700 pointer-events-none bg-black/60",
             (isVideoOff && !isScreenSharing) ? "opacity-100" : "opacity-0"
           )}>
              <div className="flex flex-col items-center gap-6">
                 <div className="h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] bg-neon-pink/10 border-2 border-neon-pink/30 flex items-center justify-center">
                    <VideoOff className="h-16 w-16 text-neon-pink animate-pulse" />
                 </div>
                 <p className="text-[9px] sm:text-[10px] font-black text-neon-pink uppercase tracking-[0.2em] sm:tracking-[0.4em] italic shadow-[0_0_20px_rgba(255,0,85,0.3)] text-center">Transmission Masked</p>
              </div>
           </div>

           {/* Placeholder Overlay for depth */}
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-black/40 to-purple-950/20 pointer-events-none" />
           
           {/* Static HUD overlay when NOT live */}
           {!isLive && !isVideoOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -translate-y-8 sm:-translate-y-6 lg:translate-y-0">
                 <div className="space-y-3 sm:space-y-4 text-center z-10 bg-black/40 backdrop-blur-xl p-5 sm:p-8 lg:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3rem] border border-white/5 mx-4">
                    <div className="relative inline-block">
                       <div className="h-24 w-24 rounded-full border-2 border-white/20 border-t-neon-cyan animate-spin" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Radio className="h-8 w-8 text-white" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] sm:tracking-[0.4em] text-white italic">Standby Mode</p>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">System hot. Link ready. <br/> Awaiting manual initiation.</p>
                    </div>
                 </div>
              </div>
           )}

           {/* Decorative HUD Elements */}
           <div className="absolute top-5 left-4 sm:top-8 sm:left-8 lg:top-10 lg:left-10 space-y-2 sm:space-y-3 lg:space-y-4 pointer-events-none">
              <div className="flex items-center gap-3">
                 <div className={cn("h-3 w-3 rounded-full animate-ping", isLive ? "bg-neon-pink" : "bg-zinc-600")} />
                 <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest italic">{isLive ? 'LIVE TRANSMISSION' : 'STANDBY'}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-zinc-500 font-mono tracking-tighter uppercase">
                <Activity className="h-3 w-3" />
                BITRATE: {isLive ? '12.4 MBPS' : '0.0 MBPS'}
              </div>
           </div>
           
           <button
             onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
             className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 h-10 w-10 rounded-xl bg-black/40 border border-white/15 text-white flex items-center justify-center hover:border-neon-cyan transition-all"
             title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
           >
             {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
           </button>

           <div className="absolute bottom-40 sm:bottom-44 lg:bottom-42 left-1/2 -translate-x-1/2 w-[92%] sm:w-[84%] lg:w-[80%] max-w-lg pointer-events-auto">
             <AnimatePresence>
               {betActive && (
                 <motion.div 
                   initial={{ opacity: 0, y: 50, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                 className="p-4 sm:p-6 lg:p-8 rounded-[1.25rem] sm:rounded-[2rem] lg:rounded-[2.5rem] bg-void/80 backdrop-blur-2xl border border-neon-cyan/30 shadow-[0_0_50px_rgba(0,243,255,0.1)] relative overflow-hidden"
                 >
                   <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-neon-cyan uppercase tracking-[0.3em]">
                         <TrendingUp className="h-3 w-3" />
                         Active Market Session
                      </div>
                      <h3 className="text-base sm:text-xl lg:text-2xl font-black text-white uppercase italic tracking-tighter">{betQuestion}</h3>
                      <div className="flex gap-3 sm:gap-4 w-full pt-2">
                         <div className="flex-1 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <div className="text-[8px] font-black uppercase tracking-widest mb-1">POOL YES</div>
                            <div className="text-xl font-black font-mono tracking-tighter">${(betPool * 0.65).toLocaleString()}</div>
                         </div>
                         <div className="flex-1 p-4 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink">
                            <div className="text-[8px] font-black uppercase tracking-widest mb-1">POOL NO</div>
                            <div className="text-xl font-black font-mono tracking-tighter">${(betPool * 0.35).toLocaleString()}</div>
                         </div>
                      </div>
                      <div className="w-full grid grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => setSelectedBetSide('yes')}
                          className={cn(
                            "rounded-xl py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all",
                            selectedBetSide === 'yes'
                              ? "bg-neon-cyan text-black border-neon-cyan shadow-[0_0_20px_rgba(255,0,183,0.35)]"
                              : "bg-white/5 text-white border-white/10 hover:border-neon-cyan/40"
                          )}
                        >
                          BET YES
                        </button>
                        <button
                          onClick={() => setSelectedBetSide('no')}
                          className={cn(
                            "rounded-xl py-3 text-[10px] font-black uppercase tracking-[0.2em] border transition-all",
                            selectedBetSide === 'no'
                              ? "bg-neon-cyan text-black border-neon-cyan shadow-[0_0_20px_rgba(255,0,183,0.35)]"
                              : "bg-white/5 text-white border-white/10 hover:border-neon-cyan/40"
                          )}
                        >
                          BET NO
                        </button>
                      </div>
                      <div className="w-full flex flex-col sm:flex-row gap-3 pt-1">
                        <input
                          type="number"
                          min={1}
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(Number(e.target.value))}
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black tracking-[0.16em] uppercase text-white outline-none focus:border-neon-cyan/50"
                          placeholder="Stake Amount"
                        />
                        <button
                          onClick={handlePlaceBet}
                          className="rounded-xl px-6 py-3 bg-neon-cyan text-black text-[10px] font-black uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(255,0,183,0.25)] hover:brightness-110 transition-all"
                        >
                          PLACE BET
                        </button>
                      </div>
                   </div>
                   <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500/30 via-neon-cyan/20 to-neon-pink/30" />
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>

        {/* Overlay Controls */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent px-3 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-0 lg:h-32 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
           <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <button 
                onClick={toggleMute}
                className={cn(
                  "h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all border",
                  isMuted ? "bg-neon-pink/10 border-neon-pink/30 text-neon-pink" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <button 
                onClick={toggleVideo}
                className={cn(
                  "h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all border",
                  isVideoOff ? "bg-neon-pink/10 border-neon-pink/30 text-neon-pink" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </button>
              <button 
                onClick={toggleScreenShare}
                className={cn(
                  "h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all border",
                  isScreenSharing ? "bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
                title="Share Screen"
              >
                <Monitor className="h-6 w-6" />
              </button>
              <button className="h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                <Settings className="h-6 w-6" />
              </button>
           </div>

           <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-6">
              {!isLive ? (
                <button 
                  onClick={() => {
                    setIsLive(true);
                    toast.success("TRANSMISSION DEPLOYED", {
                      description: "You are now broadcasting to the grid."
                    });
                  }}
                  className="flex-1 lg:flex-none min-w-[180px] px-4 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 bg-neon-cyan text-black rounded-xl lg:rounded-[1.5rem] font-black uppercase tracking-[0.12em] lg:tracking-[0.2em] text-[10px] sm:text-xs lg:text-sm shadow-[0_0_30px_rgba(0,243,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                >
                  START STREAMING
                </button>
              ) : (
                <button 
                  onClick={() => setIsLive(false)}
                  className="flex-1 lg:flex-none min-w-[180px] px-4 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 bg-neon-pink text-white rounded-xl lg:rounded-[1.5rem] font-black uppercase tracking-[0.12em] lg:tracking-[0.2em] text-[10px] sm:text-xs lg:text-sm shadow-[0_0_30px_rgba(255,0,85,0.3)] hover:scale-105 active:scale-95 transition-all"
                >
                  END SESSION
                </button>
              )}
              
              {isLive && (
                <button 
                  onClick={() => setShowBetCreator(true)}
                  className="flex-1 lg:flex-none min-w-[180px] px-4 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 bg-neon-purple text-white rounded-xl lg:rounded-[1.5rem] font-black uppercase tracking-[0.12em] lg:tracking-[0.2em] text-[10px] sm:text-xs lg:text-sm shadow-[0_0_30px_rgba(112,0,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 lg:gap-3"
                >
                  <TrendingUp className="h-5 w-5" />
                  CREATE BET
                </button>
              )}
           </div>

           <div className="self-end lg:self-auto flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => navigate('/live')}
                className="h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <X className="h-6 w-6" />
              </button>
           </div>
        </div>
      </div>

      {/* Sidebar - Chat & Stats */}
      <div className="w-full lg:w-[420px] xl:w-[450px] lg:h-full h-[42vh] min-h-[320px] sm:min-h-[360px] lg:min-h-0 bg-void border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col min-h-0">
        {/* Header */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-white/5 flex items-center justify-between">
           <div className="space-y-1">
              <h2 className="text-base sm:text-lg lg:text-xl font-black text-white italic tracking-tighter uppercase leading-none">OPERATIVE CHAT</h2>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">REAL-TIME GRID COMMS</p>
           </div>
           <div className="flex items-center gap-2 bg-white/5 px-3 sm:px-4 py-2 rounded-xl border border-white/5">
              <Users className="h-4 w-4 text-neon-cyan" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{isLive ? '1.2K' : '--- '}</span>
           </div>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 no-scrollbar">
           {comments.map((c, i) => (
             <div key={i} className="flex flex-col space-y-1 group">
                <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", c.color)}>{c.user}</span>
                <p className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-tight">{c.text}</p>
             </div>
           ))}
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6 lg:p-8 border-t border-white/5 bg-zinc-950/30">
           <form onSubmit={handlePostComment} className="relative">
              <input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="SEND GRID MESSAGE..."
                className="w-full bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl py-3 sm:py-4 lg:py-5 px-4 sm:px-6 pr-14 sm:pr-16 text-[10px] font-black text-white tracking-widest focus:border-neon-cyan/30 outline-none uppercase transition-all"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-neon-cyan hover:bg-neon-cyan/10 transition-all">
                <Send className="h-5 w-5" />
              </button>
           </form>
           <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <button className="text-zinc-600 hover:text-neon-pink transition-colors"><Heart className="h-5 w-5" /></button>
                 <button className="text-zinc-600 hover:text-neon-purple transition-colors"><Zap className="h-5 w-5" /></button>
              </div>
              <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest italic">ENCRYPTED END-TO-END</span>
           </div>
        </div>
      </div>

      {/* Bet Creation Modal Overlay */}
      <AnimatePresence>
        {showBetCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-3xl bg-black/60">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="w-full max-w-xl bg-void rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] border border-white/10 p-4 sm:p-8 lg:p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col space-y-6 sm:space-y-8 lg:space-y-10 max-h-[92vh] overflow-y-auto"
             >
                <div className="flex justify-between items-start">
                   <div className="space-y-2">
                       <div className="inline-flex items-center gap-3 px-3 py-1 bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-[8px] font-black uppercase tracking-widest rounded-lg">
                          <TrendingUp className="h-3 w-3" />
                          Deployment Terminal
                       </div>
                       <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase italic tracking-tighter">NEW CLASSIFIED MARKET</h2>
                   </div>
                   <button onClick={() => setShowBetCreator(false)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                      <X className="h-6 w-6 text-zinc-500" />
                   </button>
                </div>

                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2">MISSION OBJECTIVE (QUESTION)</label>
                      <textarea 
                        value={betQuestion}
                        onChange={(e) => setBetQuestion(e.target.value)}
                        placeholder="E.G., WILL THE BTC WHALE SELL WITHIN 5 MINUTES?"
                        className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] p-6 text-sm font-black text-white tracking-widest focus:border-neon-cyan/30 outline-none uppercase min-h-[120px] transition-all"
                      />
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="p-6 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10 space-y-4">
                         <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">POSITION ALPHA</div>
                         <div className="text-xl font-black text-white uppercase italic tracking-tighter tracking-widest">YES</div>
                      </div>
                      <div className="p-6 rounded-[1.5rem] bg-neon-pink/5 border border-neon-pink/10 space-y-4">
                         <div className="text-[8px] font-black text-neon-pink uppercase tracking-widest">POSITION OMEGA</div>
                         <div className="text-xl font-black text-white uppercase italic tracking-tighter tracking-widest">NO</div>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                   <button 
                     onClick={() => setShowBetCreator(false)}
                     className="flex-1 py-5 rounded-2xl border border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:bg-white/5 transition-all"
                   >
                     CANCEL MISSION
                   </button>
                   <button 
                     onClick={handleCreateBet}
                     className="flex-1 py-5 rounded-2xl bg-neon-cyan text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(0,243,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     DEPLOY MARKET
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default StreamSession;
