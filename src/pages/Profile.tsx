import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Grid, 
  Play, 
  ShoppingBag, 
  TrendingUp, 
  MoreVertical,
  Settings,
  Edit2,
  Users,
  Plus,
  Heart,
  Trash2,
} from 'lucide-react';
import { VideoCard } from '../components/common/VideoCard';
import { MarketCard } from '../components/common/MarketCard';
import { motion, AnimatePresence } from 'motion/react';
import { api, fixUrl } from '../services/api';
import { fetchMarkets, voteMarket } from '../services/predictionMarkets';
import type { Market } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import LivePlayerChat from '../components/live/LivePlayerChat';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

function fmtCount(raw: unknown): string {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return '0';
  return n.toLocaleString();
}

function fmtBalance(raw: unknown): string {
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  const v = Number.isFinite(n) ? n : 0;
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const Profile = () => {
  const { id, section, username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, refreshProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'videos' | 'reels' | 'markets' | 'stores'>('videos');
  const [profileData, setProfileData] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [userReels, setUserReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [openVideoMenuId, setOpenVideoMenuId] = useState<string | null>(null);
  const [openReelMenuId, setOpenReelMenuId] = useState<string | null>(null);
  const [deletingReelId, setDeletingReelId] = useState<string | null>(null);
  const [reelToDeleteId, setReelToDeleteId] = useState<string | null>(null);
  const [videoToDeleteId, setVideoToDeleteId] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const [savingVideoEdit, setSavingVideoEdit] = useState(false);
  const [liveStream, setLiveStream] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [profileMarkets, setProfileMarkets] = useState<Market[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // If no ID is provided, assume it's the current user's profile
  const targetId = resolvedUserId || id || currentUser?.id;
  const isOwnProfile = currentUser && currentUser.id === targetId;
  const validSections = new Set(['videos', 'reels', 'markets', 'stores']);

  useEffect(() => {
    const resolveUsernameToId = async () => {
      if (!username) {
        setResolvedUserId(null);
        return;
      }
      try {
        const response = await api.get(`/profile/username/${username}/`);
        setResolvedUserId(response.data.id);
      } catch (error) {
        setResolvedUserId(null);
      }
    };
    resolveUsernameToId();
  }, [username]);

  useEffect(() => {
    const normalizedSection = section?.toLowerCase();
    if (!normalizedSection) {
      setActiveTab('videos');
      return;
    }
    if (validSections.has(normalizedSection)) {
      setActiveTab(normalizedSection as 'videos' | 'reels' | 'markets' | 'stores');
      return;
    }
    const basePath = username ? `/channel/${username}` : id ? `/profile/user/${id}` : '/profile';
    navigate(`${basePath}/videos`, { replace: true });
  }, [section, id, username, navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetId) return;
      
      try {
        setLoading(true);
        // Fetch user profile
        if (isOwnProfile) {
          const profileRes = await api.get('/profile/me/');
          setProfileData(profileRes.data);
        } else {
          const profileRes = await api.get(`/profile/${targetId}/`);
          setProfileData(profileRes.data);
        }

        // Fetch videos and reels
        const videosRes = await api.get(`/videos/user/${targetId}/?type=videos`);
        setUserVideos(videosRes.data);
        
        const reelsRes = await api.get(`/videos/user/${targetId}/?type=reels`);
        setUserReels(reelsRes.data);
        
      } catch (error) {
        console.error("Failed to load profile data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetId, isOwnProfile]);

  useEffect(() => {
    if (activeTab !== 'markets' || !targetId) return;
    let cancelled = false;
    setMarketsLoading(true);
    fetchMarkets({ creator: targetId })
      .then((list) => {
        if (!cancelled) setProfileMarkets(list);
      })
      .catch(() => {
        if (!cancelled) setProfileMarkets([]);
      })
      .finally(() => {
        if (!cancelled) setMarketsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, targetId]);

  useEffect(() => {
    const fetchChannelStream = async () => {
      if (!profileData?.username) return;
      try {
        setLiveLoading(true);
        const response = await api.get(`/channels/${profileData.username}/stream/`);
        setLiveStream(response.data);
      } catch (error) {
        console.error('Failed to load live stream status', error);
      } finally {
        setLiveLoading(false);
      }
    };
    fetchChannelStream();
    const timer = setInterval(fetchChannelStream, 5000);
    return () => clearInterval(timer);
  }, [profileData?.username]);

  if (loading) {
     return <div className="min-h-screen bg-void flex items-center justify-center"><div className="h-8 w-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!profileData) {
     return <div className="min-h-screen bg-void flex items-center justify-center text-white">User not found.</div>;
  }

  const stats = [
    { label: 'Subscribers', value: fmtCount(profileData.followers_count), icon: Users },
    { label: 'Following', value: fmtCount(profileData.following_count), icon: Users },
    { label: 'Pulse Balance', value: fmtBalance(profileData.balance), icon: TrendingUp },
  ];

  const registerProfileMarketVote = async (marketId: string, side: 'yes' | 'no') => {
    try {
      const updated = await voteMarket(marketId, side);
      setProfileMarkets((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (e: unknown) {
      const st = (e as { response?: { status?: number } }).response?.status;
      if (st === 400) {
        if (targetId) {
          try {
            const list = await fetchMarkets({ creator: targetId });
            setProfileMarkets(list);
          } catch {
            /* ignore */
          }
        }
        toast.message('Already voted', {
          description: 'Each account gets one vote per market.',
        });
        return;
      }
      toast.error('Sign in to vote', { description: 'Log in to record your vote.' });
    }
  };

  const handleAvatarPick = () => {
    if (!isOwnProfile || uploadingAvatar) return;
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.patch('/profile/update/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfileData(response.data);
      await refreshProfile();
      toast.success('Profile image updated.');
    } catch (error) {
      console.error('Failed to upload avatar', error);
      toast.error('Failed to upload profile image.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleDeleteReel = async (reelId: string) => {
    try {
      setDeletingReelId(reelId);
      await api.delete(`/videos/${reelId}/`);
      setUserReels((prev) => prev.filter((item) => item.id !== reelId));
      toast.success('Reel deleted successfully.');
    } catch (error) {
      console.error('Failed to delete reel', error);
      toast.error('Failed to delete reel.');
    } finally {
      setDeletingReelId(null);
      setOpenReelMenuId(null);
      setReelToDeleteId(null);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      setDeletingVideoId(videoId);
      await api.delete(`/videos/${videoId}/`);
      setUserVideos((prev) => prev.filter((item) => item.id !== videoId));
      toast.success('Video deleted successfully.');
    } catch (error) {
      console.error('Failed to delete video', error);
      toast.error('Failed to delete video.');
    } finally {
      setDeletingVideoId(null);
      setVideoToDeleteId(null);
      setOpenVideoMenuId(null);
    }
  };

  const openVideoEditor = (video: any) => {
    setEditingVideo(video);
    setEditTitle(video?.title || '');
    setEditDescription(video?.description || '');
    setEditThumbnailFile(null);
    setEditThumbnailPreview(video?.thumbnail_url || video?.thumbnail || null);
  };

  const closeVideoEditor = () => {
    if (savingVideoEdit) return;
    setEditingVideo(null);
    setEditTitle('');
    setEditDescription('');
    setEditThumbnailFile(null);
    setEditThumbnailPreview(null);
  };

  const handleEditThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    setEditThumbnailFile(file);
    setEditThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSaveVideoEdit = async () => {
    if (!editingVideo?.id) return;
    if (!editTitle.trim()) {
      toast.error('Title is required.');
      return;
    }

    try {
      setSavingVideoEdit(true);
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('description', editDescription);
      if (editThumbnailFile) {
        formData.append('thumbnail', editThumbnailFile);
      }

      const response = await api.patch(`/videos/${editingVideo.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUserVideos((prev) => prev.map((item) => (item.id === editingVideo.id ? response.data : item)));
      toast.success('Video updated successfully.');
      closeVideoEditor();
    } catch (error: any) {
      console.error('Failed to update video', error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        'Failed to update video.';
      toast.error(message);
    } finally {
      setSavingVideoEdit(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!targetId || isOwnProfile) return;
    if (!currentUser) {
      toast.message('Sign in to subscribe.');
      navigate('/login');
      return;
    }
    try {
      setFollowLoading(true);
      const res = await api.post<{ message: string; is_following: boolean }>(
        `/follow/${targetId}/`
      );

      const profileRes = await api.get(`/profile/${targetId}/`);
      setProfileData(profileRes.data);

      await refreshProfile();
      toast.success(res.data.is_following ? 'Subscribed' : 'Unsubscribed');
    } catch {
      toast.error('Could not update subscription.');
    } finally {
      setFollowLoading(false);
    }
  };

  const isSubscribedToThisChannel = Boolean(profileData?.is_following);

  return (
    <div className="min-h-screen">
      {/* Header / Banner Area */}
      <div className="relative h-48 w-full bg-gradient-to-r from-neon-purple/20 via-neon-cyan/20 to-neon-pink/20 lg:h-80 overflow-hidden">
         <div className="absolute inset-0 bg-void/60 backdrop-blur-3xl" />
         <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-void to-transparent" />
         {/* HUD Scanlines */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
      </div>

      <div className="px-6 lg:px-16 -mt-20 lg:-mt-32 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-white/5">
          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 text-center lg:text-left">
            <div className="relative group">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="h-32 w-32 lg:h-48 lg:w-48 overflow-hidden rounded-[2.5rem] border-4 border-void shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-zinc-900 ring-1 ring-white/10 group-hover:border-neon-cyan transition-all duration-500">
                <img src={fixUrl(profileData.avatar_url || `https://ui-avatars.com/api/?name=${profileData.username}&background=random`)} alt="Avatar" className="h-full w-full object-cover transition-transform group-hover:scale-110 opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
              </div>
              {isOwnProfile && (
                <button
                  onClick={handleAvatarPick}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-2 -right-2 rounded-xl bg-neon-cyan p-3 text-black shadow-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase italic leading-none">{profileData.username}</h1>
                <div className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/20 px-3 py-1 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-neon-cyan animate-pulse" />
                  <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">VERIFIED-X</span>
                </div>
              </div>
              <p className="text-zinc-500 font-bold max-w-sm text-xs md:text-sm uppercase tracking-tight leading-relaxed">{profileData.bio || "No bio available."}</p>
              
              <div className="flex justify-center lg:justify-start gap-8 pt-2">
                 {stats.map((stat, i) => (
                   <div key={i} className="flex flex-col items-center lg:items-start">
                      <span className="text-xl font-black text-white italic tracking-tighter">{stat.value}</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">{stat.label}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 lg:gap-4">
            {isOwnProfile ? (
              <>
                 <Link to="/studio" className="flex items-center gap-3 rounded-2xl bg-neon-cyan px-6 lg:px-8 py-3 lg:py-4 text-[10px] font-black text-black transition-all hover:brightness-110 active:scale-95 uppercase tracking-widest shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                   <Plus className="h-4 w-4" />
                   CREATOR STUDIO
                 </Link>
                 <button className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-5 lg:px-6 py-3 lg:py-4 text-[10px] font-black text-white hover:bg-white/10 active:scale-95 uppercase tracking-widest transition-all">
                   <Edit2 className="h-4 w-4" />
                   SYSTEM CONFIG
                 </button>
                 <div className="flex gap-3">
                   <button className="rounded-2xl bg-white/5 p-3 lg:p-4 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-white">
                     <Settings className="h-5 w-5" />
                   </button>
                 </div>
              </>
            ) : (
              <button
                type="button"
                disabled={followLoading || !targetId}
                onClick={() => void handleFollowToggle()}
                className={`flex items-center gap-3 rounded-2xl px-6 lg:px-8 py-3 lg:py-4 text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed ${
                  isSubscribedToThisChannel
                    ? 'border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10'
                    : 'bg-neon-cyan text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                }`}
              >
                {followLoading ? '…' : isSubscribedToThisChannel ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Tabs */}
        <div className="profile-tabs sticky top-20 z-30 flex gap-10 border-b border-white/5 bg-void/80 backdrop-blur-xl mt-6 px-4 no-scrollbar overflow-x-auto">
           {[ 
             { id: 'videos', label: 'Videos', icon: Grid, count: userVideos.length },
             { id: 'reels', label: 'Reels', icon: Play, count: userReels.length },
             { id: 'markets', label: 'Markets', icon: TrendingUp },
             { id: 'stores', label: 'Store', icon: ShoppingBag }
           ].map((tab) => {
             const isActive = activeTab === tab.id;
             return (
               <button 
                 key={tab.id}
                 onClick={() => {
                  const basePath = username ? `/channel/${username}` : id ? `/profile/user/${id}` : '/profile';
                   navigate(`${basePath}/${tab.id}`);
                 }}
                 className={`flex items-center gap-3 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${
                   isActive ? "text-neon-cyan" : "text-zinc-500 hover:text-white"
                 }`}
               >
                 <tab.icon className={cn("h-4 w-4", isActive && "text-neon-cyan")} />
                 {tab.label}
                 {tab.count !== undefined && <span className="text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">{tab.count}</span>}
                 {isActive && (
                   <motion.div 
                     layoutId="profileTab" 
                     className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.5)]" 
                   />
                 )}
               </button>
             )
           })}
        </div>

        <div className="py-8">
          {!liveLoading && liveStream?.is_live && (
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Live</span>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">{liveStream.title || `${profileData.username} is live`}</h2>
              </div>
              <LivePlayerChat
                streamKey={liveStream.stream_key}
                hlsUrl={liveStream.hls_url}
                initialViewerCount={liveStream.viewer_count || 0}
                onStreamEnded={() => setLiveStream((prev: any) => ({ ...prev, is_live: false }))}
              />
            </div>
          )}

           {activeTab === 'videos' && (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {userVideos.length > 0 ? (
                 userVideos.map(v => (
                   <div key={v.id} className="relative">
                     {isOwnProfile && (
                       <div className="absolute top-2 right-2 z-20">
                         <button
                           onClick={() => setOpenVideoMenuId((prev) => (prev === v.id ? null : v.id))}
                           className="rounded-lg bg-black/60 border border-white/20 p-1.5 text-white hover:bg-black/80 transition-all"
                           aria-label="Video menu"
                         >
                           <MoreVertical className="h-4 w-4" />
                         </button>
                         {openVideoMenuId === v.id && (
                           <div className="absolute right-0 mt-2 min-w-[160px] rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-md p-1 shadow-2xl">
                             <button
                               onClick={() => {
                                 setOpenVideoMenuId(null);
                                 openVideoEditor(v);
                               }}
                               className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-zinc-200 hover:bg-white/10 transition-all"
                             >
                               <Edit2 className="h-3.5 w-3.5" />
                               Edit video
                             </button>
                             <button
                               onClick={() => {
                                 setOpenVideoMenuId(null);
                                 setVideoToDeleteId(v.id);
                               }}
                               className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                               Delete video
                             </button>
                           </div>
                         )}
                       </div>
                     )}
                     <VideoCard video={v} hideOverflowMenu={isOwnProfile} />
                   </div>
                 ))
               ) : (
                 <div className="col-span-full py-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">No videos uploaded yet.</div>
               )}
             </div>
           )}

           {activeTab === 'reels' && (
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {userReels.length > 0 ? (
                  userReels.map(v => (
                    <div key={v.id} className="aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden border border-white/5 group relative">
                      {isOwnProfile && (
                        <div className="absolute top-2 right-2 z-20">
                          <button
                            onClick={() => setOpenReelMenuId((prev) => (prev === v.id ? null : v.id))}
                            className="rounded-lg bg-black/60 border border-white/20 p-1.5 text-white hover:bg-black/80 transition-all"
                            aria-label="Reel menu"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openReelMenuId === v.id && (
                            <div className="absolute right-0 mt-2 min-w-[140px] rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-md p-1 shadow-2xl">
                              <button
                                onClick={() => {
                                  setOpenReelMenuId(null);
                                  setReelToDeleteId(v.id);
                                }}
                                disabled={deletingReelId === v.id}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deletingReelId === v.id ? 'Deleting...' : 'Delete reel'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    <Link to={`/reel?v=${v.id}`} className="h-full w-full cursor-pointer block">
                      {v.thumbnail_url || v.thumbnail ? (
                        <img src={fixUrl(v.thumbnail_url || v.thumbnail)} alt="reel" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      ) : v.video_file_url || v.video_url ? (
                        <video
                          src={fixUrl(v.video_file_url || v.video_url)}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <div className="h-full w-full bg-zinc-900" />
                      )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 pointer-events-none">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-white">
                               <Play className="h-3 w-3 fill-white" /> {v.views}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-white">
                               <Heart className="h-3 w-3 fill-white" /> {v.likes}
                            </div>
                          </div>
                          <p className="text-[10px] text-white mt-1 font-bold line-clamp-1 truncate">{v.title}</p>
                       </div>
                    </Link>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">No reels uploaded yet.</div>
                )}
             </div>
           )}

           {activeTab === 'markets' && (
             <div className="w-full">
               {marketsLoading ? (
                 <div className="flex justify-center py-20">
                   <div className="h-8 w-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                 </div>
               ) : profileMarkets.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {profileMarkets.map((market) => (
                     <MarketCard
                       key={market.id}
                       market={market}
                       onVote={(side) => registerProfileMarketVote(market.id, side)}
                     />
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                   <TrendingUp className="h-16 w-16 text-zinc-800 mb-4" />
                   <h3 className="text-xl font-bold text-zinc-100">No markets yet</h3>
                   <p className="text-sm text-zinc-500 max-w-xs mt-2">
                     {isOwnProfile
                       ? 'Create prediction markets from the Markets page.'
                       : 'This channel has no published prediction markets.'}
                   </p>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'stores' && (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingBag className="h-16 w-16 text-zinc-800 mb-4" />
                <h3 className="text-xl font-bold text-zinc-100">Store is empty</h3>
                <p className="text-sm text-zinc-500 max-w-xs mt-2">No products listed in store.</p>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {reelToDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !deletingReelId && setReelToDeleteId(null)}
          >
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-black text-white uppercase tracking-wider">Delete Reel</h3>
              <p className="mt-2 text-sm text-zinc-400">Delete this reel permanently?</p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setReelToDeleteId(null)}
                  disabled={!!deletingReelId}
                  className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteReel(reelToDeleteId)}
                  disabled={!!deletingReelId}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-500 disabled:opacity-60"
                >
                  {deletingReelId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[125] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeVideoEditor}
          >
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-black text-white uppercase tracking-wider">Edit Video</h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-cyan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-cyan resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditThumbnailChange}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none"
                />
                {editThumbnailPreview && (
                  <div className="rounded-lg overflow-hidden border border-white/10 max-w-xs">
                    <img src={fixUrl(editThumbnailPreview)} alt="Thumbnail preview" className="w-full h-28 object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeVideoEditor}
                  disabled={savingVideoEdit}
                  className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVideoEdit}
                  disabled={savingVideoEdit}
                  className="px-4 py-2 rounded-lg bg-neon-cyan text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-60"
                >
                  {savingVideoEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoToDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[126] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !deletingVideoId && setVideoToDeleteId(null)}
          >
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-black text-white uppercase tracking-wider">Delete Video</h3>
              <p className="mt-2 text-sm text-zinc-400">Delete this video permanently?</p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setVideoToDeleteId(null)}
                  disabled={!!deletingVideoId}
                  className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteVideo(videoToDeleteId)}
                  disabled={!!deletingVideoId}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-500 disabled:opacity-60"
                >
                  {deletingVideoId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
