import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Primitives';
import { Moon, Sun, Monitor, User, Bell, Shield, Key, LogOut, Target, Plus, X, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { thesis, updateThesis, clearActivities } = useApp();
  
  // Local state for editing thesis to avoid constant context updates
  const [localThesis, setLocalThesis] = useState(thesis);
  const [newKeyword, setNewKeyword] = useState('');

  const handleSaveThesis = () => {
    updateThesis(localThesis);
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setLocalThesis({
        ...localThesis,
        keywords: [...localThesis.keywords, newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setLocalThesis({
      ...localThesis,
      keywords: localThesis.keywords.filter(k => k !== keyword)
    });
  };

  const toggleSector = (sector: string) => {
    const sectors = localThesis.sectors.includes(sector)
      ? localThesis.sectors.filter(s => s !== sector)
      : [...localThesis.sectors, sector];
    setLocalThesis({ ...localThesis, sectors });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Manage your preferences and account settings.</p>
      </div>

      {/* Investment Thesis Configuration */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Target size={20} className="text-indigo-600 dark:text-indigo-400" /> Investment Thesis
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Define your fund's focus to improve scoring and recommendations.</p>
          </div>
          <Button onClick={handleSaveThesis}>Save Changes</Button>
        </div>
        <div className="p-6 space-y-6">
            {/* Sectors */}
            <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Focus Sectors</label>
                <div className="flex flex-wrap gap-2">
                    {['AI/ML', 'B2B SaaS', 'Fintech', 'Biotech', 'Consumer', 'Crypto', 'Deep Tech', 'Climate', 'Healthcare'].map(sector => (
                        <button
                            key={sector}
                            onClick={() => toggleSector(sector)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                localThesis.sectors.includes(sector)
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                            }`}
                        >
                            {sector}
                        </button>
                    ))}
                </div>
            </div>

            {/* Keywords */}
            <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Priority Keywords</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {localThesis.keywords.map(keyword => (
                        <span key={keyword} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm">
                            {keyword}
                            <button onClick={() => removeKeyword(keyword)} className="hover:text-red-500"><X size={14} /></button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2 max-w-md">
                    <input 
                        type="text" 
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                        placeholder="Add a keyword (e.g. 'Generative')"
                        className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    <Button variant="secondary" onClick={addKeyword}><Plus size={16} /></Button>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Monitor size={20} /> Appearance
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Customize how the app looks on your device.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 max-w-md">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === 'light' 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <Sun size={24} className={theme === 'light' ? 'text-indigo-600' : 'text-neutral-500'} />
              <span className={`text-sm font-medium ${theme === 'light' ? 'text-indigo-900 dark:text-indigo-300' : 'text-neutral-700 dark:text-neutral-300'}`}>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === 'dark' 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <Moon size={24} className={theme === 'dark' ? 'text-indigo-600' : 'text-neutral-500'} />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-900 dark:text-indigo-300' : 'text-neutral-700 dark:text-neutral-300'}`}>Dark</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === 'system' 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <Monitor size={24} className={theme === 'system' ? 'text-indigo-600' : 'text-neutral-500'} />
              <span className={`text-sm font-medium ${theme === 'system' ? 'text-indigo-900 dark:text-indigo-300' : 'text-neutral-700 dark:text-neutral-300'}`}>System</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Bell size={20} /> Notifications
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage when and how you want to be notified.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-neutral-900 dark:text-white">Email Notifications</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Receive daily summaries of your tracked companies.</div>
            </div>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-neutral-900 dark:text-white">Signal Alerts</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Get notified immediately when high-priority signals are detected.</div>
            </div>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield size={20} /> Data & Privacy
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage your data and activity history.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-neutral-900 dark:text-white">Clear Activity History</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Permanently remove all your recent activity logs.</div>
            </div>
            <Button variant="outline" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900" onClick={clearActivities}>
                <Trash2 size={16} className="mr-2" /> Clear History
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Key size={20} /> API Configuration
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage your API keys for enrichment services.</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Groq API Key</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value="sk-................................" 
                  disabled
                  className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-500"
                />
                <Button variant="secondary">Update</Button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Key is securely stored in environment variables.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
