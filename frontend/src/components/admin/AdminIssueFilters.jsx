/**
 * AdminIssueFilters — Advanced filtering options for issue management
 * Includes category, status, date range, and priority filters
 */

import { useState } from 'react';

const CATEGORIES = ['Road', 'Water', 'Electricity', 'Sanitation', 'Public Transport', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function AdminIssueFilters({ onFilterChange = () => {} }) {
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    dateRange: 'all',
    sortBy: 'newest',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleReset = () => {
    const emptyFilters = { category: '', priority: '', dateRange: 'all', sortBy: 'newest' };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== 'all' && v !== 'newest');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Filter Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#1e3b8a]">tune</span>
          <h3 className="font-semibold text-slate-800">Advanced Filters</h3>
          {hasActiveFilters && (
            <span className="ml-2 px-2.5 py-1 bg-[#1e3b8a]/10 text-[#1e3b8a] text-xs font-bold rounded-full">
              {Object.values(filters).filter(v => v !== '' && v !== 'all' && v !== 'newest').length} Active
            </span>
          )}
        </div>
        <span className={`material-symbols-outlined text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <>
          <div className="border-t border-slate-100 px-6 py-5 space-y-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/20 focus:border-[#1e3b8a]"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/20 focus:border-[#1e3b8a]"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map((pri) => (
                  <option key={pri} value={pri}>
                    {pri}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/20 focus:border-[#1e3b8a]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3b8a]/20 focus:border-[#1e3b8a]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="trending">Trending</option>
                <option value="verified">Verified First</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex gap-3 justify-end">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1e3b8a] rounded-lg hover:bg-[#1e3b8a]/90 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </>
      )}
    </div>
  );
}
