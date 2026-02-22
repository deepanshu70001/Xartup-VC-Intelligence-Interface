import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  List as ListIcon, 
  Bookmark, 
  Bot,
  Settings,
  Search,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CommandPalette } from './CommandPalette';
import { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { SiteFooter } from './SiteFooter';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'U';

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = e.currentTarget.value;
      if (query.trim()) {
        navigate(`/companies?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors ambient-shell">
      <CommandPalette />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <BrandLogo className="group-hover:scale-[1.02] transition-transform" />
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-neutral-500">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/companies" icon={<Building2 size={18} />} label="Companies" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/lists" icon={<ListIcon size={18} />} label="Lists" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/saved" icon={<Bookmark size={18} />} label="Saved Searches" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/scout" icon={<Bot size={18} />} label="Scout Assistant" onClick={() => setIsSidebarOpen(false)} />
        </nav>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
          <div className="space-y-1">
            <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" onClick={() => setIsSidebarOpen(false)} />
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950 transition-colors relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 transition-colors z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="lg:hidden flex items-center gap-2 mr-2">
                <BrandLogo compact />
            </div>
            <div className="flex items-center w-full max-w-xs sm:max-w-md bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2 transition-colors focus-within:ring-2 focus-within:ring-indigo-500/20">
              <Search size={18} className="text-neutral-400 mr-2 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-neutral-400 text-neutral-900 dark:text-white"
                onKeyDown={handleSearch}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationCenter />
            <Link to="/profile">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-md cursor-pointer"
              >
                {initials}
              </motion.div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="motion-rise"
          >
            {children}
          </motion.div>
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden",
          isActive
            ? "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="active-nav"
              className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
            />
          )}
          <span className="relative z-10">{icon}</span>
          <span className="relative z-10">{label}</span>
        </>
      )}
    </NavLink>
  );
}
