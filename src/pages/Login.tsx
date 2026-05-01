import React, { useState } from 'react';
import { Zap, Eye, EyeOff, ArrowRight, User, UserRound, Mail, Lock, Clapperboard } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import DotMap from '../components/auth/DotMap';

type ClassValue = Parameters<typeof clsx>[number];
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
  }
>(({ className, variant = 'default', size = 'default', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/40 disabled:pointer-events-none disabled:opacity-50',
      size === 'default' && 'h-10 px-4 py-2',
      size === 'sm' && 'h-9 px-3',
      size === 'lg' && 'h-11 px-8',
      variant === 'default' &&
        'bg-neon-cyan text-black hover:brightness-110 font-black uppercase tracking-widest text-xs',
      variant === 'outline' && 'border border-white/10 bg-transparent',
      variant === 'ghost' && 'bg-transparent',
      className
    )}
    {...props}
  />
));
Button.displayName = 'Button';

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-lg border px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-neon-cyan/50 disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

type RoleChoice = 'VIEWER' | 'CREATOR';

const LoginPage = ({ defaultMode = 'login' }: { defaultMode?: 'login' | 'signup' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [hoverSubmit, setHoverSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    password2: '',
    role: 'VIEWER' as RoleChoice,
  });

  const [loginUsernameOrEmail, setLoginUsernameOrEmail] = useState('');

  const update = (key: keyof typeof form, value: string | RoleChoice) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formError) setFormError(null); // clear error on any change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (form.password !== form.password2) {
          setFormError('Passwords do not match. Please re-enter them.');
          return;
        }
        const signupBody: Record<string, string> = {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          password2: form.password2,
          role: form.role,
        };
        const n = form.name.trim();
        if (n) signupBody.name = n;
        await register(signupBody);
        navigate('/');
        return;
      }
      await login(loginUsernameOrEmail.trim(), form.password);
      navigate('/');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setFormError(msg);   // show inline in the form
      toast.error(msg);    // also show toast
    } finally {
      setLoading(false);
    }
  };

  const toggleGoogle = () => toast.message('Social login is not enabled yet.', { description: 'Use email and password for now.' });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-void via-zinc-950 to-void p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#090b13] font-sans text-white shadow-2xl"
      >
        {/* Left */}
        <div className="relative hidden h-[min(620px,90vh)] w-1/2 overflow-hidden border-r border-white/[0.08] md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1120] to-[#151929]">
            <DotMap />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.45 }}
                className="mb-5"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-[#22d3ee] shadow-xl shadow-purple-900/40">
                  <Zap className="size-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,.5)] fill-white/90" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.45 }}
                className="mb-2 text-center font-display text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-[#22d3ee] to-purple-300"
              >
                VPULSE
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.45 }}
                className="max-w-xs text-center text-sm leading-relaxed text-gray-400"
              >
                Sign in or create an account. Creators publish reels and live streams; traders follow markets on your channel.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex max-h-[min(90vh,900px)] w-full flex-col justify-center overflow-y-auto px-8 py-10 md:w-1/2 md:px-10">
          <div className="mb-8 md:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-neon-cyan">
              <Zap className="size-8 text-neon-cyan fill-neon-cyan/30" />
              <span className="font-display text-xl font-black uppercase tracking-tighter">VPULSE</span>
            </Link>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="mb-1 font-display text-2xl font-bold md:text-3xl">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
            <p className="mb-8 text-sm text-gray-400">
              {mode === 'login' ? 'Sign in with username or email' : 'Match the fields saved in our database (username, email, password).'}
            </p>

            <button
              type="button"
              onClick={toggleGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2d3a] bg-[#13151f] p-3 text-sm transition-all hover:bg-[#1a1d2b]"
            >
              <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fillOpacity=".54"
                />
                <path
                  fill="#4285F4"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#34A853"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a2d3a]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#090b13] px-3 text-gray-500">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-300">
                      Username <span className="text-neon-cyan">*</span>
                    </label>
                    <Input
                      id="username"
                      name="username"
                      required
                      minLength={3}
                      pattern="^[a-zA-Z0-9_-]{3,}$"
                      title="Letters, numbers, hyphens and underscores only. At least 3 characters."
                      value={form.username}
                      onChange={(e) => update('username', e.target.value)}
                      placeholder="unique_handle"
                      className="border-[#2a2d3a] bg-[#13151f]"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">Stored as `users.username` — letters, digits, hyphen, underscore.</p>
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">
                      Email <span className="text-neon-cyan">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="you@vpulse.app"
                      className="border-[#2a2d3a] bg-[#13151f]"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-300">
                      Display name <span className="text-gray-500">(optional)</span>
                    </label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 opacity-70" aria-hidden />
                      <Input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        placeholder="How we show your name"
                        className="border-[#2a2d3a] bg-[#13151f] pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="role" className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Clapperboard className="size-4 text-neon-cyan" /> Account role
                    </label>
                    <select
                      id="role"
                      value={form.role}
                      onChange={(e) => update('role', e.target.value as RoleChoice)}
                      className={cn(
                        'h-10 w-full rounded-lg border border-[#2a2d3a] bg-[#13151f] px-3 text-sm text-white outline-none focus:ring-1 focus:ring-neon-cyan/50'
                      )}
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="CREATOR">Creator</option>
                    </select>
                    <p className="mt-1 text-[11px] text-gray-500">Maps to `users.role` (VIEWER · CREATOR). Admin is assignable in Django only.</p>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div>
                  <label htmlFor="loginId" className="mb-1 block text-sm font-medium text-gray-300">
                    Username or email <span className="text-neon-cyan">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 opacity-70" aria-hidden />
                    <Input
                      id="loginId"
                      name="loginUsernameOrEmail"
                      autoComplete="username"
                      required
                      value={loginUsernameOrEmail}
                      onChange={(e) => setLoginUsernameOrEmail(e.target.value)}
                      placeholder="username or email"
                      className="border-[#2a2d3a] bg-[#13151f] pl-10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-300">
                  Password <span className="text-neon-cyan">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 opacity-70" aria-hidden />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder={mode === 'signup' ? 'Min 8 chars, mix letters & numbers' : '••••••••'}
                    className="border-[#2a2d3a] bg-[#13151f] pl-10 pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Must be at least 8 characters · Not too simple or common · Can't be similar to your username
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="password2" className="mb-1 block text-sm font-medium text-gray-300">
                    Confirm password <span className="text-neon-cyan">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 opacity-70" aria-hidden />
                    <Input
                      id="password2"
                      name="password2"
                      type={showPassword2 ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={form.password2}
                      onChange={(e) => update('password2', e.target.value)}
                      placeholder="Re-enter password"
                      className="border-[#2a2d3a] bg-[#13151f] pl-10 pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword2 ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword2(!showPassword2)}
                    >
                      {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Inline error banner ─────────────────────────────── */}
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <span className="mt-0.5 shrink-0 text-base leading-none">⚠</span>
                  <span>{formError}</span>
                </div>
              )}

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onHoverStart={() => setHoverSubmit(true)}
                onHoverEnd={() => setHoverSubmit(false)}
                className="pt-2"
              >
                <Button
                  type="submit"
                  variant="ghost"
                  disabled={loading}
                  className={cn(
                    'relative w-full overflow-hidden rounded-lg border-0 bg-gradient-to-r py-6 font-black uppercase tracking-widest text-black from-purple-600 to-[#06b6d4] hover:from-purple-500 hover:to-cyan-500',
                    hoverSubmit ? 'shadow-lg shadow-cyan-500/25' : ''
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    <User className="size-4 opacity-70" aria-hidden />
                    {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                    {!loading && <ArrowRight className="size-4" />}
                  </span>
                  {hoverSubmit && !loading && (
                    <motion.span
                      initial={{ left: '-100%' }}
                      animate={{ left: '100%' }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                      className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                      style={{ filter: 'blur(8px)' }}
                    />
                  )}
                </Button>
              </motion.div>

              {mode === 'login' && (
                <div className="text-center">
                  <a href="#" className="text-xs text-[#06b6d4] hover:text-[#67e8f9]" onClick={(e) => e.preventDefault()}>
                    Forgot password?
                  </a>
                  <span className="mx-2 text-[10px] text-gray-600">(reset via Django admin for now)</span>
                </div>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setShowPassword(false);
                  setShowPassword2(false);
                  navigate(mode === 'login' ? '/signup' : '/login');
                }}
                className="font-bold text-[#67e8f9] underline-offset-4 hover:text-neon-cyan hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <p className="mt-8 text-center text-[10px] leading-relaxed text-gray-600">
              By continuing you agree to our Terms and Privacy Policy. Gambling-style features carry financial risk — play responsibly.
            </p>

            <p className="mt-4 text-center text-[10px] text-gray-700">
              <Link to="/" className="text-gray-400 hover:text-white">
                ← Back to home
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
