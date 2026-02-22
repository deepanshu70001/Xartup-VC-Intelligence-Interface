import React from 'react';
import { cn } from '../lib/utils';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className="relative w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 border border-neutral-700 dark:border-neutral-300 shadow-sm overflow-hidden">
        <span className="absolute inset-0 flex items-center justify-center text-white dark:text-neutral-900 text-xs font-extrabold tracking-tight">
          FS
        </span>
      </div>
      {!compact && (
        <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">
          FlowStack
        </span>
      )}
    </div>
  );
}
