import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Trash2,
  Plus,
  Loader2,
  FileText,
  Video,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SubjectDetail as ISubjectDetail, LectureItem } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

interface SubjectDetailProps {
  subjectId: string;
  onBack: () => void;
}

export function SubjectDetail({ subjectId, onBack }: SubjectDetailProps) {
  const [data, setData] = useState<ISubjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for adding topic
  const [topicTitle, setTopicTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [topicError, setTopicError] = useState('');

  // Editing notes state: mapping lectureId -> notes
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [openNotesId, setOpenNotesId] = useState<string | null>(null);
  const [togglingLectureId, setTogglingLectureId] = useState<string | null>(null);

  // Delete confirmations
  const [lectureToDelete, setLectureToDelete] = useState<{ id: string; title: string; session: number } | null>(null);
  const [isConfirmingDeleteSubject, setIsConfirmingDeleteSubject] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);

  // Search & Filter states for lectures list
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [hasVideoOnly, setHasVideoOnly] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Debounce search input (250ms) to ensure smooth, stutter-free filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchSubjectDetail = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const detail: ISubjectDetail = await res.json();
        setData(detail);
        // Initialize notes dictionary
        const notesMap: Record<string, string> = {};
        for (const lec of detail.lectures) {
          notesMap[lec.id] = lec.notes || '';
        }
        setNotesState(notesMap);
      }
    } catch (err) {
      console.error('Failed to load subject detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectDetail();
  }, [subjectId]);

  // Toggle lecture completed status with instantaneous live count update
  const handleToggleLecture = async (lecture: LectureItem) => {
    const token = localStorage.getItem('auth_token');
    if (!token || togglingLectureId) return;

    setTogglingLectureId(lecture.id);

    const newCompleted = !lecture.completed;

    // Instant optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const updatedLectures = prev.lectures.map((l) =>
        l.id === lecture.id ? { ...l, completed: newCompleted } : l
      );
      const newCompletedCount = updatedLectures.filter((l) => l.completed).length;
      return {
        ...prev,
        lectures: updatedLectures,
        completedTopics: newCompletedCount,
      };
    });

    try {
      const res = await fetch(`/api/subjects/${subjectId}/lectures/${lecture.id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: newCompleted,
          notes: notesState[lecture.id] || '',
        }),
      });

      if (!res.ok) {
        // Revert on error
        fetchSubjectDetail();
      } else {
        const result = await res.json();
        setData((prev) => {
          if (!prev) return prev;
          const updatedLectures = prev.lectures.map((l) =>
            l.id === lecture.id ? { ...l, completed: !!result.completed } : l
          );
          const newCompletedCount = updatedLectures.filter((l) => l.completed).length;
          return {
            ...prev,
            lectures: updatedLectures,
            completedTopics: newCompletedCount,
          };
        });
      }
    } catch {
      fetchSubjectDetail();
    } finally {
      setTogglingLectureId(null);
    }
  };

  // Save notes on blur
  const handleSaveNotes = async (lectureId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const currentNotes = notesState[lectureId] || '';
    try {
      await fetch(`/api/subjects/${subjectId}/lectures/${lectureId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: currentNotes }),
      });
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  // Add new topic using subject's sequential nextSessionNumber
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = topicTitle.trim();
    if (!trimmedTitle) {
      setTopicError('Topic title is required');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setIsSubmittingTopic(true);
    setTopicError('');

    try {
      const res = await fetch(`/api/subjects/${subjectId}/lectures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          videoUrl: videoUrl.trim(),
        }),
      });

      if (res.ok) {
        const createdLecture: LectureItem = await res.json();
        // Append sequentially maintaining sorted order by session
        setData((prev) => {
          if (!prev) return prev;
          const newLectures = [...prev.lectures, createdLecture].sort(
            (a, b) => a.session - b.session
          );
          return {
            ...prev,
            lectures: newLectures,
            totalTopics: newLectures.length,
          };
        });

        setTopicTitle('');
        setVideoUrl('');
      } else {
        const err = await res.json();
        setTopicError(err.message || 'Failed to create topic');
      }
    } catch {
      setTopicError('Network error creating topic');
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  // Delete lecture with confirmation prompt modal
  // CRITICAL: NEVER renumbers the remaining lectures! #4 stays #4, #6 stays #6.
  const handleConfirmDeleteLecture = async () => {
    if (!lectureToDelete) return;
    const lectureId = lectureToDelete.id;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/subjects/${subjectId}/lectures/${lectureId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          const filtered = prev.lectures.filter((l) => l.id !== lectureId);
          const newCompletedCount = filtered.filter((l) => l.completed).length;
          return {
            ...prev,
            lectures: filtered,
            totalTopics: filtered.length,
            completedTopics: newCompletedCount,
          };
        });
      }
    } catch (err) {
      console.error('Failed to delete lecture:', err);
    } finally {
      setLectureToDelete(null);
    }
  };

  // Delete entire subject (only if owner or admin)
  const handleConfirmDeleteSubject = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setIsDeletingSubject(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setIsConfirmingDeleteSubject(false);
        onBack();
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    } finally {
      setIsDeletingSubject(false);
    }
  };

  // Filtered lectures based on search query (matches title or notes), status, and video attachment
  const filteredLectures = useMemo(() => {
    if (!data?.lectures) return [];
    const query = debouncedSearch.toLowerCase().trim();

    return data.lectures.filter((lec) => {
      // Search matches title or notes text
      if (query) {
        const titleMatch = lec.title.toLowerCase().includes(query);
        const currentNotes = (notesState[lec.id] ?? lec.notes ?? '').toLowerCase();
        const notesMatch = currentNotes.includes(query);
        if (!titleMatch && !notesMatch) return false;
      }

      // Status filter
      if (statusFilter === 'completed' && !lec.completed) return false;
      if (statusFilter === 'pending' && lec.completed) return false;

      // Has video only toggle
      if (hasVideoOnly && (!lec.videoUrl || !lec.videoUrl.trim())) return false;

      return true;
    });
  }, [data?.lectures, debouncedSearch, statusFilter, hasVideoOnly, notesState]);

  const activePanelFilterCount =
    (statusFilter !== 'all' ? 1 : 0) + (hasVideoOnly ? 1 : 0);

  const hasAnyFilterActive =
    searchInput.trim() !== '' || statusFilter !== 'all' || hasVideoOnly;

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setHasVideoOnly(false);
  };

  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading topic checklist...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full py-16 text-center">
        <p className="text-slate-500 text-sm">Subject not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200"
        >
          Back to subjects
        </button>
      </div>
    );
  }

  const { subject, lectures, totalTopics, completedTopics } = data;
  const percent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div id="subject-detail-container" className="w-full space-y-6">
      {/* Top Header Card with Back Button and Live Counter */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            id="back-to-subjects-btn"
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Return to subjects list"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Subjects</span>
          </button>

          {subject.isOwner && (
            <button
              id="delete-subject-btn"
              type="button"
              onClick={() => setIsConfirmingDeleteSubject(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Delete this subject and all its topics"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Subject</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 id="subject-name-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {subject.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Sequential session checklist with independent completion tracking.
            </p>
          </div>

          {/* Live Progress Counter */}
          <div className="flex flex-col sm:items-end shrink-0">
            <span
              id="live-progress-counter"
              className="text-base sm:text-lg font-bold text-slate-900"
            >
              {completedTopics} / {totalTopics} completed
            </span>
            <span className="text-xs text-slate-500 mt-0.5">
              {percent}% ready
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              percent === 100 ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Small, Unobtrusive Form to Add a New Topic to this Subject */}
      <form
        id="add-topic-form"
        onSubmit={handleAddTopic}
        className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
          <input
            id="topic-title-input"
            type="text"
            placeholder="New topic title (e.g. Memory Management, CPU Scheduling)"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
          />

          <input
            id="topic-video-url-input"
            type="url"
            placeholder="Optional video link (YouTube, drive...)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
          />
        </div>

        <button
          id="submit-add-topic-btn"
          type="submit"
          disabled={isSubmittingTopic || !topicTitle.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
        >
          {isSubmittingTopic ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>Add Topic</span>
        </button>

        {topicError && (
          <p className="text-xs text-rose-600 font-medium sm:col-span-2">{topicError}</p>
        )}
      </form>

      {/* Search & Filter Toolbar for Lectures */}
      <div id="lectures-filter-toolbar" className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search input with live debouncing and clear icon */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="lecture-search-input"
              type="text"
              placeholder="Search topics by title or notes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400"
            />
            {searchInput && (
              <button
                id="clear-lecture-search-btn"
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
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
            id="lectures-filter-btn"
            type="button"
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isFilterPanelOpen || activePanelFilterCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            aria-expanded={isFilterPanelOpen}
            aria-label="Filter topics"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activePanelFilterCount > 0 && (
              <span
                id="active-lecture-filter-count-badge"
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

        {/* Expandable Filter Panel (works on desktop and mobile) */}
        {isFilterPanelOpen && (
          <div
            id="lectures-filter-panel"
            className="pt-3 border-t border-slate-100 space-y-3.5 animate-in fade-in duration-150"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Topic Status
                </label>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'pending', label: 'Pending' },
                    ] as const
                  ).map((opt) => {
                    const isSelected = statusFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        id={`filter-status-${opt.id}-btn`}
                        type="button"
                        onClick={() => setStatusFilter(opt.id)}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer text-center ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Video Content Filter Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Media / Video
                </label>
                <label
                  id="filter-video-toggle-label"
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                    hasVideoOnly
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Video className={`w-3.5 h-3.5 ${hasVideoOnly ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Has video lecture only</span>
                  </span>
                  <input
                    id="filter-video-checkbox"
                    type="checkbox"
                    checked={hasVideoOnly}
                    onChange={(e) => setHasVideoOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Filter Panel Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                {activePanelFilterCount > 0 ? `${activePanelFilterCount} filter${activePanelFilterCount > 1 ? 's' : ''} applied` : 'No panel filters applied'}
              </span>
              <div className="flex items-center gap-2">
                {activePanelFilterCount > 0 && (
                  <button
                    id="reset-panel-filters-btn"
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setHasVideoOnly(false);
                    }}
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

        {/* Live Result Count & Visible Clear Filters Bar (when any search or filter is active) */}
        {hasAnyFilterActive && (
          <div
            id="lecture-results-status-bar"
            className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100"
          >
            <span>
              Showing <strong>{filteredLectures.length}</strong> of{' '}
              <strong>{lectures.length}</strong> topics
            </span>
            <button
              id="clear-all-lecture-filters-btn"
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

      {/* Topics Checklist Table / Rows */}
      <div id="topics-list-container" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredLectures.length > 0 ? (
          <ul id="lectures-checklist" className="divide-y divide-slate-100">
            {filteredLectures.map((lec) => {
              const isNotesOpen = openNotesId === lec.id;
              const currentNotes = notesState[lec.id] || '';

              return (
                <li
                  key={lec.id}
                  id={`lecture-row-${lec.id}`}
                  className={`p-3 sm:p-3.5 transition-colors ${
                    lec.completed ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        id={`checkbox-lecture-${lec.id}`}
                        type="button"
                        onClick={() => handleToggleLecture(lec)}
                        disabled={togglingLectureId === lec.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 focus:outline-none cursor-pointer transition-colors shrink-0"
                        aria-label={`Mark #${lec.session} ${lec.title} as ${
                          lec.completed ? 'incomplete' : 'complete'
                        }`}
                      >
                        {lec.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>

                      {/* Session Number Badge */}
                      <span
                        id={`session-badge-${lec.id}`}
                        className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded shrink-0 ${
                          lec.completed
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        #{lec.session}
                      </span>

                      {/* Topic Title */}
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-medium block transition-colors truncate ${
                            lec.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {lec.title}
                        </span>
                      </div>
                    </div>

                    {/* Right Action Icons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Optional Video Link */}
                      {lec.videoUrl && (
                        <a
                          id={`video-link-${lec.id}`}
                          href={lec.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs"
                          title="Watch video lecture"
                        >
                          <Video className="w-3.5 h-3.5 text-blue-600" />
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}

                      {/* Notes Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setOpenNotesId(isNotesOpen ? null : lec.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          currentNotes
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title={currentNotes ? 'Edit notes' : 'Add notes'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      {lec.isOwner && (
                        <button
                          id={`delete-lecture-btn-${lec.id}`}
                          type="button"
                          onClick={() =>
                            setLectureToDelete({
                              id: lec.id,
                              title: lec.title,
                              session: lec.session,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete topic"
                          aria-label={`Delete topic session #${lec.session}: ${lec.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Notes Section */}
                  {isNotesOpen && (
                    <div className="mt-3 pl-11 pr-2">
                      <textarea
                        id={`notes-input-${lec.id}`}
                        rows={2}
                        placeholder="Add your study notes, key definitions, or formulas..."
                        value={notesState[lec.id] || ''}
                        onChange={(e) =>
                          setNotesState({ ...notesState, [lec.id]: e.target.value })
                        }
                        onBlur={() => handleSaveNotes(lec.id)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Notes are automatically saved when you click away.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : lectures.length > 0 && hasAnyFilterActive ? (
          /* Zero results matching search/filter */
          <div id="no-lectures-match-filters" className="py-12 px-4 text-center max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No matching topics found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              No topics match your current search "{debouncedSearch || searchInput}" or active filter criteria.
            </p>
            <button
              id="zero-state-clear-lecture-filters-btn"
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear all filters</span>
            </button>
          </div>
        ) : (
          <div id="no-topics-placeholder" className="py-12 text-center text-slate-400">
            <p className="text-sm font-medium text-slate-600">No topics added to this subject yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Use the form above to add your first lecture session.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Delete Topic / Lecture */}
      <ConfirmModal
        isOpen={!!lectureToDelete}
        title="Delete Topic"
        message={
          lectureToDelete
            ? `Delete topic #${lectureToDelete.session} "${lectureToDelete.title}"? This can't be undone. Existing session sequence numbers will be preserved.`
            : ''
        }
        confirmLabel="Delete Topic"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteLecture}
        onCancel={() => setLectureToDelete(null)}
      />

      {/* Confirmation Modal: Delete Entire Subject */}
      <ConfirmModal
        isOpen={isConfirmingDeleteSubject}
        title="Delete Subject"
        message={`Delete this subject? This can't be undone. All topic checklists and study progress inside "${subject.name}" will be permanently removed.`}
        confirmLabel={isDeletingSubject ? 'Deleting...' : 'Delete Subject'}
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteSubject}
        onCancel={() => setIsConfirmingDeleteSubject(false)}
      />
    </div>
  );
}
