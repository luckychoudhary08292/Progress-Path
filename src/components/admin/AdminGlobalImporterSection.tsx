import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Globe,
  Youtube,
  Code2,
  Layers,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FolderPlus,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  GlobalSubjectItem,
  ProblemDifficulty,
} from '../../types.ts';
import { VideoPlayerModal, VideoPlayerLecture } from '../VideoPlayerModal.tsx';
import { apiCache } from '../../services/apiCache.ts';

export interface AdminGlobalImporterSectionProps {
  globalSubjects: GlobalSubjectItem[];
  onRefreshContent: () => void;
  onNavigateToContent?: () => void;
}

interface ExtractedLectureItem {
  session: number;
  title: string;
  videoUrl: string;
  videoId?: string;
  thumbnail?: string;
}

interface PendingProblemItem {
  id: string;
  name: string;
  difficulty: ProblemDifficulty;
  category: string;
  link: string;
}

export function AdminGlobalImporterSection({
  globalSubjects,
  onRefreshContent,
  onNavigateToContent,
}: AdminGlobalImporterSectionProps) {
  const [activeImportType, setActiveImportType] = useState<'playlist' | 'problems'>('playlist');

  // ==========================================
  // 1. PLAYLIST IMPORT STATE
  // ==========================================
  const [subjectTargetMode, setSubjectTargetMode] = useState<'existing' | 'new'>('new');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [playlistTitle, setPlaylistTitle] = useState<string>('');
  const [extractedLectures, setExtractedLectures] = useState<ExtractedLectureItem[]>([]);
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);

  // Manual lecture insertion in playlist table
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualUrl, setManualUrl] = useState<string>('');
  const [isAddingManual, setIsAddingManual] = useState<boolean>(false);

  // Submission state for playlist
  const [isLaunchingPlaylist, setIsLaunchingPlaylist] = useState<boolean>(false);
  const [playlistLaunchSuccess, setPlaylistLaunchSuccess] = useState<{
    subjectName: string;
    insertedCount: number;
  } | null>(null);
  const [playlistLaunchError, setPlaylistLaunchError] = useState<string | null>(null);

  // Video test modal
  const [testVideoLecture, setTestVideoLecture] = useState<VideoPlayerLecture | null>(null);

  // Auto-select first global subject if existing mode is active
  useEffect(() => {
    if (globalSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(globalSubjects[0].id);
    }
  }, [globalSubjects, selectedSubjectId]);

  // Handle Extract YouTube Playlist
  const handleExtractPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      setExtractError('Please enter a valid YouTube playlist URL');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setIsExtracting(true);
      setExtractError(null);
      setPlaylistLaunchSuccess(null);
      setPlaylistLaunchError(null);

      const res = await fetch('/api/subjects/extract-youtube-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: playlistUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to extract playlist videos');
      }

      setExtractedLectures(data.videos || []);
      setPlaylistTitle(data.playlistTitle || 'Extracted YouTube Course');
      setHasExtracted(true);

      // Pre-fill subject name if creating new
      if (data.playlistTitle && subjectTargetMode === 'new' && !newSubjectName) {
        setNewSubjectName(data.playlistTitle.trim());
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Error extracting YouTube playlist');
    } finally {
      setIsExtracting(false);
    }
  };

  // Add manual lecture to playlist table
  const handleAddManualLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    setExtractedLectures((prev) => [
      ...prev,
      {
        session: prev.length + 1,
        title: manualTitle.trim(),
        videoUrl: manualUrl.trim(),
      },
    ]);
    setManualTitle('');
    setManualUrl('');
    setIsAddingManual(false);
  };

  // Delete lecture from extracted list
  const handleDeleteExtractedLecture = (index: number) => {
    setExtractedLectures((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((lec, i) => ({ ...lec, session: i + 1 }))
    );
  };

  // Update lecture title/url
  const handleUpdateExtractedLecture = (
    index: number,
    field: 'title' | 'videoUrl',
    val: string
  ) => {
    setExtractedLectures((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // Launch Playlist Globally to all students
  const handleLaunchPlaylistGlobally = async () => {
    if (subjectTargetMode === 'new' && !newSubjectName.trim()) {
      setPlaylistLaunchError('Please enter a name for the new global subject.');
      return;
    }
    if (subjectTargetMode === 'existing' && !selectedSubjectId) {
      setPlaylistLaunchError('Please select an existing global subject.');
      return;
    }
    if (extractedLectures.length === 0) {
      setPlaylistLaunchError('At least one lecture is required to launch.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setIsLaunchingPlaylist(true);
      setPlaylistLaunchError(null);

      const payload = {
        subjectId: subjectTargetMode === 'existing' ? selectedSubjectId : undefined,
        newSubjectName: subjectTargetMode === 'new' ? newSubjectName.trim() : undefined,
        items: extractedLectures.map((lec) => ({
          title: lec.title,
          videoUrl: lec.videoUrl,
          session: lec.session,
        })),
      };

      const res = await fetch('/api/admin/content/import/playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to launch playlist globally');
      }

      setPlaylistLaunchSuccess({
        subjectName: data.subjectName || newSubjectName || 'Global Subject',
        insertedCount: data.insertedCount || extractedLectures.length,
      });

      // Clear in-memory caches so all clients see fresh global data immediately
      apiCache.invalidate('subjects');
      apiCache.invalidate('dashboard');
      onRefreshContent();

      // Reset extraction state
      setExtractedLectures([]);
      setHasExtracted(false);
      setPlaylistUrl('');
      setNewSubjectName('');
    } catch (err) {
      setPlaylistLaunchError(err instanceof Error ? err.message : 'Failed to launch global playlist');
    } finally {
      setIsLaunchingPlaylist(false);
    }
  };

  // ==========================================
  // 2. CODING PROBLEMS BULK IMPORT STATE
  // ==========================================
  const [problemsInputText, setProblemsInputText] = useState<string>('');
  const [pendingProblems, setPendingProblems] = useState<PendingProblemItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLaunchingProblems, setIsLaunchingProblems] = useState<boolean>(false);
  const [problemsLaunchSuccess, setProblemsLaunchSuccess] = useState<number | null>(null);
  const [problemsLaunchError, setProblemsLaunchError] = useState<string | null>(null);

  // Single problem form state
  const [singleProbName, setSingleProbName] = useState<string>('');
  const [singleProbDiff, setSingleProbDiff] = useState<ProblemDifficulty>('Medium');
  const [singleProbCat, setSingleProbCat] = useState<string>('Arrays');
  const [singleProbLink, setSingleProbLink] = useState<string>('');

  const handleAddSingleProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleProbName.trim()) return;

    setPendingProblems((prev) => [
      ...prev,
      {
        id: 'temp_' + Math.random().toString(36).substring(2, 9),
        name: singleProbName.trim(),
        difficulty: singleProbDiff,
        category: singleProbCat.trim() || 'General',
        link: singleProbLink.trim(),
      },
    ]);

    setSingleProbName('');
    setSingleProbLink('');
  };

  // Parse bulk text (supports CSV, pipe-delimited, or line-delimited format)
  const handleParseBulkText = () => {
    if (!problemsInputText.trim()) {
      setParseError('Please enter problem definitions to parse.');
      return;
    }

    try {
      setParseError(null);
      const lines = problemsInputText.split('\n').filter((l) => l.trim().length > 0);
      const parsed: PendingProblemItem[] = [];

      for (const line of lines) {
        // Try pipe format: "Two Sum | Easy | Arrays | https://leetcode.com/problems/two-sum"
        let parts = line.split('|').map((s) => s.trim());
        if (parts.length < 2) {
          // Try comma CSV format
          parts = line.split(',').map((s) => s.trim());
        }

        const name = parts[0] || '';
        let diff: ProblemDifficulty = 'Medium';
        if (parts[1]) {
          const d = parts[1].toLowerCase();
          if (d.includes('easy')) diff = 'Easy';
          else if (d.includes('hard')) diff = 'Hard';
          else diff = 'Medium';
        }

        const category = parts[2] || 'General';
        const link = parts[3] || '';

        if (name) {
          parsed.push({
            id: 'temp_' + Math.random().toString(36).substring(2, 9),
            name,
            difficulty: diff,
            category,
            link,
          });
        }
      }

      if (parsed.length === 0) {
        throw new Error('Could not parse any valid problems from the provided input.');
      }

      setPendingProblems((prev) => [...prev, ...parsed]);
      setProblemsInputText('');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Error parsing problems input');
    }
  };

  // Delete pending problem
  const handleDeletePendingProblem = (id: string) => {
    setPendingProblems((prev) => prev.filter((p) => p.id !== id));
  };

  // Launch problems globally to all students
  const handleLaunchProblemsGlobally = async () => {
    if (pendingProblems.length === 0) {
      setProblemsLaunchError('No problems to launch. Add or parse at least one problem.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setIsLaunchingProblems(true);
      setProblemsLaunchError(null);

      const payload = {
        problems: pendingProblems.map((p) => ({
          name: p.name,
          difficulty: p.difficulty,
          category: p.category,
          link: p.link,
        })),
      };

      const res = await fetch('/api/admin/content/import/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to launch problems globally');
      }

      setProblemsLaunchSuccess(data.insertedCount || pendingProblems.length);

      // Invalidate coding cache
      apiCache.invalidate('coding_problems');
      apiCache.invalidate('dashboard');
      onRefreshContent();

      setPendingProblems([]);
    } catch (err) {
      setProblemsLaunchError(err instanceof Error ? err.message : 'Failed to launch global problems');
    } finally {
      setIsLaunchingProblems(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold tracking-wide border border-indigo-500/30">
              <Globe className="w-3.5 h-3.5" />
              <span>Admin Global Curriculum Deployment</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Launch Global Curriculum & Problems
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Import entire YouTube lecture courses or bulk coding repositories directly into the
              global database. All imported content is instantly visible to every registered student.
            </p>
          </div>

          {/* Toggle Type Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveImportType('playlist')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeImportType === 'playlist'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Youtube className="w-4 h-4" />
              <span>YouTube Playlist</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveImportType('problems')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeImportType === 'problems'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Coding Problems</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: YOUTUBE PLAYLIST IMPORTER */}
      {/* ========================================================================= */}
      {activeImportType === 'playlist' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {playlistLaunchSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-3 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm text-emerald-900">
                  Global Curriculum Successfully Launched!
                </p>
                <p className="mt-0.5 text-emerald-700">
                  Published <strong>{playlistLaunchSuccess.insertedCount} lectures</strong> to global subject{' '}
                  <strong>"{playlistLaunchSuccess.subjectName}"</strong>. Every student across the platform can
                  now access this curriculum.
                </p>
                {onNavigateToContent && (
                  <button
                    type="button"
                    onClick={onNavigateToContent}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <span>View in Global Content Manager</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {playlistLaunchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm text-rose-900">Deployment Error</p>
                <p className="mt-0.5 text-rose-700">{playlistLaunchError}</p>
              </div>
            </div>
          )}

          {/* Configuration Card: Step 1 & Step 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Target Subject Configuration */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900">Global Target Subject</h3>
              </div>

              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSubjectTargetMode('new')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    subjectTargetMode === 'new'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create New Subject
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectTargetMode('existing')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    subjectTargetMode === 'existing'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Add to Existing Global
                </button>
              </div>

              {subjectTargetMode === 'new' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    New Global Subject Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g., Complete Computer Networks, Operating Systems..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400">
                    Will be created as a public global subject available to all students.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Global Subject <span className="text-rose-500">*</span>
                  </label>
                  {globalSubjects.length > 0 ? (
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                    >
                      {globalSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.lecturesCount || 0} existing lectures)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs">
                      No global subjects exist yet. Please select "Create New Subject".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* YouTube Playlist Extraction Card */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900">YouTube Playlist Source</h3>
              </div>

              <form onSubmit={handleExtractPlaylist} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    YouTube Playlist URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={playlistUrl}
                      onChange={(e) => setPlaylistUrl(e.target.value)}
                      placeholder="https://www.youtube.com/playlist?list=PL..."
                      className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={isExtracting || !playlistUrl.trim()}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Extracting...</span>
                        </>
                      ) : (
                        <>
                          <Youtube className="w-4 h-4" />
                          <span>Extract Videos</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {extractError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{extractError}</span>
                  </p>
                )}

                <p className="text-[11px] text-slate-400">
                  Ensure the YouTube playlist visibility is set to <strong>Public</strong> or{' '}
                  <strong>Unlisted</strong>. Private playlists cannot be extracted.
                </p>
              </form>
            </div>
          </div>

          {/* Extracted Lectures Preview Table */}
          {hasExtracted && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Extracted Preview
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                      {extractedLectures.length} Lectures Found
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">{playlistTitle}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingManual(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Manual Topic</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchPlaylistGlobally}
                    disabled={isLaunchingPlaylist || extractedLectures.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
                  >
                    {isLaunchingPlaylist ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Launching to Global Feed...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Launch Globally to All Students</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Add Manual Lecture Inline Form */}
              {isAddingManual && (
                <form
                  onSubmit={handleAddManualLecture}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Add Extra Lecture</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingManual(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Lecture Title *"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      required
                      className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="url"
                      placeholder="Video URL (optional)"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Insert Lecture
                  </button>
                </form>
              )}

              {/* Table */}
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3 w-16">Session</th>
                      <th className="py-2.5 px-3">Lecture Title</th>
                      <th className="py-2.5 px-3">Video Link</th>
                      <th className="py-2.5 px-3 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extractedLectures.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-700">#{item.session}</td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              handleUpdateExtractedLecture(idx, 'title', e.target.value)
                            }
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent transition-all"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={item.videoUrl}
                              onChange={(e) =>
                                handleUpdateExtractedLecture(idx, 'videoUrl', e.target.value)
                              }
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent transition-all text-slate-600 truncate"
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
                                className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer shrink-0"
                                title="Test play video"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteExtractedLecture(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove lecture"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CODING PROBLEMS BULK IMPORTER */}
      {/* ========================================================================= */}
      {activeImportType === 'problems' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {problemsLaunchSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-3 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm text-emerald-900">
                  Global Problems Successfully Launched!
                </p>
                <p className="mt-0.5 text-emerald-700">
                  Published <strong>{problemsLaunchSuccess} coding problems</strong> to the global
                  problem repository. All students will see these in their Coding Repository.
                </p>
                {onNavigateToContent && (
                  <button
                    type="button"
                    onClick={onNavigateToContent}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <span>View in Global Content Manager</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {problemsLaunchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm text-rose-900">Deployment Error</p>
                <p className="mt-0.5 text-rose-700">{problemsLaunchError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quick Single Problem Add */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add Problem One-by-One</h3>
              </div>

              <form onSubmit={handleAddSingleProblem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Two Sum, Trapping Rain Water"
                    value={singleProbName}
                    onChange={(e) => setSingleProbName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Difficulty *
                    </label>
                    <select
                      value={singleProbDiff}
                      onChange={(e) => setSingleProbDiff(e.target.value as ProblemDifficulty)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Dynamic Programming"
                      value={singleProbCat}
                      onChange={(e) => setSingleProbCat(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link (LeetCode / Codeforces)
                  </label>
                  <input
                    type="url"
                    placeholder="https://leetcode.com/problems/..."
                    value={singleProbLink}
                    onChange={(e) => setSingleProbLink(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Add to Pending List
                </button>
              </form>
            </div>

            {/* Bulk Text / CSV Parse */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Bulk Text & CSV Paste</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Paste lines formatted as: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700">Title | Difficulty | Category | Link</code>
                  </span>
                </div>

                <textarea
                  rows={5}
                  value={problemsInputText}
                  onChange={(e) => setProblemsInputText(e.target.value)}
                  placeholder={`Two Sum | Easy | Arrays | https://leetcode.com/problems/two-sum\n3Sum | Medium | Two Pointers | https://leetcode.com/problems/3sum\nTrapping Rain Water | Hard | Dynamic Programming | https://leetcode.com/problems/trapping-rain-water`}
                  className="w-full text-xs p-3 font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                />

                {parseError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{parseError}</span>
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseBulkText}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Parse & Add to List
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Problems Table */}
          {pendingProblems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ready to Launch
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                    {pendingProblems.length} Problems Queued
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingProblems([])}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchProblemsGlobally}
                    disabled={isLaunchingProblems || pendingProblems.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-950/20 cursor-pointer"
                  >
                    {isLaunchingProblems ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Launching to Global Feed...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Launch {pendingProblems.length} Problems Globally</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Problem Name</th>
                      <th className="py-2.5 px-3">Difficulty</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Link</th>
                      <th className="py-2.5 px-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingProblems.map((prob, idx) => (
                      <tr key={prob.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{prob.name}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prob.difficulty === 'Easy'
                                ? 'bg-emerald-100 text-emerald-800'
                                : prob.difficulty === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {prob.difficulty}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {prob.category}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">
                          {prob.link ? (
                            <a
                              href={prob.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Open Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            'None'
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePendingProblem(prob.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Preview Modal */}
      {testVideoLecture && (
        <VideoPlayerModal
          isOpen={true}
          lecture={testVideoLecture}
          playlist={[testVideoLecture]}
          onClose={() => setTestVideoLecture(null)}
        />
      )}
    </div>
  );
}

export default AdminGlobalImporterSection;
