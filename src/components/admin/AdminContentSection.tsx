import React, { useState, useMemo } from 'react';
import {
  Layers,
  BookOpen,
  Video,
  Code2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Loader2,
  Check,
  AlertTriangle,
  X,
  FileText,
  Filter,
} from 'lucide-react';
import {
  GlobalSubjectItem,
  GlobalLectureItem,
  GlobalProblemItem,
  ProblemDifficulty,
} from '../../types.ts';

interface AdminContentSectionProps {
  subjects: GlobalSubjectItem[];
  lectures: GlobalLectureItem[];
  problems: GlobalProblemItem[];
  isLoading: boolean;
  onRefresh: () => void;
  // Subject operations
  onCreateSubject: (name: string) => Promise<boolean>;
  onUpdateSubject: (id: string, name: string) => Promise<boolean>;
  onDeleteSubject: (id: string) => Promise<boolean>;
  // Lecture operations
  onCreateLecture: (
    subjectId: string,
    title: string,
    session?: number,
    videoUrl?: string
  ) => Promise<boolean>;
  onUpdateLecture: (
    id: string,
    data: { title?: string; session?: number; videoUrl?: string }
  ) => Promise<boolean>;
  onDeleteLecture: (id: string) => Promise<boolean>;
  // Problem operations
  onCreateProblem: (
    name: string,
    difficulty: ProblemDifficulty,
    category: string,
    link?: string
  ) => Promise<boolean>;
  onUpdateProblem: (
    id: string,
    data: { name?: string; difficulty?: ProblemDifficulty; category?: string; link?: string }
  ) => Promise<boolean>;
  onDeleteProblem: (id: string) => Promise<boolean>;
}

type ContentSubTab = 'subjects' | 'lectures' | 'problems';

export const AdminContentSection: React.FC<AdminContentSectionProps> = ({
  subjects,
  lectures,
  problems,
  isLoading,
  onRefresh,
  onCreateSubject,
  onUpdateSubject,
  onDeleteSubject,
  onCreateLecture,
  onUpdateLecture,
  onDeleteLecture,
  onCreateProblem,
  onUpdateProblem,
  onDeleteProblem,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ContentSubTab>('subjects');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Modals & Action States
  const [modalState, setModalState] = useState<{
    type: 'subject_create' | 'subject_edit' | 'lecture_create' | 'lecture_edit' | 'problem_create' | 'problem_edit';
    data?: any;
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'subject' | 'lecture' | 'problem';
    id: string;
    title: string;
    warning?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [subjectName, setSubjectName] = useState('');
  const [lectureSubjectId, setLectureSubjectId] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureSession, setLectureSession] = useState<number | ''>('');
  const [lectureVideoUrl, setLectureVideoUrl] = useState('');

  const [problemName, setProblemName] = useState('');
  const [problemDifficulty, setProblemDifficulty] = useState<ProblemDifficulty>('Easy');
  const [problemCategory, setProblemCategory] = useState('');
  const [problemLink, setProblemLink] = useState('');

  // Open Subject Modal
  const openSubjectCreate = () => {
    setSubjectName('');
    setFormError('');
    setModalState({ type: 'subject_create' });
  };

  const openSubjectEdit = (sub: GlobalSubjectItem) => {
    setSubjectName(sub.name);
    setFormError('');
    setModalState({ type: 'subject_edit', data: sub });
  };

  // Open Lecture Modal
  const openLectureCreate = (preselectedSubjectId?: string) => {
    const defaultSub = preselectedSubjectId || (subjects[0] ? subjects[0].id : '');
    setLectureSubjectId(defaultSub);
    setLectureTitle('');
    setLectureSession('');
    setLectureVideoUrl('');
    setFormError('');
    setModalState({ type: 'lecture_create' });
  };

  const openLectureEdit = (lec: GlobalLectureItem) => {
    setLectureSubjectId(lec.subjectId);
    setLectureTitle(lec.title);
    setLectureSession(lec.session);
    setLectureVideoUrl(lec.videoUrl || '');
    setFormError('');
    setModalState({ type: 'lecture_edit', data: lec });
  };

  // Open Problem Modal
  const openProblemCreate = () => {
    setProblemName('');
    setProblemDifficulty('Easy');
    setProblemCategory('');
    setProblemLink('');
    setFormError('');
    setModalState({ type: 'problem_create' });
  };

  const openProblemEdit = (prob: GlobalProblemItem) => {
    setProblemName(prob.name);
    setProblemDifficulty(prob.difficulty);
    setProblemCategory(prob.category);
    setProblemLink(prob.link || '');
    setFormError('');
    setModalState({ type: 'problem_edit', data: prob });
  };

  // Handle Form Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalState) return;

    setFormError('');
    setIsSubmitting(true);

    try {
      if (modalState.type === 'subject_create') {
        if (!subjectName.trim()) {
          setFormError('Subject name is required');
          setIsSubmitting(false);
          return;
        }
        const success = await onCreateSubject(subjectName.trim());
        if (success) setModalState(null);
      } else if (modalState.type === 'subject_edit') {
        if (!subjectName.trim()) {
          setFormError('Subject name is required');
          setIsSubmitting(false);
          return;
        }
        const success = await onUpdateSubject(modalState.data.id, subjectName.trim());
        if (success) setModalState(null);
      } else if (modalState.type === 'lecture_create') {
        if (!lectureSubjectId) {
          setFormError('Please select a parent subject');
          setIsSubmitting(false);
          return;
        }
        if (!lectureTitle.trim()) {
          setFormError('Lecture title is required');
          setIsSubmitting(false);
          return;
        }
        const success = await onCreateLecture(
          lectureSubjectId,
          lectureTitle.trim(),
          typeof lectureSession === 'number' ? lectureSession : undefined,
          lectureVideoUrl.trim()
        );
        if (success) setModalState(null);
      } else if (modalState.type === 'lecture_edit') {
        if (!lectureTitle.trim()) {
          setFormError('Lecture title is required');
          setIsSubmitting(false);
          return;
        }
        const success = await onUpdateLecture(modalState.data.id, {
          title: lectureTitle.trim(),
          session: typeof lectureSession === 'number' ? lectureSession : undefined,
          videoUrl: lectureVideoUrl.trim(),
        });
        if (success) setModalState(null);
      } else if (modalState.type === 'problem_create') {
        if (!problemName.trim()) {
          setFormError('Problem title is required');
          setIsSubmitting(false);
          return;
        }
        const success = await onCreateProblem(
          problemName.trim(),
          problemDifficulty,
          problemCategory.trim() || 'General',
          problemLink.trim()
        );
        if (success) setModalState(null);
      } else if (modalState.type === 'problem_edit') {
        if (!problemName.trim()) {
          setFormError('Problem title is required');
          setIsSubmitting(false);
          return;
        }
        const success = await onUpdateProblem(modalState.data.id, {
          name: problemName.trim(),
          difficulty: problemDifficulty,
          category: problemCategory.trim() || 'General',
          link: problemLink.trim(),
        });
        if (success) setModalState(null);
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsSubmitting(true);
    try {
      if (deleteConfirm.type === 'subject') {
        await onDeleteSubject(deleteConfirm.id);
      } else if (deleteConfirm.type === 'lecture') {
        await onDeleteLecture(deleteConfirm.id);
      } else if (deleteConfirm.type === 'problem') {
        await onDeleteProblem(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [subjects, searchQuery]);

  // Filtered Lectures
  const filteredLectures = useMemo(() => {
    return lectures.filter((l) => {
      if (selectedSubjectFilter !== 'all' && l.subjectId !== selectedSubjectFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          l.title.toLowerCase().includes(q) ||
          (l.subjectName && l.subjectName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [lectures, selectedSubjectFilter, searchQuery]);

  // Filtered Problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (difficultyFilter !== 'all' && p.difficulty !== difficultyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [problems, difficultyFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-800">
        <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-blue-900">Global Shared Curriculum:</strong> Items
          managed here are visible to all enrolled students and users across the platform. Unlike
          personal student subjects or custom problems, changes here directly populate the public
          catalog.
        </div>
      </div>

      {/* Sub-nav & Controls Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Sub Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('subjects');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeSubTab === 'subjects'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Global Subjects ({subjects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('lectures');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeSubTab === 'lectures'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-blue-600" />
              <span>Global Lectures ({lectures.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('problems');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeSubTab === 'problems'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Global Problems ({problems.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
            </button>

            {activeSubTab === 'subjects' && (
              <button
                type="button"
                onClick={openSubjectCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Global Subject</span>
              </button>
            )}

            {activeSubTab === 'lectures' && (
              <button
                type="button"
                onClick={() => openLectureCreate()}
                disabled={subjects.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Global Lecture</span>
              </button>
            )}

            {activeSubTab === 'problems' && (
              <button
                type="button"
                onClick={openProblemCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Global Problem</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === 'subjects'
                  ? 'Search subjects...'
                  : activeSubTab === 'lectures'
                  ? 'Search lecture titles...'
                  : 'Search problems by title or category...'
              }
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {activeSubTab === 'lectures' && subjects.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter Subject:</label>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Subjects ({subjects.length})</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSubTab === 'problems' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Difficulty:</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Content Based on activeSubTab */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* TAB 1: SUBJECTS */}
        {activeSubTab === 'subjects' && (
          <div>
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Total <strong className="text-slate-900 font-semibold">{filteredSubjects.length}</strong>{' '}
                curated subjects
              </span>
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No global subjects found</p>
                <p className="text-slate-400 mt-1">Create one using the "Add Global Subject" button.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Subject Title</th>
                      <th className="py-3 px-4 font-semibold text-center">Lectures Enrolled</th>
                      <th className="py-3 px-4 font-semibold">Created Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubjects.map((sub) => {
                      const count =
                        sub.lecturesCount !== undefined
                          ? sub.lecturesCount
                          : lectures.filter((l) => l.subjectId === sub.id).length;
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>
                            <span>{sub.name}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {count} lectures
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openSubjectEdit(sub)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Edit Subject"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'subject',
                                    id: sub.id,
                                    title: sub.name,
                                    warning: `Deleting this subject will permanently remove its ${count} associated global lectures and any student completion records.`,
                                  })
                                }
                                className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LECTURES */}
        {activeSubTab === 'lectures' && (
          <div>
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Total <strong className="text-slate-900 font-semibold">{filteredLectures.length}</strong>{' '}
                curated lectures
              </span>
            </div>

            {filteredLectures.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <Video className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No global lectures found</p>
                <p className="text-slate-400 mt-1">Add one using the "Add Global Lecture" button.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-center">Session</th>
                      <th className="py-3 px-4 font-semibold">Lecture Title</th>
                      <th className="py-3 px-4 font-semibold">Parent Subject</th>
                      <th className="py-3 px-4 font-semibold">Video Link</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLectures.map((lec) => {
                      const parentSub = subjects.find((s) => s.id === lec.subjectId);
                      return (
                        <tr key={lec.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-semibold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                              Session {lec.session}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">{lec.title}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                              <BookOpen className="w-3 h-3 text-indigo-500" />
                              {parentSub ? parentSub.name : lec.subjectName || 'Global'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {lec.videoUrl ? (
                              <a
                                href={lec.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-medium"
                              >
                                <span>Watch Video</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No URL</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openLectureEdit(lec)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Edit Lecture"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'lecture',
                                    id: lec.id,
                                    title: lec.title,
                                    warning: 'Deleting this lecture will remove it from all students\' dashboards.',
                                  })
                                }
                                className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Lecture"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROBLEMS */}
        {activeSubTab === 'problems' && (
          <div>
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Total <strong className="text-slate-900 font-semibold">{filteredProblems.length}</strong>{' '}
                curated coding problems
              </span>
            </div>

            {filteredProblems.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <Code2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No global problems found</p>
                <p className="text-slate-400 mt-1">Add one using the "Add Global Problem" button.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Problem Name</th>
                      <th className="py-3 px-4 font-semibold text-center">Difficulty</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Problem Link</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProblems.map((prob) => {
                      const diffColors: Record<ProblemDifficulty, string> = {
                        Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        Medium: 'bg-amber-50 text-amber-700 border-amber-200',
                        Hard: 'bg-rose-50 text-rose-700 border-rose-200',
                      };
                      return (
                        <tr key={prob.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-900">{prob.name}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${diffColors[prob.difficulty]}`}
                            >
                              {prob.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                              {prob.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {prob.link ? (
                              <a
                                href={prob.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 underline font-medium"
                              >
                                <span>Practice Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No URL</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openProblemEdit(prob)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Edit Problem"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'problem',
                                    id: prob.id,
                                    title: prob.name,
                                    warning: 'Deleting this problem will remove it from the Coding Repository for all users.',
                                  })
                                }
                                className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Problem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalState && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {modalState.type === 'subject_create' && 'Create Global Subject'}
                {modalState.type === 'subject_edit' && 'Edit Global Subject'}
                {modalState.type === 'lecture_create' && 'Create Global Lecture'}
                {modalState.type === 'lecture_edit' && 'Edit Global Lecture'}
                {modalState.type === 'problem_create' && 'Create Global Problem'}
                {modalState.type === 'problem_edit' && 'Edit Global Problem'}
              </h3>
              <button
                type="button"
                onClick={() => setModalState(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              {/* SUBJECT FIELDS */}
              {(modalState.type === 'subject_create' || modalState.type === 'subject_edit') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                    autoFocus
                  />
                </div>
              )}

              {/* LECTURE FIELDS */}
              {(modalState.type === 'lecture_create' || modalState.type === 'lecture_edit') && (
                <>
                  {modalState.type === 'lecture_create' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Parent Subject *
                      </label>
                      <select
                        value={lectureSubjectId}
                        onChange={(e) => setLectureSubjectId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lecture Title *
                    </label>
                    <input
                      type="text"
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      placeholder="e.g. Asymptotic Notation & Big-O"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Session Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={lectureSession}
                        onChange={(e) =>
                          setLectureSession(e.target.value ? parseInt(e.target.value, 10) : '')
                        }
                        placeholder="Auto"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Video URL
                      </label>
                      <input
                        type="url"
                        value={lectureVideoUrl}
                        onChange={(e) => setLectureVideoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* PROBLEM FIELDS */}
              {(modalState.type === 'problem_create' || modalState.type === 'problem_edit') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Problem Name *
                    </label>
                    <input
                      type="text"
                      value={problemName}
                      onChange={(e) => setProblemName(e.target.value)}
                      placeholder="e.g. Two Sum"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Difficulty *
                      </label>
                      <select
                        value={problemDifficulty}
                        onChange={(e) => setProblemDifficulty(e.target.value as ProblemDifficulty)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={problemCategory}
                        onChange={(e) => setProblemCategory(e.target.value)}
                        placeholder="e.g. Arrays, Trees, DP"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Problem Link (LeetCode/HackerRank)
                    </label>
                    <input
                      type="url"
                      value={problemLink}
                      onChange={(e) => setProblemLink(e.target.value)}
                      placeholder="https://leetcode.com/problems/..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalState(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Deletion of "{deleteConfirm.title}"?
            </h3>
            {deleteConfirm.warning && (
              <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                {deleteConfirm.warning}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              This action cannot be undone. Are you sure you wish to proceed?
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
