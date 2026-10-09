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
  Check,
  ChevronDown,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { SubjectSummary } from '../types.ts';
import { VideoPlayerModal, VideoPlayerLecture } from './VideoPlayerModal.tsx';

export interface ImportConsoleProps {
  onNavigateToSubject?: (subjectId: string) => void;
  onNavigateToCoding?: () => void;
  hideHeader?: boolean;
}

export interface ExtractedPlaylistItem {
  session: number;
  title: string;
  videoUrl: string;
  videoId?: string;
  thumbnail?: string;
}

export function ImportConsole({ onNavigateToSubject, hideHeader = false }: ImportConsoleProps) {
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

  // Remove a video item
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
    <div className="w-full space-y-4 text-slate-900 dark:text-slate-100">
      {/* Clean Header (Only rendered when not embedded inside a parent header) */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              YouTube Playlist Extractor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Paste a public playlist URL to load videos directly into your subjects curriculum.
            </p>
          </div>
          {hasExtracted && (
            <button
              type="button"
              onClick={handleReset}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}

      {/* Success Notification */}
      {submitSuccessData && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 sm:p-5 text-slate-900 dark:text-slate-100 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Lectures Imported Successfully
              </h3>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                Added <strong className="font-semibold">{submitSuccessData.insertedCount} lectures</strong> to{' '}
                <strong className="font-semibold">"{submitSuccessData.subjectName}"</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 pl-8">
            {onNavigateToSubject && (
              <button
                type="button"
                onClick={() => onNavigateToSubject(submitSuccessData.subjectId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                <span>Open Subject</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Import Another</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Extractor Flow */}
      {!submitSuccessData && (
        <div className="space-y-4">
          {/* Setup Card: Target Subject & Playlist Link */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 space-y-4 shadow-2xs">
            {/* Row 1: Target Subject Selection */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="extractor-subject-select"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Target Subject
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingSubject((prev) => !prev)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Subject</span>
                </button>
              </div>

              {/* Inline Create Subject Form */}
              {isCreatingSubject && (
                <form
                  onSubmit={handleCreateSubject}
                  className="mb-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Enter subject name (e.g. Data Structures)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingNewSubject || !newSubjectName.trim()}
                      className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {isSubmittingNewSubject ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Create</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingSubject(false);
                        setNewSubjectName('');
                      }}
                      className="px-2.5 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {createSubjectError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">{createSubjectError}</p>
              )}

              {/* Subject Dropdown */}
              {isLoadingSubjects ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading subjects...</span>
                </div>
              ) : subjectFetchError ? (
                <p className="text-xs text-rose-600 dark:text-rose-400">{subjectFetchError}</p>
              ) : subjects.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  No subjects found. Click "+ New Subject" to create one.
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="extractor-subject-select"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                  >
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name} ({subj.totalTopics || 0} lectures)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Row 2: Playlist Link Input with Paste & Extract Button */}
            <div>
              <label
                htmlFor="youtube-playlist-url-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                YouTube Playlist Link
              </label>

              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
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
                    className="w-full pl-3 pr-16 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste</span>
                  </button>
                </div>

                <button
                  type="button"
                  id="extract-youtube-playlist-btn"
                  onClick={handleExtractPlaylist}
                  disabled={isExtracting || !playlistUrl.trim() || !selectedSubjectId}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5" />
                      <span>Extract Playlist</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Paste any public YouTube playlist URL or video link containing <code>?list=...</code>
              </p>
            </div>

            {extractError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{extractError}</div>
              </div>
            )}
          </div>

          {/* Extracted Lectures Review & Curate */}
          {hasExtracted && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 space-y-3.5 shadow-2xs">
              {/* Review Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {playlistTitle || 'Playlist Lectures'}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({previewItems.length} {previewItems.length === 1 ? 'lecture' : 'lectures'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Review and edit titles or remove lectures before adding to {selectedSubject?.name}.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomLecture(true)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>Add Lecture</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewItems([])}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Inline Add Lecture Form */}
              {isAddingCustomLecture && (
                <form
                  onSubmit={handleAddCustomLecture}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      Add Custom Lecture
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomLecture(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Lecture Title (e.g. Introduction to Trees)"
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                      autoFocus
                    />
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="Video URL (optional)"
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomLecture(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!customTitle.trim()}
                      className="px-3 py-1 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50"
                    >
                      Add to List
                    </button>
                  </div>
                </form>
              )}

              {/* Lectures List */}
              {previewItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No lectures in preview.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-0.5 divide-y divide-slate-100 dark:divide-slate-800/80">
                  {previewItems.map((item, idx) => (
                    <div
                      key={`preview-${item.videoId || idx}`}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors"
                    >
                      {/* Left: Index & Thumbnail */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[11px] font-mono font-medium text-slate-400 w-5 shrink-0 text-right">
                          {item.session}
                        </span>

                        {item.thumbnail ? (
                          <div className="relative w-14 h-9 sm:w-16 sm:h-10 rounded bg-slate-900 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img
                              src={item.thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
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
                                className="absolute inset-0 bg-black/30 hover:bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Preview video"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-14 h-9 sm:w-16 sm:h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <Video className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateTitle(idx, e.target.value)}
                            className="w-full text-xs text-slate-900 dark:text-white bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none transition-colors truncate"
                            title="Click to edit title"
                          />
                          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate px-1">
                            {item.videoUrl}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
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
                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Watch preview"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          id={`remove-video-btn-${idx}`}
                          onClick={() => handleRemoveVideo(idx)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove from import"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Bottom Action Row */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to add to <strong className="text-slate-900 dark:text-white font-medium">{selectedSubject?.name}</strong>
                </span>

                <button
                  type="button"
                  id="submit-insert-to-db-btn"
                  onClick={handleSubmitToDb}
                  disabled={isSubmittingToDb || previewItems.length === 0 || !selectedSubjectId}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingToDb ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving lectures...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Import {previewItems.length} {previewItems.length === 1 ? 'Lecture' : 'Lectures'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Player Modal for Test Preview */}
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
