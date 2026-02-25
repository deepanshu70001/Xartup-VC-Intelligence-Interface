import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] hover:-translate-y-0.5 surface-pop",
          {
            'bg-neutral-900 text-white hover:bg-neutral-800 border-t border-neutral-700 shadow-md shadow-neutral-900/20 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 dark:border-t-white': variant === 'primary',
            'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md text-neutral-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-sm': variant === 'secondary',
            'bg-transparent border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 backdrop-blur-sm': variant === 'outline',
            'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white backdrop-blur-sm': variant === 'ghost',
            'bg-red-600/90 text-white hover:bg-red-700 border-t border-red-500 shadow-md shadow-red-900/20 dark:bg-red-600 dark:text-white dark:hover:bg-red-700': variant === 'danger',

            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export function Badge({ children, className, variant = 'neutral' }: { children: React.ReactNode, className?: string, variant?: 'neutral' | 'success' | 'warning' | 'indigo' } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-transform duration-200 hover:scale-[1.03]",
      {
        'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700': variant === 'neutral',
        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-sm shadow-emerald-900/5 backdrop-blur-sm': variant === 'success',
        'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-sm shadow-amber-900/5 backdrop-blur-sm': variant === 'warning',
        'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-sm shadow-indigo-900/5 backdrop-blur-sm': variant === 'indigo',
      },
      className
    )}>
      {children}
    </span>
  );
}
