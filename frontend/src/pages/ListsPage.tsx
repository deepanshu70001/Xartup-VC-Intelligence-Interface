import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Primitives';
import { Plus, Trash2, Download, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';

export default function ListsPage() {
  const { lists, addList, deleteList, companies, removeCompanyFromList } = useApp();
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      addList(newListName.trim());
      setNewListName('');
      setIsCreating(false);
    }
  };

  const exportListJson = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const listCompanies = companies.filter(c => list.companyIds.includes(c.id));
    const dataStr = JSON.stringify(listCompanies, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${list.name.replace(/\s+/g, '_').toLowerCase()}_export.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportListCsv = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const listCompanies = companies.filter(c => list.companyIds.includes(c.id));
    const csv = Papa.unparse(
      listCompanies.map(c => ({
        Name: c.name,
        Domain: c.domain,
        Industry: c.industry,
        Stage: c.stage,
        Location: c.location,
        Employees: c.employee_count,
        Funding: c.total_funding || '',
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${list.name.replace(/\s+/g, '_').toLowerCase()}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">My Lists</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Organize companies into custom lists.</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreating(true)}>
          <Plus size={16} className="mr-2" /> Create List
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateList} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            placeholder="List Name (e.g., 'SaaS Q1 Targets')"
            className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            autoFocus
          />
          <Button type="submit" variant="primary">Create</Button>
          <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map(list => (
          <div key={list.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">{list.name}</h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => exportListJson(list.id)}
                  className="p-1.5 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  title="Export JSON"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => exportListCsv(list.id)}
                  className="p-1.5 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-xs font-semibold"
                  title="Export CSV"
                >
                  CSV
                </button>
                <button 
                  onClick={() => deleteList(list.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete List"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {list.companyIds.length} companies
            </div>

            <div className="space-y-2 mb-6">
              {list.companyIds.slice(0, 3).map(id => {
                const company = companies.find(c => c.id === id);
                if (!company) return null;
                return (
                  <div key={id} className="flex items-center justify-between gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="truncate">{company.name}</span>
                    </div>
                    <button
                      onClick={() => removeCompanyFromList(list.id, id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                      title="Remove from list"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
              {list.companyIds.length > 3 && (
                <div className="text-xs text-neutral-400 pl-3.5">+ {list.companyIds.length - 3} more</div>
              )}
              {list.companyIds.length === 0 && (
                <div className="text-sm text-neutral-400 italic">Empty list</div>
              )}
            </div>

            <Link to="/companies">
              <Button variant="secondary" className="w-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 group-hover:border-indigo-100 dark:group-hover:border-indigo-800 transition-all">
                Browse Companies <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
          </div>
        ))}

        {lists.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">You haven't created any lists yet.</p>
            <Button variant="outline" onClick={() => setIsCreating(true)}>Create your first list</Button>
          </div>
        )}
      </div>
    </div>
  );
}
