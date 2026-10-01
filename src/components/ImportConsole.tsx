import React, { useState, useEffect } from 'react';
import {
  Video,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Play,
  FolderPlus,
  BookOpen,
  ClipboardPaste,
  RotateCcw,
  UploadCloud,
  Check,
  ChevronDown,
} from 'lucide-react';
import { SubjectSummary } from '../types.ts';
import { VideoPlayerModal, VideoPlayerLecture } from './VideoPlayerModal.tsx';

export interface ImportConsoleProps {
  onNavigateToSubject?: (subjectId: string) => void;
  onNavigateToCoding?: () => void;
}

export interface ExtractedPlaylistItem {
  session: number;
  title: string;
  videoUrl: string;
  videoId?: string;
  thumbnail?: string;
}

export function ImportConsole({ onNavigateToSubject }: ImportConsoleProps) {
  // Step 1: Subjects list and selection
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [subjectFetchError, setSubjectFetchError] = useState<string | null>(null);

  // Inline "Create New Subject" modal/state
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isSubmittingNewSubject, setIsSubmittingNewSubject] = useState(false);
  const [createSubjectError, setCreateSubjectError] = useState<string | null>(null);

  // Step 2: YouTube Playlist URL & Extraction
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Step 3: Extracted Preview Data
  const [playlistTitle, setPlaylistTitle] = useState<string>('');
  const [previewItems, setPreviewItems] = useState<ExtractedPlaylistItem[]>([]);
  const [hasExtracted, setHasExtracted] = useState(false);

  // Manual Add Extra Lecture row
  const [isAddingCustomLecture, setIsAddingCustomLecture] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  // Step 4: Submission to DB
  const [isSubmittingToDb, setIsSubmittingToDb] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessData, setSubmitSuccessData] = useState<{
    insertedCount: number;
    subjectName: string;
    subjectId: string;
  } | null>(null);

  // Video Test Preview Modal
  const [testVideoLecture, setTestVideoLecture] = useState<VideoPlayerLecture | null>(null);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoadingSubjects(false);
      return;
    }

    try {
      setIsLoadingSubjects(true);
      setSubjectFetchError(null);
      const res = await fetch('/api/subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load created subjects');
      const data = await res.json();
      const list: SubjectSummary[] = data.subjects || [];
      setSubjects(list);

      // Auto-select first subject if none selected
      if (list.length > 0) {
        setSelectedSubjectId((prev) => prev || list[0].id);
      }
    } catch (err) {
      setSubjectFetchError(err instanceof Error ? err.message : 'Failed to fetch subjects');
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Create new subject inline
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setIsSubmittingNewSubject(true);
      setCreateSubjectError(null);
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSubjectName.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create subject');
      }

      const created = await res.json();
      setNewSubjectName('');
      setIsCreatingSubject(false);

      // Refresh subjects and select the new one
      await fetchSubjects();
      if (created.id) {
        setSelectedSubjectId(created.id);
      }
    } catch (err) {
      setCreateSubjectError(err instanceof Error ? err.message : 'Error creating subject');
    } finally {
      setIsSubmittingNewSubject(false);
    }
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPlaylistUrl(text.trim());
        setExtractError(null);
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  // Step 2: Extract YouTube Playlist
  const handleExtractPlaylist = async () => {
    const trimmed = playlistUrl.trim();
    if (!trimmed) {
      setExtractError('Please enter or paste a YouTube playlist link.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setExtractError('You must be logged in to extract playlists.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractError(null);
      setSubmitSuccessData(null);

      const res = await fetch('/api/subjects/extract-youtube-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to extract playlist. Check that the link is valid and public.');
      }

      const videos: ExtractedPlaylistItem[] = (data.videos || []).map((v: any, idx: number) => ({
        session: idx + 1,
        title: v.title || `Lecture #${idx + 1}`,
        videoUrl: v.videoUrl || '',
        videoId: v.videoId,
        thumbnail: v.thumbnail || (v.videoId ? `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg` : undefined),
      }));

      if (videos.length === 0) {
        throw new Error('No videos could be extracted from this playlist.');
      }

      setPlaylistTitle(data.playlistTitle || 'YouTube Playlist');
      setPreviewItems(videos);
      setHasExtracted(true);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to extract YouTube playlist');
      setHasExtracted(false);
    } finally {
      setIsExtracting(false);
    }
  };

  // Remove a video card using cross button (Step 3)
  const handleRemoveVideo = (indexToRemove: number) => {
    setPreviewItems((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      return updated.map((item, idx) => ({
        ...item,
        session: idx + 1,
      }));
    });
  };

  // Edit video title in preview
  const handleUpdateTitle = (index: number, newTitle: string) => {
    setPreviewItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, title: newTitle } : item))
    );
  };

  // Add extra custom lecture to preview
  const handleAddCustomLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    setPreviewItems((prev) => [
      ...prev,
      {
        session: prev.length + 1,
        title: customTitle.trim(),
        videoUrl: customUrl.trim(),
      },
    ]);

    setCustomTitle('');
    setCustomUrl('');
    setIsAddingCustomLecture(false);
  };

  // Step 4: Submit & Insert into DB
  const handleSubmitToDb = async () => {
    if (!selectedSubjectId) {
      setSubmitError('Please select a target subject first.');
      return;
    }

    if (previewItems.length === 0) {
      setSubmitError('No lectures to insert. Please extract a playlist or add at least one lecture.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const targetSubject = subjects.find((s) => s.id === selectedSubjectId);

    try {
      setIsSubmittingToDb(true);
      setSubmitError(null);

      const payload = {
        items: previewItems.map((item) => ({
          title: item.title,
          videoUrl: item.videoUrl,
        })),
      };

      const res = await fetch(`/api/subjects/${selectedSubjectId}/lectures/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to insert lectures into database.');
      }

      setSubmitSuccessData({
        insertedCount: data.insertedCount || previewItems.length,
        subjectName: targetSubject?.name || 'Selected Subject',
        subjectId: selectedSubjectId,
      });

      setPreviewItems([]);
      setHasExtracted(false);
      setPlaylistUrl('');
      fetchSubjects();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Database insertion failed.');
    } finally {
      setIsSubmittingToDb(false);
    }
  };

  // Reset / Import another playlist
  const handleReset = () => {
    setHasExtracted(false);
    setPreviewItems([]);
    setPlaylistUrl('');
    setPlaylistTitle('');
    setExtractError(null);
    setSubmitError(null);
    setSubmitSuccessData(null);
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-16 px-1 sm:px-0">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
              <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                  YouTube Playlist Importer
                </h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  Auto-Extract
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug">
                Select your subject, paste a YouTube playlist link, curate lectures, and insert directly into your database.
              </p>
            </div>
          </div>

          {hasExtracted && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start Over</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Celebration Screen */}
      {submitSuccessData && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-emerald-950">
              Successfully Imported into Database!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-700 mt-1 max-w-md mx-auto">
              Added <span className="font-bold text-emerald-900">{submitSuccessData.insertedCount} lectures</span> directly into{' '}
              <span className="font-bold text-emerald-900">"{submitSuccessData.subjectName}"</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
            {onNavigateToSubject && (
              <button
                type="button"
                onClick={() => onNavigateToSubject(submitSuccessData.subjectId)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <span>Go to Subject & Watch Lectures</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import Another Playlist</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Import Wizard */}
      {!submitSuccessData && (
        <div className="space-y-4 sm:space-y-6">
          {/* STEP 1: Select Subject */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Select Target Subject
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingSubject((prev) => !prev)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Create Subject</span>
              </button>
            </div>

            {/* Inline New Subject Creator Form */}
            {isCreatingSubject && (
              <form
                onSubmit={handleCreateSubject}
                className="p-3 sm:p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all"
              >
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Full Stack Web Development"
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-blue-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingNewSubject || !newSubjectName.trim()}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingNewSubject ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingSubject(false);
                      setNewSubjectName('');
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {createSubjectError && (
              <p className="text-xs text-red-600">{createSubjectError}</p>
            )}

            {isLoadingSubjects ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading your subjects...</span>
              </div>
            ) : subjectFetchError ? (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
                {subjectFetchError}
              </div>
            ) : subjects.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed text-center text-xs text-slate-500">
                No subjects found yet. Click <strong>"+ Create Subject"</strong> above to make your first subject.
              </div>
            ) : (
              <>
                {/* Mobile Subject Dropdown Picker (< sm screens) */}
                <div className="sm:hidden relative">
                  <div className="relative">
                    <select
                      id="mobile-subject-select"
                      aria-label="Select target subject"
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-blue-300 bg-blue-50/70 text-xs font-bold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                    >
                      {subjects.map((subj) => (
                        <option key={subj.id} value={subj.id}>
                          {subj.name} ({subj.totalTopics} lectures)
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Desktop / Tablet Cards Grid (>= sm screens) */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {subjects.map((subj) => {
                    const isSelected = subj.id === selectedSubjectId;
                    return (
                      <div
                        key={subj.id}
                        onClick={() => setSelectedSubjectId(subj.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate">{subj.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {subj.totalTopics} lectures
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* STEP 2: Paste YouTube Playlist URL & Extract */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Paste YouTube Playlist Link & Extract Data
              </h2>
            </div>

            <div className="space-y-2">
              <div className="relative flex items-center">
                <div className="absolute left-3 text-red-600 pointer-events-none">
                  <Video className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  id="youtube-playlist-url-input"
                  value={playlistUrl}
                  onChange={(e) => {
                    setPlaylistUrl(e.target.value);
                    if (extractError) setExtractError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExtractPlaylist();
                    }
                  }}
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  className="w-full pl-9 pr-20 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono"
                />

                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="absolute right-1.5 sm:right-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Paste</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 px-1">
                <span>
                  Works with playlist links (<code>?list=PL...</code>), watch links, or playlist IDs.
                </span>
                <span>
                  Target: <strong className="text-slate-800">{selectedSubject?.name || 'None selected'}</strong>
                </span>
              </div>
            </div>

            {extractError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 leading-relaxed">{extractError}</div>
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                id="extract-youtube-playlist-btn"
                onClick={handleExtractPlaylist}
                disabled={isExtracting || !playlistUrl.trim() || !selectedSubjectId}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Playlist Videos...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Extract Data</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* STEP 3: Preview Before Database Insertion */}
          {hasExtracted && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              {/* Preview Header & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Curate & Preview Lectures</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        {previewItems.length} Videos
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Playlist: <strong className="text-slate-800">"{playlistTitle}"</strong> · Use the cross button to remove any unwanted video.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomLecture(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewItems([])}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Inline Add Custom Lecture Form */}
              {isAddingCustomLecture && (
                <form
                  onSubmit={handleAddCustomLecture}
                  className="p-3 sm:p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Extra Lecture to Preview</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomLecture(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Lecture Title"
                      className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
                      autoFocus
                    />
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="Video URL (optional)"
                      className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomLecture(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!customTitle.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to List</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Preview Cards List with Cross (X) Button */}
              {previewItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No videos in preview. Add one manually or re-extract a playlist.
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {previewItems.map((item, idx) => (
                    <div
                      key={`preview-${item.videoId || idx}`}
                      className="p-2 sm:p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 group/item shadow-2xs"
                    >
                      {/* Left: Session Number Badge, Thumbnail & Title */}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] sm:text-xs font-bold flex items-center justify-center shrink-0 border border-slate-200">
                          #{item.session}
                        </span>

                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-14 h-9 sm:w-20 sm:h-12 object-cover rounded-lg bg-zinc-900 shrink-0 border border-slate-200 shadow-2xs"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-14 h-9 sm:w-20 sm:h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                            <Video className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateTitle(idx, e.target.value)}
                            className="w-full text-xs font-semibold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none transition-colors"
                            title="Click to edit title"
                          />
                          <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate mt-0.5">
                            {item.videoUrl}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions (Preview & Remove) */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {item.videoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setTestVideoLecture({
                                title: item.title,
                                session: item.session,
                                videoUrl: item.videoUrl,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Test watch video"
                          >
                            <Play className="w-3 h-3 fill-current text-blue-600" />
                            <span>Preview</span>
                          </button>
                        )}

                        {/* Cross Button to Remove Video */}
                        <button
                          type="button"
                          id={`remove-video-btn-${idx}`}
                          onClick={() => handleRemoveVideo(idx)}
                          className="px-2.5 py-1.5 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 sm:border-transparent text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                          title="Remove video from import"
                          aria-label={`Remove video #${item.session} ${item.title}`}
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                          <span className="sm:hidden text-red-600 text-[11px]">Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit & Insert into DB Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs text-slate-500">
                  Ready to insert <strong className="text-slate-900 font-bold">{previewItems.length} lectures</strong> into{' '}
                  <strong className="text-blue-600 font-bold">{selectedSubject?.name || 'Selected Subject'}</strong>
                </div>

                <button
                  type="button"
                  id="submit-insert-to-db-btn"
                  onClick={handleSubmitToDb}
                  disabled={isSubmittingToDb || previewItems.length === 0 || !selectedSubjectId}
                  className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  {isSubmittingToDb ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inserting into Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit & Insert into DB</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Floating Mobile Docked Submit Bar (Visible on mobile when reviewing) */}
          {hasExtracted && previewItems.length > 0 && !submitSuccessData && (
            <div className="sm:hidden fixed bottom-14 left-3 right-3 z-30 bg-white border border-slate-200 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {previewItems.length} lectures ready
                </p>
                <p className="text-[10px] text-blue-600 font-semibold truncate">
                  Into: {selectedSubject?.name || 'Selected Subject'}
                </p>
              </div>

              <button
                type="button"
                id="mobile-floating-submit-btn"
                onClick={handleSubmitToDb}
                disabled={isSubmittingToDb || previewItems.length === 0 || !selectedSubjectId}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-md active:scale-95"
              >
                {isSubmittingToDb ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Insert to DB</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video Player Modal for Test Preview (conditionally mounted) */}
      {testVideoLecture && (
        <VideoPlayerModal
          isOpen={true}
          onClose={() => setTestVideoLecture(null)}
          lecture={testVideoLecture}
          subjectTitle="Preview Video"
          playlist={[testVideoLecture]}
        />
      )}
    </div>
  );
}
