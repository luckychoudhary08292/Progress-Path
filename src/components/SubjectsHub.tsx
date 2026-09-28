import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader2, Globe, UserCheck, ArrowRight, Trash2, X } from 'lucide-react';
import { SubjectSummary } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

interface SubjectsHubProps {
  onSelectSubject: (subjectId: string) => void;
}

export function SubjectsHub({ onSelectSubject }: SubjectsHubProps) {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<'subject' | 'lecture'>('subject');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [initialLectureTitle, setInitialLectureTitle] = useState('');
  const [initialVideoUrl, setInitialVideoUrl] = useState('');
  const [selectedSubjectIdForLecture, setSelectedSubjectIdForLecture] = useState('');
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

  const handleAddSubjectAndLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    if (addMode === 'subject') {
      const trimmed = newSubjectName.trim();
      if (!trimmed) {
        setErrorMsg('Please enter a subject name');
        return;
      }

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

        if (!res.ok) {
          const errData = await res.json();
          setErrorMsg(errData.message || 'Failed to create subject');
          setIsSubmitting(false);
          return;
        }

        const created: SubjectSummary = await res.json();
        setSubjects((prev) => [...prev, created]);

        // If an initial lecture title is provided, create it as well
        if (initialLectureTitle.trim()) {
          try {
            await fetch(`/api/subjects/${created.id}/lectures`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: initialLectureTitle.trim(),
                videoUrl: initialVideoUrl.trim(),
              }),
            });
          } catch (lecErr) {
            console.error('Failed to create initial lecture:', lecErr);
          }
        }

        setNewSubjectName('');
        setInitialLectureTitle('');
        setInitialVideoUrl('');
        setIsAdding(false);
        // Automatically take user into their new subject detail page
        onSelectSubject(created.id);
      } catch {
        setErrorMsg('Network error creating subject');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Add lecture to an existing subject
      const targetId = selectedSubjectIdForLecture || (subjects[0]?.id ?? '');
      if (!targetId) {
        setErrorMsg('Please select a subject');
        return;
      }
      if (!initialLectureTitle.trim()) {
        setErrorMsg('Please enter a lecture title');
        return;
      }

      setIsSubmitting(true);
      setErrorMsg('');

      try {
        const res = await fetch(`/api/subjects/${targetId}/lectures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: initialLectureTitle.trim(),
            videoUrl: initialVideoUrl.trim(),
          }),
        });

        if (res.ok) {
          setInitialLectureTitle('');
          setInitialVideoUrl('');
          setIsAdding(false);
          // Navigate to target subject
          onSelectSubject(targetId);
        } else {
          const errData = await res.json();
          setErrorMsg(errData.message || 'Failed to add lecture');
        }
      } catch {
        setErrorMsg('Network error adding lecture');
      } finally {
        setIsSubmitting(false);
      }
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
      <div className="flex items-center justify-between gap-3 bg-transparent sm:bg-white border-0 sm:border border-slate-200 p-0 sm:p-6 rounded-none sm:rounded-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="sm:hidden w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 id="subjects-hub-title" className="text-sm sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
              Subject & Curriculum
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
              Select a subject to view topic checklists, lecture links, and session trackers.
            </p>
          </div>
        </div>

        <div>
          {/* Mobile + Icon Button */}
          <button
            id="open-add-subject-btn-mobile"
            type="button"
            onClick={() => {
              setErrorMsg('');
              setIsAdding(true);
            }}
            className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
            aria-label="Add Subject"
            title="Add Subject"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Desktop Button */}
          <button
            id="open-add-subject-btn"
            type="button"
            onClick={() => {
              setErrorMsg('');
              setIsAdding(true);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Popup UI Modal for Adding Subject and Lectures */}
      {isAdding && (
        <div
          id="add-subject-lecture-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4 transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-modal-heading"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAdding(false);
              setErrorMsg('');
            }
          }}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border-t sm:border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 id="add-modal-heading" className="text-sm font-bold text-slate-900 leading-tight">
                    {addMode === 'subject' ? 'Add Subject' : 'Add Lecture'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {addMode === 'subject'
                      ? 'Add subject with curriculum lectures'
                      : 'Add video lecture to an existing subject'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-add-modal-btn"
                onClick={() => {
                  setIsAdding(false);
                  setErrorMsg('');
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            {subjects.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAddMode('subject');
                    setErrorMsg('');
                  }}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    addMode === 'subject'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Subject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddMode('lecture');
                    setErrorMsg('');
                    if (!selectedSubjectIdForLecture && subjects.length > 0) {
                      setSelectedSubjectIdForLecture(subjects[0].id);
                    }
                  }}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    addMode === 'lecture'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Add Lecture
                </button>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleAddSubjectAndLecture} className="space-y-3.5">
              {addMode === 'subject' ? (
                <>
                  <div>
                    <label htmlFor="new-subject-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="new-subject-name-input"
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g. Operating Systems, Computer Networks"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 transition-colors"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                      Initial Lecture / Video (Optional)
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label htmlFor="init-lecture-title" className="block text-[11px] font-medium text-slate-600 mb-1">
                          Lecture Title
                        </label>
                        <input
                          id="init-lecture-title"
                          type="text"
                          placeholder="e.g. Lecture 1: Architecture & Basics"
                          value={initialLectureTitle}
                          onChange={(e) => setInitialLectureTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="init-lecture-url" className="block text-[11px] font-medium text-slate-600 mb-1">
                          Video URL (YouTube or Web)
                        </label>
                        <input
                          id="init-lecture-url"
                          type="url"
                          placeholder="https://youtube.com/watch?v=..."
                          value={initialVideoUrl}
                          onChange={(e) => setInitialVideoUrl(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="select-target-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Subject <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-target-subject"
                      value={selectedSubjectIdForLecture || (subjects[0]?.id ?? '')}
                      onChange={(e) => setSelectedSubjectIdForLecture(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.totalTopics} lectures)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="lecture-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Lecture Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="lecture-title-input"
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g. Memory Management & Paging"
                      value={initialLectureTitle}
                      onChange={(e) => setInitialLectureTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="lecture-url-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Video URL (Optional)
                    </label>
                    <input
                      id="lecture-url-input"
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={initialVideoUrl}
                      onChange={(e) => setInitialVideoUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                  </div>
                </>
              )}

              {errorMsg && (
                <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setErrorMsg('');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 active:scale-98 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-add-modal-btn"
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (addMode === 'subject' && !newSubjectName.trim()) ||
                    (addMode === 'lecture' && !initialLectureTitle.trim())
                  }
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{addMode === 'subject' ? 'Create Subject' : 'Add Lecture'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Subject Cards */}
      {subjects.length > 0 ? (
        <div
          id="subjects-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
        >
          {subjects.map((subj) => (
            <div
              key={subj.id}
              id={`subject-card-${subj.id}`}
              onClick={() => onSelectSubject(subj.id)}
              className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 sm:p-5 transition-colors cursor-pointer flex flex-col justify-between shadow-xs"
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
