import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ComponentType,
} from 'react';
import { motion } from 'motion/react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'error' | 'warning';
type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface ToasterProps {
  title?: string;
  message: string;
  variant?: Variant;
  duration?: number;
  position?: Position;
  actions?: ActionButton;
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

export interface ToasterRef {
  show: (props: ToasterProps) => void;
}

/** Global bridge so callers can trigger custom toasts without a ref. */
export const toasterBridge: { api: ToasterRef | null } = { api: null };

export function showAppToast(props: ToasterProps) {
  toasterBridge.api?.show(props);
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-zinc-900 border-white/15 text-white',
  success: 'bg-zinc-900 border-green-600/45 text-white',
  error: 'bg-zinc-900 border-rose-600/55 text-white',
  warning: 'bg-zinc-900 border-amber-600/50 text-white',
};

const titleColor: Record<Variant, string> = {
  default: 'text-white',
  success: 'text-green-400',
  error: 'text-rose-400',
  warning: 'text-amber-400',
};

const iconColor: Record<Variant, string> = {
  default: 'text-zinc-400',
  success: 'text-green-400',
  error: 'text-rose-400',
  warning: 'text-amber-400',
};

const variantIcons: Record<Variant, ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const CustomAppToaster = forwardRef<
  ToasterRef,
  { defaultPosition?: Position }
>(({ defaultPosition = 'top-right' }, ref) => {
  const [toastTheme, setToastTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark',
  );

  useEffect(() => {
    const sync = () => {
      const t =
        document.documentElement.getAttribute('data-theme') === 'light'
          ? 'light'
          : 'dark';
      setToastTheme(t);
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  const api = useMemo<ToasterRef>(
    () => ({
      show({
        title,
        message,
        variant = 'default',
        duration = 4000,
        actions,
        onDismiss,
        highlightTitle,
      }) {
        const Icon = variantIcons[variant];

        sonnerToast.custom(
          (toastId) => (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                'flex items-center justify-between w-full max-w-xs p-3 rounded-xl border shadow-lg',
                variantStyles[variant],
              )}
            >
              <div className="flex items-start gap-2 min-w-0">
                <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', iconColor[variant])} />
                <div className="space-y-0.5 min-w-0">
                  {title ? (
                    <h3
                      className={cn(
                        'text-xs font-semibold leading-none truncate',
                        titleColor[variant],
                        highlightTitle && 'text-green-400',
                      )}
                    >
                      {title}
                    </h3>
                  ) : null}
                  <p className="text-xs text-zinc-400">{message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {actions?.label ? (
                  <Button
                    variant={actions.variant ?? 'outline'}
                    size="sm"
                    type="button"
                    onClick={() => {
                      actions.onClick();
                      sonnerToast.dismiss(toastId);
                    }}
                    className={cn(
                      'cursor-pointer',
                      variant === 'success' &&
                        'text-green-400 border-green-600 hover:bg-green-600/15',
                      variant === 'error' &&
                        'text-rose-400 border-rose-500 hover:bg-rose-500/15',
                      variant === 'warning' &&
                        'text-amber-400 border-amber-600 hover:bg-amber-600/15',
                      variant === 'default' && 'text-white border-white/25 hover:bg-white/10',
                    )}
                  >
                    {actions.label}
                  </Button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    sonnerToast.dismiss(toastId);
                    onDismiss?.();
                  }}
                  className="rounded-full p-1 hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-neon-pink/40"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3 w-3 text-zinc-500" />
                </button>
              </div>
            </motion.div>
          ),
          { duration },
        );
      },
    }),
    [],
  );

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    toasterBridge.api = api;
    return () => {
      toasterBridge.api = null;
    };
  }, [api]);

  return (
    <SonnerToaster
      theme={toastTheme}
      position={defaultPosition}
      toastOptions={{
        className:
          '!bg-transparent !shadow-none !border-0 [&_li]:!bg-transparent [&_li]:!border-none',
      }}
      offset={16}
      gap={8}
    />
  );
});

CustomAppToaster.displayName = 'CustomAppToaster';

export default CustomAppToaster;
