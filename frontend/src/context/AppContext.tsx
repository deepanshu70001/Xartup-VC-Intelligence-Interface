import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, List, SavedSearch } from '../types';
import { MOCK_COMPANIES } from '../data/mock';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { buildApiUrl, getAuthHeaders, parseApiResponse } from '../lib/api';

export interface Thesis {
  sectors: string[];
  stages: string[];
  geography: string[];
  keywords: string[];
  antiPortfolio: string[];
}

interface AppState {
  companies: Company[];
  lists: List[];
  savedSearches: SavedSearch[];
  thesis: Thesis;
  
  // Actions
  addList: (name: string) => void;
  deleteList: (id: string) => void;
  addCompanyToList: (listId: string, companyId: string) => void;
  addCompaniesToList: (listId: string, companyIds: string[]) => void;
  removeCompanyFromList: (listId: string, companyId: string) => void;
  saveSearch: (name: string, filters: any) => void;
  deleteSearch: (id: string) => void;
  updateCompany: (company: Company) => void;
  updateCompanyNote: (companyId: string, note: string) => void;
  addCompany: (company: Company) => void;
  deleteCompanies: (companyIds: string[]) => void;
  enrichCompany: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  activities: Activity[];
  addActivity: (action: string, details: string) => void;
  clearActivities: () => void;
  enrichingIds: string[];
  updateThesis: (thesis: Thesis) => void;
}

export interface Activity {
  id: string;
  userId: string; // In a real app, this would link to the user
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Initialize state from localStorage or defaults
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('companies');
    return saved ? JSON.parse(saved) : MOCK_COMPANIES;
  });

  const [allLists, setAllLists] = useState<List[]>(() => {
    const saved = localStorage.getItem('lists');
    return saved ? JSON.parse(saved) : [];
  });

  const [allSavedSearches, setAllSavedSearches] = useState<SavedSearch[]>(() => {
    const saved = localStorage.getItem('savedSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const [allActivities, setAllActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('activities');
    return saved ? JSON.parse(saved) : [];
  });

  // User-specific data maps (companyId -> data)
  const [userFavorites, setUserFavorites] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('userFavorites');
    return saved ? JSON.parse(saved) : {};
  });

  const [userNotes, setUserNotes] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem('userNotes');
    return saved ? JSON.parse(saved) : {};
  });

  const [thesis, setThesis] = useState<Thesis>(() => {
    const saved = localStorage.getItem('thesis');
    return saved ? JSON.parse(saved) : {
      sectors: ['AI/ML', 'B2B SaaS', 'Fintech'],
      stages: ['Seed', 'Series A'],
      geography: ['North America', 'Europe'],
      keywords: ['Generative', 'Agentic', 'Infrastructure'],
      antiPortfolio: ['Crypto', 'D2C']
    };
  });

  const [enrichingIds, setEnrichingIds] = useState<string[]>([]);

  // Derived state for current user
  const lists = user ? allLists.filter(l => l.userId === user.id) : [];
  const savedSearches = user ? allSavedSearches.filter(s => s.userId === user.id) : [];
  const activities = user ? allActivities.filter(a => a.userId === user.id) : [];
  
  // Merge user-specific data into companies
  const companiesWithUserData = companies.map(company => ({
    ...company,
    isFavorite: user ? (userFavorites[user.id] || []).includes(company.id) : false,
    notes: user ? ((userNotes[user.id] || {})[company.id] ?? company.notes) : company.notes
  }));

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('lists', JSON.stringify(allLists));
  }, [allLists]);

  useEffect(() => {
    localStorage.setItem('savedSearches', JSON.stringify(allSavedSearches));
  }, [allSavedSearches]);

  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(allActivities));
  }, [allActivities]);

  useEffect(() => {
    localStorage.setItem('userFavorites', JSON.stringify(userFavorites));
  }, [userFavorites]);

  useEffect(() => {
    localStorage.setItem('userNotes', JSON.stringify(userNotes));
  }, [userNotes]);

  useEffect(() => {
    localStorage.setItem('thesis', JSON.stringify(thesis));
  }, [thesis]);

  const addActivity = (action: string, details: string) => {
    if (!user) return;
    const newActivity: Activity = {
      id: uuidv4(),
      userId: user.id, 
      userName: user.name,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setAllActivities(prev => [newActivity, ...prev]);
  };

  const clearActivities = () => {
    if (!user) return;
    setAllActivities(prev => prev.filter(a => a.userId !== user.id));
    toast.success('Activity history cleared');
  };

  // Actions
  const addList = (name: string) => {
    if (!user) return;
    const newList: List = {
      id: uuidv4(),
      userId: user.id,
      name,
      companyIds: [],
      createdAt: new Date().toISOString(),
    };
    setAllLists(prev => [...prev, newList]);
    addActivity('Created List', `Created new list "${name}"`);
    toast.success(`List "${name}" created`);
  };

  const deleteList = (id: string) => {
    const list = lists.find(l => l.id === id);
    setAllLists(prev => prev.filter(l => l.id !== id));
    if (list) addActivity('Deleted List', `Deleted list "${list.name}"`);
    toast.success('List deleted');
  };

  const addCompanyToList = (listId: string, companyId: string) => {
    setAllLists(prev => prev.map(list => {
      if (list.id === listId) {
        if (list.companyIds.includes(companyId)) {
          toast.info('Company already in list');
          return list;
        }
        const company = companies.find(c => c.id === companyId);
        addActivity('Added to List', `Added ${company?.name || 'company'} to ${list.name}`);
        toast.success('Company added to list');
        return { ...list, companyIds: [...list.companyIds, companyId] };
      }
      return list;
    }));
  };

  const addCompaniesToList = (listId: string, companyIds: string[]) => {
    if (companyIds.length === 0) return;

    let addedCount = 0;
    let listName = 'list';

    setAllLists(prev => prev.map(list => {
      if (list.id !== listId) return list;
      listName = list.name;
      const toAdd = companyIds.filter(id => !list.companyIds.includes(id));
      if (toAdd.length === 0) return list;
      addedCount = toAdd.length;
      return { ...list, companyIds: [...list.companyIds, ...toAdd] };
    }));

    if (addedCount === 0) {
      toast.info('All selected companies are already in this list');
      return;
    }

    addActivity('Bulk Added to List', `Added ${addedCount} companies to ${listName}`);
    toast.success(`Added ${addedCount} companies to ${listName}`);
  };

  const removeCompanyFromList = (listId: string, companyId: string) => {
    setAllLists(prev => prev.map(list => {
      if (list.id === listId) {
        const company = companies.find(c => c.id === companyId);
        addActivity('Removed from List', `Removed ${company?.name || 'company'} from ${list.name}`);
        return { ...list, companyIds: list.companyIds.filter(id => id !== companyId) };
      }
      return list;
    }));
    toast.success('Company removed from list');
  };

  const saveSearch = (name: string, filters: any) => {
    if (!user) return;
    const newSearch: SavedSearch = {
      id: uuidv4(),
      userId: user.id,
      name,
      filters,
      createdAt: new Date().toISOString(),
    };
    setAllSavedSearches(prev => [...prev, newSearch]);
    addActivity('Saved Search', `Saved search "${name}"`);
    toast.success('Search saved');
  };

  const deleteSearch = (id: string) => {
    const search = savedSearches.find(s => s.id === id);
    setAllSavedSearches(prev => prev.filter(s => s.id !== id));
    if (search) addActivity('Deleted Search', `Deleted search "${search.name}"`);
    toast.success('Saved search deleted');
  };

  const updateCompany = (updatedCompany: Company) => {
    // This updates the global company data (shared)
    // If we want to update user notes, we should handle that separately
    // But for now, let's assume updateCompany is for shared data like enrichment
    setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
    addActivity('Updated Company', `Updated details for ${updatedCompany.name}`);
  };

  const addCompany = (newCompany: Company) => {
    setCompanies(prev => [newCompany, ...prev]);
    addActivity('Added Company', `Added new company ${newCompany.name}`);
  };

  const updateCompanyNote = (companyId: string, note: string) => {
    if (!user) return;
    setUserNotes(prev => ({
      ...prev,
      [user.id]: {
        ...(prev[user.id] || {}),
        [companyId]: note
      }
    }));
  };

  const deleteCompanies = (companyIds: string[]) => {
    if (companyIds.length === 0) return;
    const idSet = new Set(companyIds);
    const deletedCount = companies.filter(c => idSet.has(c.id)).length;

    setCompanies(prev => prev.filter(c => !idSet.has(c.id)));
    setAllLists(prev => prev.map(list => ({
      ...list,
      companyIds: list.companyIds.filter(id => !idSet.has(id))
    })));
    setUserFavorites(prev => {
      const next: Record<string, string[]> = {};
      (Object.entries(prev) as [string, string[]][]).forEach(([userId, favorites]) => {
        next[userId] = favorites.filter(id => !idSet.has(id));
      });
      return next;
    });
    setUserNotes(prev => {
      const next: Record<string, Record<string, string>> = {};
      (Object.entries(prev) as [string, Record<string, string>][]).forEach(([userId, notes]) => {
        const filteredEntries = Object.entries(notes).filter(([companyId]) => !idSet.has(companyId));
        next[userId] = Object.fromEntries(filteredEntries);
      });
      return next;
    });

    addActivity('Deleted Companies', `Deleted ${deletedCount} companies`);
    toast.success(`${deletedCount} compan${deletedCount === 1 ? 'y' : 'ies'} deleted`);
  };

  const toggleFavorite = (id: string) => {
    if (!user) return;
    
    setUserFavorites(prev => {
      const currentFavorites = prev[user.id] || [];
      const isFavorite = currentFavorites.includes(id);
      let newFavorites;
      
      if (isFavorite) {
        newFavorites = currentFavorites.filter(favId => favId !== id);
        toast.success('Removed from favorites');
      } else {
        newFavorites = [...currentFavorites, id];
        toast.success('Added to favorites');
      }
      
      return {
        ...prev,
        [user.id]: newFavorites
      };
    });
  };

  const updateThesis = (newThesis: Thesis) => {
    setThesis(newThesis);
    addActivity('Updated Thesis', 'Updated investment thesis configuration');
    toast.success('Thesis updated');
  };

  const enrichCompany = async (id: string) => {
    const company = companies.find(c => c.id === id);
    if (!company) return;

    setEnrichingIds(prev => [...prev, id]);

    try {
      // Ensure we have a valid URL
      let url = company.domain;
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }

      const response = await fetch(buildApiUrl('/api/enrich'), {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        let errorMessage = 'Enrichment failed';
        try {
          const errorData = await parseApiResponse<{ error?: string }>(response);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          if (response.status === 401) {
            errorMessage = "Unauthorized. Please log in again.";
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const enrichmentData = await parseApiResponse<any>(response);
      
      const updatedCompany = {
        ...company,
        enrichment: enrichmentData,
      };

      updateCompany(updatedCompany);
      addActivity('Enriched Company', `Successfully enriched data for ${company.name}`);
      toast.success('Company enriched successfully');
    } catch (error: any) {
      console.error('Enrichment error:', error);
      toast.error(`Enrichment failed: ${error.message}`);
      throw error;
    } finally {
      setEnrichingIds(prev => prev.filter(eid => eid !== id));
    }
  };

  return (
    <AppContext.Provider value={{
      companies: companiesWithUserData,
      lists,
      savedSearches,
      activities,
      addList,
      deleteList,
      addCompanyToList,
      addCompaniesToList,
      removeCompanyFromList,
      saveSearch,
      deleteSearch,
      updateCompany,
      updateCompanyNote,
      addCompany,
      deleteCompanies,
      enrichCompany,
      toggleFavorite,
      addActivity,
      clearActivities,
      enrichingIds,
      thesis,
      updateThesis,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
