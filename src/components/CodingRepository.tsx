import React, { useState, useEffect, useMemo } from 'react';
import {
  Code,
  Search,
  Plus,
  ExternalLink,
  CheckCircle2,
  Clock,
  RotateCcw,
  Circle,
  Trash2,
  Loader2,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProblemItem, ProblemDifficulty, ProblemStatus } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { apiCache } from '../services/apiCache.ts';

const STATUS_CYCLE_NEXT: Record<ProblemStatus, ProblemStatus> = {
  todo: 'in_progress',
  in_progress: 'completed',
  completed: 'revision',
  revision: 'todo',
};

const STATUS_CONFIG: Record<
  ProblemStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  todo: {
    label: 'To Do',
    bg: 'bg-slate-50 hover:bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: Circle,
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-blue-50/70 hover:bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50/70 hover:bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  revision: {
    label: 'Revision',
    bg: 'bg-purple-50/70 hover:bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: RotateCcw,
  },
};

const DIFFICULTY_CONFIG: Record<
  ProblemDifficulty,
  { bg: string; text: string; border: string; dot: string }
> = {
  Easy: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
  Medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-600',
  },
  Hard: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
  },
};

export function CodingRepository() {
  const cachedData = apiCache.get<{ problems: ProblemItem[]; categories: string[] }>('coding_problems');
  const [problems, setProblems] = useState<ProblemItem[]>(cachedData?.problems || []);
  const [availableCategories, setAvailableCategories] = useState<string[]>(cachedData?.categories || []);
  const [isLoading, setIsLoading] = useState(!cachedData);

  // Filters state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | ProblemDifficulty>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | ProblemStatus>('all');
  const [sortBy, setSortBy] = useState<'default' | 'difficulty-asc' | 'difficulty-desc'>('default');

  // Debounce search input (250ms) to eliminate keystroke lag
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Add problem form state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<ProblemDifficulty>('Medium');
  const [newCategory, setNewCategory] = useState('');
  const [newLink, setNewLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete problem confirmation state
  const [problemToDelete, setProblemToDelete] = useState<ProblemItem | null>(null);

  // Toggling status indicator
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Fetch problems - CRITICAL: server guarantees createdAt ascending order
  const fetchProblems = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/problems', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const probs = data.problems || [];
        const cats = data.categories || [];
        setProblems(probs);
        setAvailableCategories(cats);
        apiCache.set('coding_problems', { problems: probs, categories: cats });
      }
    } catch (err) {
      console.error('Failed to fetch coding problems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // Cycle status: todo -> in_progress -> completed -> revision -> todo
  const handleCycleStatus = async (problem: ProblemItem) => {
    const token = localStorage.getItem('auth_token');
    if (!token || togglingIds.has(problem.id)) return;

    setTogglingIds((prev) => new Set(prev).add(problem.id));
    const nextStatus = STATUS_CYCLE_NEXT[problem.status];

    // Optimistic update
    setProblems((prev) =>
      prev.map((p) => (p.id === problem.id ? { ...p, status: nextStatus } : p))
    );

    try {
      const res = await fetch(`/api/problems/${problem.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        // Revert on error
        fetchProblems();
      } else {
        const data = await res.json();
        if (data.status) {
          setProblems((prev) =>
            prev.map((p) => (p.id === problem.id ? { ...p, status: data.status } : p))
          );
          apiCache.invalidate('dashboard');
        }
      }
    } catch {
      fetchProblems();
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(problem.id);
        return next;
      });
    }
  };

  // Add custom problem handler
  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    const trimmedCategory = newCategory.trim();

    if (!trimmedName) {
      setFormError('Problem name is required');
      return;
    }
    if (!trimmedCategory) {
      setFormError('Category is required (e.g. Arrays, DP, Graphs)');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          difficulty: newDifficulty,
          category: trimmedCategory,
          link: newLink.trim(),
        }),
      });

      if (res.ok) {
        const created: ProblemItem = await res.json();
        // Server preserves createdAt ascending; created goes at end
        setProblems((prev) => [...prev, created]);
        apiCache.invalidate('coding_problems');
        apiCache.invalidate('dashboard');
        if (!availableCategories.includes(trimmedCategory)) {
          setAvailableCategories((prev) => [...prev, trimmedCategory].sort());
        }
        setNewName('');
        setNewCategory('');
        setNewLink('');
        setIsAdding(false);
      } else {
        const err = await res.json();
        setFormError(err.message || 'Failed to add problem');
      }
    } catch {
      setFormError('Network error adding problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete problem handler with modal confirmation
  const handleConfirmDeleteProblem = async () => {
    if (!problemToDelete) return;
    const problemId = problemToDelete.id;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/problems/${problemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setProblems((prev) => prev.filter((p) => p.id !== problemId));
        apiCache.invalidate('coding_problems');
        apiCache.invalidate('dashboard');
      }
    } catch (err) {
      console.error('Failed to delete problem:', err);
    } finally {
      setProblemToDelete(null);
    }
  };

  // Combined instant client-side filtering without reloading
  const filteredProblems = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();

    let result = problems.filter((p) => {
      // Search filter: matches name or category
      if (query) {
        const nameMatch = p.name.toLowerCase().includes(query);
        const catMatch = p.category.toLowerCase().includes(query);
        if (!nameMatch && !catMatch) return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Status tab filter
      if (selectedStatusTab !== 'all' && p.status !== selectedStatusTab) {
        return false;
      }

      return true;
    });

    // Optional sort if user explicitly chooses
    if (sortBy === 'difficulty-asc') {
      const weight: Record<ProblemDifficulty, number> = { Easy: 1, Medium: 2, Hard: 3 };
      result = [...result].sort((a, b) => weight[a.difficulty] - weight[b.difficulty]);
    } else if (sortBy === 'difficulty-desc') {
      const weight: Record<ProblemDifficulty, number> = { Easy: 1, Medium: 2, Hard: 3 };
      result = [...result].sort((a, b) => weight[b.difficulty] - weight[a.difficulty]);
    }

    return result;
  }, [problems, debouncedSearchQuery, selectedDifficulty, selectedCategory, selectedStatusTab, sortBy]);

  // Status counts for tabs and panel badges
  const statusCounts = useMemo(() => {
    const counts = { all: problems.length, todo: 0, in_progress: 0, completed: 0, revision: 0 };
    for (const p of problems) {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    }
    return counts;
  }, [problems]);

  // Active panel filters count (shows on Filter button badge)
  const activePanelFilterCount =
    (selectedStatusTab !== 'all' ? 1 : 0) +
    (selectedDifficulty !== 'All' ? 1 : 0) +
    (selectedCategory !== 'All' ? 1 : 0) +
    (sortBy !== 'default' ? 1 : 0);

  const hasActiveFilters =
    searchInput.trim() !== '' || activePanelFilterCount > 0;

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearchQuery('');
    setSelectedDifficulty('All');
    setSelectedCategory('All');
    setSelectedStatusTab('all');
    setSortBy('default');
  };

  const resetPanelFilters = () => {
    setSelectedDifficulty('All');
    setSelectedCategory('All');
    setSelectedStatusTab('all');
    setSortBy('default');
  };

  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading Coding Repository...</p>
      </div>
    );
  }

  return (
    <div id="coding-repository-container" className="w-full space-y-2 sm:space-y-6">
      {/* Header Bar - Normal 1 line design on mobile, full card on desktop */}
      <header className="bg-white rounded-xl border border-slate-200 p-3 sm:p-6 flex flex-row items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <h1 id="coding-repo-title" className="text-sm sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
              Coding Repository
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
              Track your DSA practice, categorized LeetCode problems, and revision queues.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="open-add-problem-btn"
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-medium rounded-lg transition-all cursor-pointer shadow-2xs"
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span className="sm:hidden">{isAdding ? 'Cancel' : 'Add'}</span>
            <span className="hidden sm:inline">{isAdding ? 'Cancel' : 'Add Problem'}</span>
          </button>
        </div>
      </header>

      {/* Small, Unobtrusive Form to Add Custom Problem */}
      {isAdding && (
        <form
          id="add-problem-form"
          onSubmit={handleAddProblem}
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3.5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-semibold text-slate-900">
              Add New DSA Problem
            </span>
            <span className="text-xs text-slate-500">Saved to your profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="problem-name-input" className="block text-xs font-medium text-slate-600 mb-1">
                Problem Name *
              </label>
              <input
                id="problem-name-input"
                type="text"
                autoFocus
                placeholder="e.g. Trapping Rain Water, LRU Cache, Two Sum"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="problem-difficulty-select" className="block text-xs font-medium text-slate-600 mb-1">
                Difficulty *
              </label>
              <select
                id="problem-difficulty-select"
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as ProblemDifficulty)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer text-slate-900"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="problem-category-input" className="block text-xs font-medium text-slate-600 mb-1">
                Category *
              </label>
              <input
                id="problem-category-input"
                type="text"
                list="category-suggestions"
                placeholder="e.g. Dynamic Programming, Trees"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
              />
              <datalist id="category-suggestions">
                {availableCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="problem-link-input" className="block text-xs font-medium text-slate-600 mb-1">
                Optional Link (LeetCode, GFG, Codeforces)
              </label>
              <input
                id="problem-link-input"
                type="url"
                placeholder="https://leetcode.com/problems/..."
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
              />
            </div>

            <div className="flex items-end">
              <button
                id="submit-problem-btn"
                type="submit"
                disabled={isSubmitting || !newName.trim() || !newCategory.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Save Problem</span>
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-600 font-medium">{formError}</p>
          )}
        </form>
      )}

      {/* Search & Filter Toolbar for Problems */}
      <div id="problems-filter-toolbar" className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 space-y-2.5 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Always-Visible Search input with debouncing and clear icon */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="problem-search-input"
              type="text"
              placeholder="Search by problem name or category..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400"
            />
            {searchInput && (
              <button
                id="clear-problem-search-btn"
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearchQuery('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter button with active count badge */}
          <button
            id="problems-filter-btn"
            type="button"
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isFilterPanelOpen || activePanelFilterCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            aria-expanded={isFilterPanelOpen}
            aria-label="Filter problems"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activePanelFilterCount > 0 && (
              <span
                id="active-problem-filter-count-badge"
                className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white leading-none"
              >
                {activePanelFilterCount}
              </span>
            )}
            {isFilterPanelOpen ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>

        {/* Expandable Filter Panel: Status, Difficulty, Category, Sort */}
        {isFilterPanelOpen && (
          <div
            id="problems-filter-panel"
            className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-150"
          >
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Problem Status
              </label>
              <div id="filter-status-options" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {(
                  [
                    { id: 'all', label: 'All', count: statusCounts.all },
                    { id: 'todo', label: 'To Do', count: statusCounts.todo },
                    { id: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
                    { id: 'revision', label: 'Revision', count: statusCounts.revision },
                    { id: 'completed', label: 'Completed', count: statusCounts.completed },
                  ] as const
                ).map((tab) => {
                  const isSelected = selectedStatusTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`panel-status-${tab.id}-btn`}
                      type="button"
                      onClick={() => setSelectedStatusTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty, Category, and Sort Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Difficulty */}
              <div>
                <label htmlFor="filter-difficulty-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Difficulty
                </label>
                <select
                  id="filter-difficulty-select"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors cursor-pointer text-slate-800"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="filter-category-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  id="filter-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors cursor-pointer text-slate-800"
                >
                  <option value="All">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor="sort-problems-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sort Order
                </label>
                <select
                  id="sort-problems-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors cursor-pointer text-slate-800"
                >
                  <option value="default">Default Order</option>
                  <option value="difficulty-asc">Difficulty: Easy → Hard</option>
                  <option value="difficulty-desc">Difficulty: Hard → Easy</option>
                </select>
              </div>
            </div>

            {/* Filter Panel Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                {activePanelFilterCount > 0 ? `${activePanelFilterCount} panel filter${activePanelFilterCount > 1 ? 's' : ''} applied` : 'No panel filters applied'}
              </span>
              <div className="flex items-center gap-2">
                {activePanelFilterCount > 0 && (
                  <button
                    id="reset-panel-filters-btn"
                    type="button"
                    onClick={resetPanelFilters}
                    className="px-2.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  id="close-filter-panel-btn"
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-md transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Result Count & Visible Clear Filters Action (when any search or filter is active) */}
        {hasActiveFilters && (
          <div
            id="problems-results-status-bar"
            className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100"
          >
            <span>
              Showing <strong>{filteredProblems.length}</strong> of{' '}
              <strong>{problems.length}</strong> problems
            </span>
            <button
              id="clear-filters-btn"
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Problems List */}
      <div id="problems-list-container" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredProblems.length > 0 ? (
          <ul id="problems-list" className="divide-y divide-slate-100">
            {filteredProblems.map((prob) => {
              const diffConfig = DIFFICULTY_CONFIG[prob.difficulty] || DIFFICULTY_CONFIG.Medium;
              const statConfig = STATUS_CONFIG[prob.status] || STATUS_CONFIG.todo;
              const StatusIcon = statConfig.icon;

              return (
                <li
                  key={prob.id}
                  id={`problem-row-${prob.id}`}
                  className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-2 sm:gap-3"
                >
                  {/* Left: Status Toggle Button & Problem Name */}
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    {/* Status Button: Cycles through todo -> in_progress -> completed -> revision */}
                    <button
                      id={`cycle-status-btn-${prob.id}`}
                      type="button"
                      onClick={() => handleCycleStatus(prob)}
                      disabled={togglingIds.has(prob.id)}
                      className={`inline-flex items-center justify-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border text-[11px] sm:text-xs font-medium transition-colors shrink-0 cursor-pointer ${statConfig.bg} ${statConfig.text} ${statConfig.border}`}
                      title={`Current status: ${statConfig.label}. Click to cycle: To Do → In Progress → Completed → Revision`}
                      aria-label={`Cycle status for ${prob.name}, currently ${statConfig.label}`}
                    >
                      {togglingIds.has(prob.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <StatusIcon className="w-3 h-3 shrink-0" />
                      )}
                      <span className="hidden sm:inline">{statConfig.label}</span>
                    </button>

                    {/* Problem Name & Squeezed Category Tag in single line */}
                    <div className="min-w-0 flex-1 flex items-center gap-1.5">
                      <span
                        className={`text-xs sm:text-sm font-medium truncate leading-tight ${
                          prob.status === 'completed'
                            ? 'text-slate-400 line-through'
                            : 'text-slate-900'
                        }`}
                        title={prob.name}
                      >
                        {prob.name}
                      </span>

                      {/* Contracted Category Tag */}
                      <span className="hidden md:inline-flex text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/80 shrink-0">
                        {prob.category}
                      </span>
                    </div>
                  </div>

                  {/* Right: Difficulty Badge, External Solve Link, and Delete in single line */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* Squeezed Difficulty Badge */}
                    <span
                      id={`difficulty-badge-${prob.id}`}
                      className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold border shrink-0 ${diffConfig.bg} ${diffConfig.text} ${diffConfig.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${diffConfig.dot} shrink-0`} />
                      <span className="hidden sm:inline">{prob.difficulty}</span>
                      <span className="sm:hidden">{prob.difficulty.charAt(0)}</span>
                    </span>

                    {/* External Link Button */}
                    {prob.link && (
                      <a
                        id={`problem-external-link-${prob.id}`}
                        href={prob.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 sm:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors shrink-0"
                        title="Open problem in new tab"
                        aria-label={`Solve ${prob.name} on external site`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Delete button */}
                    {prob.isOwner && (
                      <button
                        id={`delete-problem-btn-${prob.id}`}
                        type="button"
                        onClick={() => setProblemToDelete(prob)}
                        className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
                        title="Delete problem"
                        aria-label={`Delete problem "${prob.name}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : hasActiveFilters ? (
          /* Zero results matching filters with clear filters button */
          <div id="no-problems-match-filters" className="py-10 px-4 text-center max-w-sm mx-auto">
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-lg w-fit mx-auto mb-2.5">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-900">No problems match these filters</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try adjusting your search query, difficulty, category, or status tab.
            </p>
            <button
              id="reset-filters-btn"
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all filters</span>
            </button>
          </div>
        ) : (
          /* Empty repository state */
          <div id="empty-repository-state" className="py-10 px-4 text-center max-w-sm mx-auto">
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg w-fit mx-auto mb-2.5">
              <Code className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-900">No coding problems added yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Use the "Add Problem" button above to add your first LeetCode or DSA practice problem.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add your first problem</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Delete Problem */}
      <ConfirmModal
        isOpen={!!problemToDelete}
        title="Delete Problem"
        message={
          problemToDelete
            ? `Delete this problem? This can't be undone. "${problemToDelete.name}" will be removed from your repository.`
            : ''
        }
        confirmLabel="Delete Problem"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteProblem}
        onCancel={() => setProblemToDelete(null)}
      />
    </div>
  );
}
