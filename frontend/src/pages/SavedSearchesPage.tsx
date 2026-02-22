import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Primitives';
import { Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SavedSearchesPage() {
  const { savedSearches, deleteSearch } = useApp();
  const navigate = useNavigate();

  const runSearch = (search: any) => {
    navigate(`/companies?savedSearchId=${search.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Saved Searches</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Quickly access your favorite filters and queries.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        {savedSearches.length > 0 ? (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {savedSearches.map(search => (
              <li key={search.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex justify-between items-center group transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Search size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{search.name}</h3>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Created {new Date(search.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={() => runSearch(search)}>Run Search</Button>
                  <button 
                    onClick={() => deleteSearch(search.id)}
                    className="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 mb-2">No saved searches yet.</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Save a search from the Companies page to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
