import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Badge } from '../components/ui/Primitives';
import { Plus, Filter, Download, Search, Heart, CheckSquare, Square } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFaviconUrl } from '../lib/utils';
import { AddCompanyModal } from '../components/AddCompanyModal';
import { FilterModal } from '../components/FilterModal';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type SortField = 'name' | 'industry' | 'stage' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function CompaniesPage() {
  const {
    companies,
    toggleFavorite,
    enrichingIds,
    enrichCompany,
    saveSearch,
    savedSearches,
    lists,
    addCompaniesToList,
    deleteCompanies,
  } = useApp();

  const [searchParams] = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const query = searchParams.get('search');
    if (query) setSearchQuery(query);
  }, [searchParams]);

  useEffect(() => {
    const savedSearchId = searchParams.get('savedSearchId');
    if (!savedSearchId || savedSearches.length === 0) return;
    const search = savedSearches.find((s) => s.id === savedSearchId);
    if (!search) return;
    setSearchQuery(search.filters.query || '');
    setAdvancedFilters({
      ...search.filters.advanced,
      industry: search.filters.industry || 'All',
    });
  }, [searchParams, savedSearches]);

  const parseRange = (rangeStr: string): [number, number] => {
    if (!rangeStr) return [0, 0];
    if (rangeStr.endsWith('+')) {
      const min = parseInt(rangeStr.replace('+', '').replace(/,/g, ''), 10);
      return [min, Infinity];
    }
    const [min, max] = rangeStr.split('-');
    if (!min || !max) return [0, 0];
    return [parseInt(min.replace(/,/g, ''), 10), parseInt(max.replace(/,/g, ''), 10)];
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesIndustry =
        !advancedFilters.industry ||
        advancedFilters.industry === 'All' ||
        company.industry === advancedFilters.industry;
      const matchesSearch =
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.domain.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesAdvanced = true;
      if (advancedFilters.stages?.length) {
        matchesAdvanced = matchesAdvanced && advancedFilters.stages.includes(company.stage);
      }
      if (advancedFilters.enrichedOnly) {
        matchesAdvanced = matchesAdvanced && !!company.enrichment;
      }
      if (advancedFilters.employeeRanges?.length) {
        const companyRange = parseRange(company.employee_count);
        const hasOverlap = advancedFilters.employeeRanges.some((r: string) => {
          const fr = parseRange(r);
          return Math.max(companyRange[0], fr[0]) <= Math.min(companyRange[1], fr[1]);
        });
        matchesAdvanced = matchesAdvanced && hasOverlap;
      }
      return matchesIndustry && matchesSearch && matchesAdvanced;
    });
  }, [companies, searchQuery, advancedFilters]);

  const sortedCompanies = useMemo(() => {
    const copy = [...filteredCompanies];
    copy.sort((a: any, b: any) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'createdAt') {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return (aTime - bTime) * dir;
      }
      return String(a[sortField] || '').localeCompare(String(b[sortField] || '')) * dir;
    });
    return copy;
  }, [filteredCompanies, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedCompanies.length / pageSize));
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCompanies.slice(start, start + pageSize);
  }, [currentPage, sortedCompanies]);

  useEffect(() => setCurrentPage(1), [searchQuery, advancedFilters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSaveSearch = () => {
    const name = window.prompt('Enter a name for this search:');
    if (!name?.trim()) return;
    saveSearch(name.trim(), {
      query: searchQuery,
      industry: advancedFilters.industry || 'All',
      advanced: advancedFilters,
    });
  };

  const handleExportCSV = () => {
    const pool = selectedIds.size
      ? companies.filter((c) => selectedIds.has(c.id))
      : sortedCompanies;
    const csv = Papa.unparse(
      pool.map((c: any) => ({
        Name: c.name,
        Domain: c.domain,
        Industry: c.industry,
        Stage: c.stage,
        Description: c.description,
        Enriched: c.enrichment ? 'Yes' : 'No',
        Favorite: c.isFavorite ? 'Yes' : 'No',
        Created: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `companies_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginatedCompanies.map((c) => c.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected companies?`)) return;
    deleteCompanies(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkAddToList = () => {
    if (!selectedIds.size) return;
    if (lists.length === 0) {
      toast.info('Create a list first.');
      return;
    }
    const chosen = window.prompt(`Enter list name:\n${lists.map((l) => l.name).join(', ')}`);
    if (!chosen?.trim()) return;
    const list = lists.find((l) => l.name.toLowerCase() === chosen.trim().toLowerCase());
    if (!list) {
      toast.error('List not found.');
      return;
    }
    addCompaniesToList(list.id, Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const activeFilterCount =
    (advancedFilters.stages?.length || 0) +
    (advancedFilters.enrichedOnly ? 1 : 0) +
    (advancedFilters.employeeRanges?.length || 0) +
    (advancedFilters.industry && advancedFilters.industry !== 'All' ? 1 : 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">Companies</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Discover | open profile | enrich | take action.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
          {selectedIds.size > 0 && (
            <Button variant="secondary" onClick={() => setSelectedIds(new Set())}>
              Clear Selection ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" onClick={handleExportCSV}><Download size={16} className="mr-2" /> Export CSV</Button>
          <Button variant="outline" onClick={handleSaveSearch}><Heart size={16} className="mr-2" /> Save Search</Button>
          <Button onClick={() => setIsAddModalOpen(true)}><Plus size={16} className="mr-2" /> Add Company</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <WorkflowStep index="01" title="Discover" description="Search and filter targets." />
        <WorkflowStep index="02" title="Open Profile" description="Review company fit quickly." />
        <WorkflowStep index="03" title="Enrich" description="Fetch live public web signals." />
        <WorkflowStep index="04" title="Take Action" description="Save, note, follow, export." />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFilterModalOpen(true)}
            className={activeFilterCount > 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : ''}
          >
            <Filter size={16} className="mr-2" /> Filters
            {activeFilterCount > 0 && <span className="ml-2 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
          </Button>
          {activeFilterCount > 0 && (
            <button onClick={() => setAdvancedFilters({})} className="text-xs text-neutral-500 hover:text-neutral-900 underline">
              Clear All
            </button>
          )}
        </div>
        <div className="relative w-full lg:w-72">
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

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-xl z-40 flex flex-wrap items-center justify-center gap-3 max-w-[92vw]"
        >
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-neutral-700"></div>
          <button className="text-sm hover:text-indigo-400 transition-colors" onClick={handleExportCSV}>Export</button>
          <button className="text-sm hover:text-red-400 transition-colors" onClick={handleBulkDelete}>Delete</button>
          <button className="text-sm hover:text-emerald-400 transition-colors" onClick={handleBulkAddToList}>Add to List</button>
        </motion.div>
      )}

      <div className="flex items-center gap-2 px-1 py-1 text-sm text-neutral-500">
        <button onClick={toggleSelectAllPage} className="flex items-center gap-2 hover:text-neutral-900 transition-colors">
          {paginatedCompanies.length > 0 && paginatedCompanies.every((c) => selectedIds.has(c.id))
            ? <CheckSquare size={18} className="text-indigo-600" />
            : <Square size={18} />}
          Select Page
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
            <tr>
              <th className="text-left px-4 py-3 w-10"></th>
              <th className="text-left px-4 py-3 cursor-pointer" onClick={() => handleSort('name')}>Company</th>
              <th className="text-left px-4 py-3 cursor-pointer" onClick={() => handleSort('industry')}>Industry</th>
              <th className="text-left px-4 py-3 cursor-pointer" onClick={() => handleSort('stage')}>Stage</th>
              <th className="text-left px-4 py-3">Domain</th>
              <th className="text-left px-4 py-3 cursor-pointer" onClick={() => handleSort('createdAt')}>Added</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCompanies.map((company: any) => (
              <tr key={company.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <td className="px-4 py-3">
                  <button onClick={() => toggleSelection(company.id)}>
                    {selectedIds.has(company.id)
                      ? <CheckSquare size={18} className="text-indigo-600" />
                      : <Square size={18} className="text-neutral-400" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={company.logo_url || getFaviconUrl(company.domain)}
                      alt={company.name}
                      className="w-7 h-7 rounded bg-white border border-neutral-100 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = getFaviconUrl(company.domain); }}
                    />
                    <Link to={`/companies/${company.id}`} className="font-medium text-neutral-900 dark:text-white hover:text-indigo-600">{company.name}</Link>
                    {company.enrichment && <Badge variant="success">Enriched</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{company.industry}</td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{company.stage}</td>
                <td className="px-4 py-3">
                  <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{company.domain}</a>
                </td>
                <td className="px-4 py-3 text-neutral-500">{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(company.id)}
                      className={`p-1.5 rounded ${company.isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-neutral-400 hover:text-red-500'}`}
                    >
                      <Heart size={16} fill={company.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => enrichCompany(company.id)}
                      disabled={enrichingIds.includes(company.id)}
                      className="text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50"
                    >
                      {enrichingIds.includes(company.id) ? 'Enriching...' : 'Enrich'}
                    </button>
                    <Link to={`/companies/${company.id}`}><Button variant="ghost" size="sm">Open</Button></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedCompanies.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 border-dashed">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">No companies found</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Try adjusting your filters or search query.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setAdvancedFilters({}); }}>
            Clear Filters
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-neutral-500">
        <span>
          Showing {sortedCompanies.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedCompanies.length)} of {sortedCompanies.length}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</Button>
          <span className="text-xs">Page {currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
        </div>
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

function WorkflowStep({ index, title, description }: { index: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      <div className="text-[11px] font-semibold tracking-wide uppercase text-indigo-600 dark:text-indigo-400">{index}</div>
      <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{description}</div>
    </div>
  );
}
