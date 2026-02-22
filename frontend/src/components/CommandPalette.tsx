import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  Building2, 
  List, 
  Bookmark, 
  Bot,
  Settings, 
  User, 
  Moon, 
  Sun,
  Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { companies, lists } = useApp();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl relative z-50"
          >
            <Command className="w-full bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 px-4">
                <Search className="w-5 h-5 text-neutral-400 mr-3" />
                <Command.Input 
                  placeholder="Type a command or search..." 
                  className="w-full h-14 bg-transparent outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 text-base"
                />
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2">
                <Command.Empty className="py-6 text-center text-sm text-neutral-500">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="text-xs font-medium text-neutral-400 px-2 py-1.5 mb-2">
                  <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => navigate('/companies'))}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Companies
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => navigate('/lists'))}>
                    <List className="mr-2 h-4 w-4" />
                    Lists
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => navigate('/saved'))}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Saved Searches
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => navigate('/scout'))}>
                    <Bot className="mr-2 h-4 w-4" />
                    Scout Assistant
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => navigate('/profile'))}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </CommandItem>
                </Command.Group>

                <Command.Group heading="Actions" className="text-xs font-medium text-neutral-400 px-2 py-1.5 mb-2">
                  <CommandItem onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}>
                    {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    Toggle Theme
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => navigate('/companies?action=add'))}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Company
                  </CommandItem>
                </Command.Group>

                <Command.Group heading="Companies" className="text-xs font-medium text-neutral-400 px-2 py-1.5 mb-2">
                  {companies.slice(0, 5).map(company => (
                    <CommandItem key={company.id} onSelect={() => runCommand(() => navigate(`/companies/${company.id}`))}>
                      <img 
                        src={company.logo_url} 
                        alt="" 
                        className="w-4 h-4 rounded mr-2 object-contain bg-white"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} 
                      />
                      {company.name}
                    </CommandItem>
                  ))}
                </Command.Group>

                <Command.Group heading="Lists" className="text-xs font-medium text-neutral-400 px-2 py-1.5 mb-2">
                  {lists.map(list => (
                    <CommandItem key={list.id} onSelect={() => runCommand(() => navigate(`/lists`))}>
                      <List className="mr-2 h-4 w-4" />
                      {list.name}
                    </CommandItem>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CommandItem({ children, onSelect, ...props }: { children: React.ReactNode, onSelect: () => void } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center px-4 py-3 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
      {...props}
    >
      {children}
    </Command.Item>
  );
}
