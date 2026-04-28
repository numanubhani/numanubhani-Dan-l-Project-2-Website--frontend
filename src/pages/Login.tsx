import React, { useState } from 'react';
import {
  Zap,
  Github,
  Mail,
  Lock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'signup') {
        if (step === 1) {
          if (formData.password !== formData.password2) {
            toast.error("Passwords do not match");
            setLoading(false);
            return;
          }
          await register(formData);
          setStep(2);
        }
      } else {
        await login(formData.username || formData.email, formData.password);
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-void font-sans text-white overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-purple-vpulse/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-cyan-vpulse/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Hero Side - Desktop Only */}
      <div className="hidden lg:flex flex-1 flex-col justify-center p-20 relative z-10 border-r border-white/5 bg-void/50 backdrop-blur-3xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-vpulse to-cyan-vpulse flex items-center justify-center p-3 shadow-2xl">
            <Zap className="h-full w-full text-white fill-white" />
          </div>
          <span className="text-5xl font-black tracking-tighter">VPULSE</span>
        </div>
        <h1 className="text-7xl font-black uppercase tracking-tighter leading-[0.8] mb-8">
          The World is <br />
          <span className="text-cyan-vpulse">Tradable.</span>
        </h1>
        <div className="space-y-8 max-w-lg">
          <div className="flex gap-4">
            <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-vpulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Prediction Markets</h3>
              <p className="text-zinc-500 font-medium tracking-tight">Trade on news, sports, and tech events in real-time with zero friction.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-cyan-vpulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Creator Central</h3>
              <p className="text-zinc-500 font-medium tracking-tight">Direct-to-fan monetization via content bets and unified gift shops.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Side */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <Zap className="h-10 w-10 text-cyan-vpulse fill-cyan-vpulse" />
              <span className="text-2xl font-black tracking-tighter uppercase">VPULSE</span>
            </Link>
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-zinc-500 font-medium">Join 50k+ creators and traders on the edge.</p>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'signup' && step === 2 ? (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">What are you into?</h3>
                  <p className="text-sm text-zinc-500">Pick at least 3 to personalize your feed.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Crypto', 'Gaming', 'Tech', 'Politics', 'Sports', 'AI', 'Music', 'Travel', 'Fashion', 'News'].map(tag => (
                    <button key={tag} className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold hover:border-cyan-vpulse hover:bg-cyan-vpulse/10 transition-all">
                      {tag}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
                >
                  Complete Setup
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <form onSubmit={handleAuth} className="space-y-4">
                  {mode === 'signup' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Username</label>
                        <div className="relative group">
                          <Github className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-cyan-vpulse transition-colors" />
                          <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="username123" className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-sm outline-none focus:border-cyan-vpulse transition-all font-medium text-white" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                        <div className="relative group">
                          <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-cyan-vpulse transition-colors" />
                          <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-sm outline-none focus:border-cyan-vpulse transition-all font-medium text-white" />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">
                      {mode === 'login' ? 'Username or Email' : 'Email Address'}
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-cyan-vpulse transition-colors" />
                        <input type={mode === 'login' ? 'text' : 'email'} name={mode === 'login' ? 'username' : 'email'} value={mode === 'login' ? formData.username : formData.email} onChange={handleChange} required placeholder={mode === 'login' ? "username or name@vpulse.pro" : "name@vpulse.pro"} className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-sm outline-none focus:border-cyan-vpulse transition-all font-medium text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-cyan-vpulse transition-colors" />
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-sm outline-none focus:border-cyan-vpulse transition-all font-medium text-white" />
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Confirm Password</label>
                      <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-cyan-vpulse transition-colors" />
                          <input type="password" name="password2" value={formData.password2} onChange={handleChange} required placeholder="••••••••" className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-sm outline-none focus:border-cyan-vpulse transition-all font-medium text-white" />
                      </div>
                    </div>
                  )}

                  <button disabled={loading} className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Continue')}
                    {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </button>
                </form>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-xs font-black uppercase tracking-widest bg-void px-4 text-zinc-600">Or continue with</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold text-sm">
                    <Github className="h-5 w-5" />
                    Github
                  </button>
                  <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold text-sm">
                    <Zap className="h-5 w-5 text-cyan-vpulse fill-cyan-vpulse" />
                    Flash
                  </button>
                </div>

                <p className="text-center text-sm font-medium text-zinc-500">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-cyan-vpulse font-black hover:underline"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-[10px] font-medium text-zinc-700 max-w-xs mx-auto">
            By continuing, you agree to our <span className="hover:text-zinc-500 cursor-pointer">Terms of Service</span> and <span className="hover:text-zinc-500 cursor-pointer">Privacy Policy</span>. Betting carries risk.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
