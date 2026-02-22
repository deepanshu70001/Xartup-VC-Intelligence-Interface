import React from 'react';
import { cn } from '../lib/utils';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-md overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,_white_0%,_transparent_45%)]" />
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-extrabold tracking-tight">
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
