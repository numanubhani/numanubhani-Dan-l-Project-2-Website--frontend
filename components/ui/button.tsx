import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors shrink-0',
          'disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' &&
            'bg-neon-pink text-white hover:brightness-110 border border-transparent',
          variant === 'outline' &&
            'border border-white/20 bg-transparent hover:bg-white/10 text-white',
          variant === 'ghost' && 'border-0 bg-transparent hover:bg-white/10 text-zinc-200',
          size === 'sm' && 'h-8 px-2.5 text-xs',
          size === 'md' && 'h-9 px-3 text-sm',
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
