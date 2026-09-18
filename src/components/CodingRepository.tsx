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
} from 'lucide-react';
import { ProblemItem, ProblemDifficulty, ProblemStatus } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

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
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | ProblemDifficulty>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | ProblemStatus>('all');
  const [sortBy, setSortBy] = useState<'default' | 'difficulty-asc' | 'difficulty-desc'>('default');

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
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
        setProblems(data.problems || []);
        setAvailableCategories(data.categories || []);
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
    if (!token || togglingId) return;

    setTogglingId(problem.id);
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
      }
    } catch {
      fetchProblems();
    } finally {
      setTogglingId(null);
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
      }
    } catch (err) {
      console.error('Failed to delete problem:', err);
    } finally {
      setProblemToDelete(null);
    }
  };

  // Combined instant client-side filtering without reloading
  const filteredProblems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

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
  }, [problems, searchQuery, selectedDifficulty, selectedCategory, selectedStatusTab, sortBy]);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const counts = { all: problems.length, todo: 0, in_progress: 0, completed: 0, revision: 0 };
    for (const p of problems) {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    }
    return counts;
  }, [problems]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedDifficulty !== 'All' ||
    selectedCategory !== 'All' ||
    selectedStatusTab !== 'all' ||
    sortBy !== 'default';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('All');
    setSelectedCategory('All');
    setSelectedStatusTab('all');
    setSortBy('default');
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading Coding Repository...</p>
      </div>
    );
  }

  return (
    <div id="coding-repository-container" className="w-full space-y-6">
      {/* Header Bar */}
      <header className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h1 id="coding-repo-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Coding Repository
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Track your DSA practice, categorized LeetCode problems, and revision queues.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="open-add-problem-btn"
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAdding ? 'Cancel' : 'Add Problem'}</span>
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

      {/* Controls Bar: Status Tabs, Search, Difficulty, Category Filter & Sorting */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3.5">
        {/* Status Tabs: All / To Do / In Progress / Revision / Completed */}
        <div id="status-tabs-bar" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
                id={`status-tab-${tab.id}`}
                type="button"
                onClick={() => setSelectedStatusTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Search Box: by name or category */}
          <div className="sm:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="problem-search-input"
              type="text"
              placeholder="Search by problem name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Difficulty Filter Dropdown */}
          <div className="sm:col-span-2">
            <select
              id="filter-difficulty-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer text-slate-700"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Category Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer text-slate-700"
            >
              <option value="All">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Explicit Sort Option: Default is strictly createdAt ascending */}
          <div className="sm:col-span-2">
            <select
              id="sort-problems-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer text-slate-700"
              title="Change sort order"
            >
              <option value="default">Sort: Default</option>
              <option value="difficulty-asc">Diff: Easy → Hard</option>
              <option value="difficulty-desc">Diff: Hard → Easy</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators / Clear All button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
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
                  className="p-3 sm:p-3.5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Problem Name, Difficulty, Category */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Status Button: Cycles through todo -> in_progress -> completed -> revision */}
                    <button
                      id={`cycle-status-btn-${prob.id}`}
                      type="button"
                      onClick={() => handleCycleStatus(prob)}
                      disabled={togglingId === prob.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors shrink-0 cursor-pointer ${statConfig.bg} ${statConfig.text} ${statConfig.border}`}
                      title={`Current status: ${statConfig.label}. Click to cycle: To Do → In Progress → Completed → Revision`}
                      aria-label={`Cycle status for ${prob.name}, currently ${statConfig.label}`}
                    >
                      {togglingId === prob.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <StatusIcon className="w-3 h-3 shrink-0" />
                      )}
                      <span>{statConfig.label}</span>
                    </button>

                    {/* Problem Name & Category Tag */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-medium truncate ${
                            prob.status === 'completed'
                              ? 'text-slate-400 line-through'
                              : 'text-slate-900'
                          }`}
                        >
                          {prob.name}
                        </span>

                        {/* Category Tag */}
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 shrink-0">
                          {prob.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Difficulty Badge, External Link, Delete Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Difficulty Badge */}
                    <span
                      id={`difficulty-badge-${prob.id}`}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${diffConfig.bg} ${diffConfig.text} ${diffConfig.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${diffConfig.dot}`} />
                      <span>{prob.difficulty}</span>
                    </span>

                    {/* External Link Button */}
                    {prob.link ? (
                      <a
                        id={`problem-external-link-${prob.id}`}
                        href={prob.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                        title="Open problem in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Solve</span>
                      </a>
                    ) : (
                      <span className="w-6" />
                    )}

                    {/* Delete button */}
                    {prob.isOwner && (
                      <button
                        id={`delete-problem-btn-${prob.id}`}
                        type="button"
                        onClick={() => setProblemToDelete(prob)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
