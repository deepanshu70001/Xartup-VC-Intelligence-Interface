import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from './ui/Primitives';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  activeFilters: any;
}

export function FilterModal({ isOpen, onClose, onApply, activeFilters }: FilterModalProps) {
  const [filters, setFilters] = useState(activeFilters);

  const stages = ['Seed', 'Series A', 'Series B', 'Series C+', 'Public'];
  const employeeRanges = ['1-10', '11-50', '51-200', '201-500', '500+'];

  const toggleStage = (stage: string) => {
    const current = filters.stages || [];
    const updated = current.includes(stage)
      ? current.filter((s: string) => s !== stage)
      : [...current, stage];
    setFilters({ ...filters, stages: updated });
  };

  const toggleRange = (range: string) => {
    const current = filters.employeeRanges || [];
    const updated = current.includes(range)
      ? current.filter((r: string) => r !== range)
      : [...current, range];
    setFilters({ ...filters, employeeRanges: updated });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-6 sm:top-1/2 -translate-x-1/2 sm:-translate-y-1/2 w-[calc(100vw-2rem)] max-w-md max-h-[calc(100vh-3rem)] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-50 p-5 sm:p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Filter Companies</h2>
              <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'DevTools', 'Productivity', 'Fintech', 'Design', 'AI/ML', 'Biotech', 'Cybersecurity', 'Healthcare', 'Robotics'].map(ind => (
                    <button
                      key={ind}
                      onClick={() => {
                        const current = filters.industry || 'All';
                        setFilters({ ...filters, industry: current === ind ? 'All' : ind });
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        (filters.industry === ind || (!filters.industry && ind === 'All'))
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Stage</label>
                <div className="flex flex-wrap gap-2">
                  {stages.map(stage => (
                    <button
                      key={stage}
                      onClick={() => toggleStage(stage)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        filters.stages?.includes(stage)
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Employees</label>
                <div className="flex flex-wrap gap-2">
                  {employeeRanges.map(range => (
                    <button
                      key={range}
                      onClick={() => toggleRange(range)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        filters.employeeRanges?.includes(range)
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.enrichedOnly || false}
                    onChange={(e) => setFilters({ ...filters, enrichedOnly: e.target.checked })}
                    className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Show enriched companies only</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-800">
              <Button type="button" variant="ghost" onClick={() => { setFilters({}); onApply({}); onClose(); }}>Clear All</Button>
              <Button type="button" onClick={() => { onApply(filters); onClose(); }}>Apply Filters</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
