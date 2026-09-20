import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader2, Globe, UserCheck, ArrowRight, Trash2 } from 'lucide-react';
import { SubjectSummary } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

interface SubjectsHubProps {
  onSelectSubject: (subjectId: string) => void;
}

export function SubjectsHub({ onSelectSubject }: SubjectsHubProps) {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubjects = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/subjects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a subject name');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (res.ok) {
        const created: SubjectSummary = await res.json();
        setSubjects((prev) => [...prev, created]);
        setNewSubjectName('');
        setIsAdding(false);
        // Automatically take user into their new subject detail page
        onSelectSubject(created.id);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || 'Failed to create subject');
      }
    } catch {
      setErrorMsg('Network error creating subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${subjectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSubjects((prev) => prev.filter((s) => s.id !== subjectToDelete.id));
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    } finally {
      setIsDeleting(false);
      setSubjectToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading subjects...</p>
      </div>
    );
  }

  return (
    <div id="subjects-hub-container" className="w-full space-y-6">
      {/* Header with Add Subject action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <div>
          <h1 id="subjects-hub-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Subjects & Curriculum
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select a subject to view topic checklists, lecture links, and session trackers.
          </p>
        </div>

        <div>
          {!isAdding ? (
            <button
              id="open-add-subject-btn"
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setErrorMsg('');
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Small Inline Form to Add a New Subject (Name Only) */}
      {isAdding && (
        <form
          id="add-subject-form"
          onSubmit={handleAddSubject}
          className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="w-full flex-1">
            <input
              id="new-subject-name-input"
              type="text"
              autoFocus
              placeholder="e.g. Operating Systems, Computer Networks, Linear Algebra"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
            />
            {errorMsg && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errorMsg}</p>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              id="submit-new-subject-btn"
              type="submit"
              disabled={isSubmitting || !newSubjectName.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Create Subject</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid of Subject Cards */}
      {subjects.length > 0 ? (
        <div
          id="subjects-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
        >
          {subjects.map((subj) => (
            <div
              key={subj.id}
              id={`subject-card-${subj.id}`}
              onClick={() => onSelectSubject(subj.id)}
              className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {subj.isGlobal ? (
                      <>
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>Curriculum Core</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3 text-slate-500" />
                        <span>Custom Subject</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1">
                    {subj.isOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubjectToDelete(subj);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete subject"
                        aria-label={`Delete subject "${subj.name}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-900 transition-colors inline-flex items-center gap-1">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {subj.name}
                </h2>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-slate-700">
                    {subj.completedTopics} / {subj.totalTopics} done
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      subj.percent === 100
                        ? 'bg-emerald-600'
                        : subj.percent > 0
                        ? 'bg-blue-600'
                        : 'bg-slate-200'
                    }`}
                    style={{ width: `${subj.percent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Zero State Notice */
        <div
          id="subjects-empty-state"
          className="bg-white rounded-xl border border-dashed border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto"
        >
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">No subjects yet</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5 max-w-xs">
            Add your first subject to start organizing topics, recording video links, and tracking completion.
          </p>
          <button
            id="empty-state-add-subject-btn"
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add your first subject</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal: Delete Subject */}
      <ConfirmModal
        isOpen={!!subjectToDelete}
        title="Delete Subject"
        message={
          subjectToDelete
            ? `Delete this subject? This can't be undone. All topic checklists and study progress inside "${subjectToDelete.name}" will be permanently removed.`
            : ''
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Subject'}
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteSubject}
        onCancel={() => setSubjectToDelete(null)}
      />
    </div>
  );
}
