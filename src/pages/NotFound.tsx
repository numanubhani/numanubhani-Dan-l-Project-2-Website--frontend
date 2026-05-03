import { Link, useLocation } from 'react-router-dom';
import { Glitchy404 } from '../components/common/Glitchy404';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <div className="w-full max-w-[calc(100vw-2rem)] overflow-x-auto flex justify-center">
        <Glitchy404 width={860} height={232} color="#00f3ff" />
      </div>
      <div className="max-w-md space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
          Transmission lost · 404
        </p>
        <p className="font-mono text-xs text-zinc-600 break-all">
          {location.pathname}
        </p>
      </div>
      <Link
        to="/"
        className="rounded-2xl border border-neon-cyan/40 bg-neon-cyan/10 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan shadow-[0_0_24px_rgba(0,243,255,0.15)] transition-all hover:bg-neon-cyan/20 active:scale-95"
      >
        Return home
      </Link>
    </div>
  );
}
