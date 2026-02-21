import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Badge } from '../components/ui/Primitives';
import { Plus, Filter, Download, Search, Heart, Sparkles, Loader2, CheckSquare, Square, X, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFaviconUrl } from '../lib/utils';
import { AddCompanyModal } from '../components/AddCompanyModal';
import { FilterModal } from '../components/FilterModal';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompaniesPage() {
  const { companies, toggleFavorite, enrichingIds, enrichCompany, saveSearch, savedSearches } = useApp();
  const [searchParams] = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Update searchQuery when URL param changes
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Handle saved search loading
  useEffect(() => {
    const savedSearchId = searchParams.get('savedSearchId');
    if (savedSearchId && savedSearches.length > 0) {
      const search = savedSearches.find(s => s.id === savedSearchId);
      if (search) {
        setSearchQuery(search.filters.query || '');
        // Map old industry filter to new advancedFilters structure if needed
        const industry = search.filters.industry || 'All';
        setAdvancedFilters({
            ...search.filters.advanced,
            industry: industry
        });
      }
    }
  }, [searchParams, savedSearches]);

  const handleSaveSearch = () => {
    const name = window.prompt("Enter a name for this search:");
    if (name && name.trim()) {
      saveSearch(name.trim(), {
        query: searchQuery,
        industry: advancedFilters.industry || 'All',
        advanced: advancedFilters
      });
    }
  };

  // Extract unique industries for filter tabs
  const industries = useMemo(() => {
    const all = companies.map(c => c.industry).filter(Boolean);
    return ['All', ...Array.from(new Set(all))];
  }, [companies]);

  // Helper to parse range strings like "1-10", "500+"
  const parseRange = (rangeStr: string): [number, number] => {
    if (!rangeStr) return [0, 0];
    if (rangeStr.endsWith('+')) {
      const min = parseInt(rangeStr.replace('+', '').replace(/,/g, ''), 10);
      return [min, Infinity];
    }
    const parts = rangeStr.split('-');
    if (parts.length === 2) {
      return [parseInt(parts[0].replace(/,/g, ''), 10), parseInt(parts[1].replace(/,/g, ''), 10)];
    }
    return [0, 0];
  };

  const checkOverlap = (range1: [number, number], range2: [number, number]) => {
    return Math.max(range1[0], range2[0]) <= Math.min(range1[1], range2[1]);
  };

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesIndustry = !advancedFilters.industry || advancedFilters.industry === 'All' || company.industry === advancedFilters.industry;
      const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            company.industry.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Advanced Filters
      let matchesAdvanced = true;
      if (advancedFilters.stages && advancedFilters.stages.length > 0) {
        matchesAdvanced = matchesAdvanced && advancedFilters.stages.includes(company.stage);
      }
      if (advancedFilters.enrichedOnly) {
        matchesAdvanced = matchesAdvanced && !!company.enrichment;
      }
      if (advancedFilters.employeeRanges && advancedFilters.employeeRanges.length > 0) {
        const companyRange = parseRange(company.employee_count);
        const hasOverlap = advancedFilters.employeeRanges.some((filterRangeStr: string) => {
            const filterRange = parseRange(filterRangeStr);
            return checkOverlap(companyRange, filterRange);
        });
        matchesAdvanced = matchesAdvanced && hasOverlap;
      }
      
      return matchesIndustry && matchesSearch && matchesAdvanced;
    });
  }, [companies, searchQuery, advancedFilters]);

  const handleExportCSV = () => {
    const companiesToExport = selectedIds.size > 0 
      ? companies.filter(c => selectedIds.has(c.id))
      : filteredCompanies;

    const csv = Papa.unparse(companiesToExport.map(c => ({
      Name: c.name,
      Domain: c.domain,
      Industry: c.industry,
      Stage: c.stage,
      Description: c.description,
      Enriched: c.enrichment ? 'Yes' : 'No',
      Favorite: c.isFavorite ? 'Yes' : 'No',
      Created: new Date(c.createdAt).toLocaleDateString()
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `companies_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCompanies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCompanies.map(c => c.id)));
    }
  };

  const activeFilterCount = (advancedFilters.stages?.length || 0) + (advancedFilters.enrichedOnly ? 1 : 0) + (advancedFilters.employeeRanges?.length || 0) + (advancedFilters.industry && advancedFilters.industry !== 'All' ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Companies</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Manage and track your deal flow pipeline.</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="secondary" onClick={() => setSelectedIds(new Set())}>
              Clear Selection ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" onClick={handleExportCSV}>
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleSaveSearch}>
             <Heart size={16} className="mr-2" /> Save Search
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Add Company
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsFilterModalOpen(true)}
            className={activeFilterCount > 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : ''}
          >
            <Filter size={16} className="mr-2" /> 
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </Button>
          
          {/* Active Filters Chips */}
          <div className="flex flex-wrap gap-2 ml-2">
            {advancedFilters.industry && advancedFilters.industry !== 'All' && (
              <Badge variant="indigo" className="flex items-center gap-1 pr-1">
                {advancedFilters.industry}
                <button onClick={() => setAdvancedFilters({...advancedFilters, industry: 'All'})} className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </Badge>
            )}
            {advancedFilters.stages?.map((stage: string) => (
              <Badge key={stage} variant="neutral" className="flex items-center gap-1 pr-1">
                {stage}
                <button onClick={() => setAdvancedFilters({...advancedFilters, stages: advancedFilters.stages.filter((s: string) => s !== stage)})} className="hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </Badge>
            ))}
            {advancedFilters.employeeRanges?.map((range: string) => (
              <Badge key={range} variant="neutral" className="flex items-center gap-1 pr-1">
                {range}
                <button onClick={() => setAdvancedFilters({...advancedFilters, employeeRanges: advancedFilters.employeeRanges.filter((r: string) => r !== range)})} className="hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </Badge>
            ))}
            {advancedFilters.enrichedOnly && (
              <Badge variant="success" className="flex items-center gap-1 pr-1">
                Enriched Only
                <button onClick={() => setAdvancedFilters({...advancedFilters, enrichedOnly: false})} className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </Badge>
            )}
            {activeFilterCount > 0 && (
               <button onClick={() => setAdvancedFilters({})} className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline">
                 Clear All
               </button>
            )}
          </div>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search companies..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-full shadow-xl z-40 flex items-center gap-4"
        >
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-neutral-700"></div>
          <button className="text-sm hover:text-indigo-400 transition-colors" onClick={handleExportCSV}>Export</button>
          <button className="text-sm hover:text-red-400 transition-colors">Delete</button>
          <button className="text-sm hover:text-emerald-400 transition-colors">Add to List</button>
        </motion.div>
      )}

      {/* Companies Grid */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-500">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 hover:text-neutral-900 dark:hover:text-white transition-colors">
                {selectedIds.size === filteredCompanies.length && filteredCompanies.length > 0 ? (
                    <CheckSquare size={18} className="text-indigo-600" />
                ) : (
                    <Square size={18} />
                )}
                Select All
            </button>
        </div>

        <AnimatePresence>
          {filteredCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white dark:bg-neutral-900 border ${selectedIds.has(company.id) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-neutral-200 dark:border-neutral-800'} rounded-xl p-4 hover:shadow-md transition-all group relative`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 cursor-pointer" onClick={() => toggleSelection(company.id)}>
                    {selectedIds.has(company.id) ? (
                        <CheckSquare size={20} className="text-indigo-600" />
                    ) : (
                        <Square size={20} className="text-neutral-300 dark:text-neutral-600 hover:text-neutral-500" />
                    )}
                  </div>

                  <div className="w-12 h-12 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white p-1 flex items-center justify-center shadow-sm relative">
                    <img 
                      src={company.logo_url || getFaviconUrl(company.domain)} 
                      alt={company.name} 
                      className="w-full h-full object-contain rounded-md"
                      onError={(e) => { (e.target as HTMLImageElement).src = getFaviconUrl(company.domain) }}
                    />
                    {company.enrichment && (
                      <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 border border-white dark:border-neutral-900" title="AI Enriched">
                        <Sparkles size={10} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/companies/${company.id}`} className="font-semibold text-neutral-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-lg">
                        {company.name}
                      </Link>
                      {company.enrichment ? (
                        <Badge variant="success" className="hidden sm:inline-flex gap-1">
                          <Sparkles size={10} /> Enriched
                        </Badge>
                      ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); enrichCompany(company.id); }}
                            disabled={enrichingIds.includes(company.id)}
                            className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {enrichingIds.includes(company.id) ? (
                                <Loader2 size={10} className="animate-spin" />
                            ) : (
                                <Sparkles size={10} />
                            )}
                            {enrichingIds.includes(company.id) ? 'Enriching...' : 'Enrich'}
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>{company.industry}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      <span>{company.stage}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="hover:underline hover:text-indigo-500">
                        {company.domain}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-xs text-neutral-400">Added</span>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => toggleFavorite(company.id)}
                    className={`p-2 rounded-full transition-colors ${
                      company.isFavorite 
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title={company.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart size={18} fill={company.isFavorite ? "currentColor" : "none"} />
                  </button>

                  <Link to={`/companies/${company.id}`}>
                    <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400">
                      View Details <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        
        {filteredCompanies.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 border-dashed">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">No companies found</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Try adjusting your filters or search query.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setAdvancedFilters({}); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <AddCompanyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        onApply={setAdvancedFilters}
        activeFilters={advancedFilters}
      />
    </div>
  );
}
