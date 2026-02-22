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
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] hover:-translate-y-0.5 surface-pop",
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent': variant === 'primary',
            'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700': variant === 'secondary',
            'bg-transparent border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800': variant === 'outline',
            'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            
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
        'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200': variant === 'neutral',
        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300': variant === 'success',
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300': variant === 'warning',
        'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300': variant === 'indigo',
      },
      className
    )}>
      {children}
    </span>
  );
}
