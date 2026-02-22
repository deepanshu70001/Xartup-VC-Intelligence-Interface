import React from 'react';
import { Link } from 'react-router-dom';

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-8">
      <div className={`mx-auto px-4 sm:px-6 py-5 ${compact ? 'max-w-4xl' : 'max-w-7xl'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="text-neutral-700 dark:text-neutral-300 font-semibold">FlowStack</div>
          <Link
            to="/about"
            className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium"
          >
            About
          </Link>
        </div>
        <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} FlowStack Intelligence Inc. All rights reserved.</span>
          <span>100 Market Street, San Francisco, CA 94105, USA</span>
        </div>
      </div>
    </footer>
  );
}
