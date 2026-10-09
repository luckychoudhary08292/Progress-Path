import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  Calendar,
  Clock,
  Loader2,
  Mail,
  Filter,
} from 'lucide-react';
import { FeedbackItem } from '../../types.ts';

interface AdminFeedbackSectionProps {
  feedbacks: FeedbackItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteFeedback: (id: string) => Promise<boolean>;
}

export const AdminFeedbackSection: React.FC<AdminFeedbackSectionProps> = ({
  feedbacks,
  isLoading,
  onRefresh,
  onDeleteFeedback,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        fb.userName.toLowerCase().includes(q) ||
        fb.userEmail.toLowerCase().includes(q) ||
        fb.title.toLowerCase().includes(q) ||
        fb.description.toLowerCase().includes(q)
      );
    });
  }, [feedbacks, searchQuery]);

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
    <div id="admin-feedback-section" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  User Feedbacks & Suggestions
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                  {feedbacks.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review all feedback submitted by students and scholars across ProgressPath.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            id="admin-refresh-feedbacks-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Message Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in duration-200 ${
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="admin-search-feedback-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback by student name, email, title, or keywords..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg bg-slate-100 cursor-pointer self-start sm:self-auto"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Feedbacks List Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading && feedbacks.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs font-medium">Loading feedback submissions...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {searchQuery ? 'No matching feedbacks found' : 'No feedbacks submitted yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No submissions matched "${searchQuery}". Try searching with different terms.`
                : 'When users submit feedback or feature requests from their profile page, they will appear here with full details.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFeedbacks.map((fb) => {
              const isConfirming = deleteConfirmId === fb.id;
              const isDeleting = deletingId === fb.id;

              return (
                <div
                  key={fb.id}
                  id={`admin-feedback-item-${fb.id}`}
                  className="p-4 sm:p-6 hover:bg-slate-50/60 transition-colors"
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
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(fb.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Action Button */}
                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-start">
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                          <span className="text-[11px] text-rose-700 font-semibold mr-1">
                            Confirm delete?
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
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer border border-rose-100"
                          title="Delete this feedback"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="mt-3 sm:mt-4 pl-0 sm:pl-13">
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
