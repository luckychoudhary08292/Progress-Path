import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Loader2,
  Mail,
  Check,
} from 'lucide-react';
import { FeedbackItem } from '../../types.ts';
import { AdminFeedbackSkeleton } from '../Skeleton.tsx';

interface AdminFeedbackSectionProps {
  feedbacks: FeedbackItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteFeedback: (id: string) => Promise<boolean>;
}

export type FeedbackFilterTab = 'view' | 'unseen' | 'complete';

export const AdminFeedbackSection: React.FC<AdminFeedbackSectionProps> = ({
  feedbacks,
  isLoading,
  onRefresh,
  onDeleteFeedback,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FeedbackFilterTab>('view');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Status mapping for feedbacks: unseen, seen, complete
  const [statusMap, setStatusMap] = useState<Record<string, 'unseen' | 'complete'>>(() => {
    try {
      const saved = localStorage.getItem('admin_feedback_status_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save status mapping changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('admin_feedback_status_map', JSON.stringify(statusMap));
    } catch {
      // ignore
    }
  }, [statusMap]);

  // Compute status counts
  const { unseenCount, completeCount } = useMemo(() => {
    let unseen = 0;
    let complete = 0;
    feedbacks.forEach((fb) => {
      const st = statusMap[fb.id] || (fb.status === 'complete' ? 'complete' : 'unseen');
      if (st === 'complete') {
        complete++;
      } else {
        unseen++;
      }
    });
    return { unseenCount: unseen, completeCount: complete };
  }, [feedbacks, statusMap]);

  // Filtered feedbacks based on search and tab ('view', 'unseen', 'complete')
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      const st = statusMap[fb.id] || (fb.status === 'complete' ? 'complete' : 'unseen');

      // Filter by tab
      if (filterTab === 'unseen' && st !== 'unseen') return false;
      if (filterTab === 'complete' && st !== 'complete') return false;

      // Filter by search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        fb.userName.toLowerCase().includes(q) ||
        fb.userEmail.toLowerCase().includes(q) ||
        fb.title.toLowerCase().includes(q) ||
        fb.description.toLowerCase().includes(q)
      );
    });
  }, [feedbacks, statusMap, filterTab, searchQuery]);

  // Handle toggling status between unseen and complete
  const handleToggleStatus = async (id: string, newStatus: 'unseen' | 'complete') => {
    try {
      setUpdatingStatusId(id);
      setStatusMap((prev) => ({ ...prev, [id]: newStatus }));

      // Send status update to backend
      const token = localStorage.getItem('token');
      await fetch(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      setActionMessage({
        text: newStatus === 'complete' ? 'Marked as complete' : 'Marked as unseen',
        type: 'success',
      });
      setTimeout(() => setActionMessage(null), 2500);
    } catch (err: any) {
      console.warn('Status update API call failed:', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const success = await onDeleteFeedback(id);
      if (success) {
        setActionMessage({ text: 'Feedback deleted successfully', type: 'success' });
        setDeleteConfirmId(null);
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err: any) {
      setActionMessage({
        text: err?.message || 'Failed to delete feedback',
        type: 'error',
      });
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div id="admin-feedback-section" className="space-y-4">
      {/* Top Header: Unboxed, clean title + small refresh button on the right */}
      <div className="flex items-center justify-between gap-4 pt-1 pb-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            User Feedbacks
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {feedbacks.length}
          </span>
        </div>

        <button
          type="button"
          id="admin-refresh-feedbacks-btn"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh feedbacks"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Message Alert */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar: Reduced Search Bar width + Filter: View, Unseen, Complete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Reduced width Search Bar */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="admin-search-feedback-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback..."
            className="w-full pl-9 pr-7 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter View, Unseen, Complete */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            id="feedback-filter-view"
            onClick={() => setFilterTab('view')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'view'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>View</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700">
              {feedbacks.length}
            </span>
          </button>

          <button
            type="button"
            id="feedback-filter-unseen"
            onClick={() => setFilterTab('unseen')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'unseen'
                ? 'bg-white text-amber-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Unseen</span>
            {unseenCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {unseenCount}
              </span>
            )}
          </button>

          <button
            type="button"
            id="feedback-filter-complete"
            onClick={() => setFilterTab('complete')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'complete'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Complete</span>
            {completeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {completeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Feedbacks List Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading && feedbacks.length === 0 ? (
          <AdminFeedbackSkeleton />
        ) : filteredFeedbacks.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {searchQuery
                ? 'No matching feedbacks found'
                : filterTab === 'complete'
                ? 'No completed feedbacks'
                : filterTab === 'unseen'
                ? 'No unseen feedbacks'
                : 'No feedbacks submitted yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No submissions matched "${searchQuery}". Try searching with different terms.`
                : filterTab === 'complete'
                ? 'Mark feedback submissions as complete to organize them here.'
                : filterTab === 'unseen'
                ? 'All current feedback items have been reviewed or marked complete.'
                : 'When users submit feedback or feature requests from their profile page, they will appear here with full details.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFeedbacks.map((fb) => {
              const isConfirming = deleteConfirmId === fb.id;
              const isDeleting = deletingId === fb.id;
              const isUpdatingStatus = updatingStatusId === fb.id;
              const currentStatus =
                statusMap[fb.id] || (fb.status === 'complete' ? 'complete' : 'unseen');
              const isComplete = currentStatus === 'complete';

              return (
                <div
                  key={fb.id}
                  id={`admin-feedback-item-${fb.id}`}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    {/* User and Header Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 shadow-2xs">
                        {getInitials(fb.userName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {fb.userName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{fb.userEmail}</span>
                          </span>

                          {/* Status Pill */}
                          {isComplete ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Complete</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Unseen</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(fb.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle & Delete Actions */}
                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-start">
                      {/* Mark Complete / Unseen Toggle */}
                      <button
                        type="button"
                        id={`toggle-feedback-status-${fb.id}`}
                        onClick={() =>
                          handleToggleStatus(fb.id, isComplete ? 'unseen' : 'complete')
                        }
                        disabled={isUpdatingStatus}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                          isComplete
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                        title={isComplete ? 'Mark as unseen' : 'Mark as complete'}
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isComplete ? (
                          <span>Mark Unseen</span>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Mark Complete</span>
                          </>
                        )}
                      </button>

                      {/* Delete Button */}
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                          <span className="text-[11px] text-rose-700 font-semibold mr-1">
                            Delete?
                          </span>
                          <button
                            type="button"
                            id={`confirm-delete-feedback-${fb.id}`}
                            onClick={() => handleDelete(fb.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Delete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={isDeleting}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`delete-feedback-btn-${fb.id}`}
                          onClick={() => setDeleteConfirmId(fb.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer border border-rose-100"
                          title="Delete this feedback"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="mt-2.5 sm:mt-3 pl-0 sm:pl-13">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {fb.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mt-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      {fb.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
