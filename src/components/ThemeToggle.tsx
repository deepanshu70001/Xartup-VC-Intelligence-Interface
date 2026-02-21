import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "p-1.5 rounded-full transition-all relative",
          theme === 'light' ? "text-indigo-600 bg-white shadow-sm" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        )}
        title="Light Mode"
      >
        <Sun size={16} />
        {theme === 'light' && (
          <motion.div
            layoutId="theme-toggle"
            className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          "hidden sm:inline-flex p-1.5 rounded-full transition-all relative",
          theme === 'system' ? "text-indigo-600 bg-white shadow-sm" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        )}
        title="System Theme"
      >
        <Monitor size={16} />
        {theme === 'system' && (
          <motion.div
            layoutId="theme-toggle"
            className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "p-1.5 rounded-full transition-all relative",
          theme === 'dark' ? "text-indigo-600 bg-neutral-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        )}
        title="Dark Mode"
      >
        <Moon size={16} />
        {theme === 'dark' && (
          <motion.div
            layoutId="theme-toggle"
            className="absolute inset-0 bg-neutral-700 rounded-full shadow-sm -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    </div>
  );
}
