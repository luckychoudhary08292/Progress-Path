import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ListVideo,
  FileText,
  Save,
  Loader2,
  Tv,
  Search,
  Video,
  Play,
  LayoutGrid,
  Sun,
  Moon,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { parseVideoUrl, ParsedVideo } from '../utils/videoUtils.ts';

export interface VideoPlayerLecture {
  id?: string;
  title: string;
  session?: number;
  videoUrl?: string;
  completed?: boolean;
  notes?: string;
  isOwner?: boolean;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: VideoPlayerLecture | null;
  subjectTitle?: string;
  subjectId?: string;
  playlist?: VideoPlayerLecture[];
  onToggleCompleted?: (lecture: VideoPlayerLecture) => Promise<void> | void;
  onSaveNotes?: (lectureId: string, notes: string) => Promise<void> | void;
  onSelectLecture?: (lecture: VideoPlayerLecture) => void;
}

type RightPanelTab = 'playlist' | 'notes';
type PlayerTheme = 'dark' | 'white';

export function VideoPlayerModal({
  isOpen,
  onClose,
  lecture,
  subjectTitle,
  playlist = [],
  onToggleCompleted,
  onSaveNotes,
  onSelectLecture,
}: VideoPlayerModalProps) {
  // Cinema mode toggles between 75% video / 25% playlist vs 100% full cinema video
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>('playlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState<string | null>(null);
  const [isTogglingComplete, setIsTogglingComplete] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  // Theme state: White / Dark toggle
  const [playerTheme, setPlayerTheme] = useState<PlayerTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('video_player_theme');
      if (saved === 'white' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const togglePlayerTheme = () => {
    setPlayerTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'white' : 'dark';
      try {
        localStorage.setItem('video_player_theme', nextTheme);
      } catch {}
      return nextTheme;
    });
  };

  // Direct video controls state (when source is HTML5 .mp4 / .webm)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const activePlaylistItemRef = useRef<HTMLDivElement | null>(null);

  // Sync notes when active lecture changes
  useEffect(() => {
    if (lecture) {
      setCurrentNotes(lecture.notes || '');
      setNotesSaveStatus(null);
    }
  }, [lecture?.id, lecture?.notes]);

  // Parse video source
  const parsedVideo: ParsedVideo = useMemo(() => {
    if (!lecture?.videoUrl) {
      return {
        type: 'iframe',
        embedUrl: '',
        originalUrl: '',
      };
    }
    return parseVideoUrl(lecture.videoUrl);
  }, [lecture?.videoUrl]);

  // Sorted and prepared playlist
  const sortedPlaylist = useMemo(() => {
    if (!playlist || playlist.length === 0) {
      return lecture ? [lecture] : [];
    }
    return [...playlist].sort((a, b) => (a.session ?? 0) - (b.session ?? 0));
  }, [playlist, lecture]);

  // Find index of current lecture in sorted playlist
  const currentIndex = useMemo(() => {
    if (!lecture) return -1;
    return sortedPlaylist.findIndex(
      (item) => (item.id && item.id === lecture.id) || item.session === lecture.session
    );
  }, [lecture, sortedPlaylist]);

  // Previous and next lecture calculations
  const prevLecture = currentIndex > 0 ? sortedPlaylist[currentIndex - 1] : null;
  const nextLecture =
    currentIndex >= 0 && currentIndex < sortedPlaylist.length - 1
      ? sortedPlaylist[currentIndex + 1]
      : null;

  // Next lecture with valid video
  const nextVideoLecture = useMemo(() => {
    if (currentIndex < 0) return null;
    for (let i = currentIndex + 1; i < sortedPlaylist.length; i++) {
      if (sortedPlaylist[i].videoUrl && sortedPlaylist[i].videoUrl!.trim() !== '') {
        return sortedPlaylist[i];
      }
    }
    return null;
  }, [currentIndex, sortedPlaylist]);

  // Filtered playlist for the 25% sidebar search
  const filteredPlaylist = useMemo(() => {
    if (!searchQuery.trim()) return sortedPlaylist;
    const q = searchQuery.toLowerCase();
    return sortedPlaylist.filter((item) => {
      const matchesTitle = item.title.toLowerCase().includes(q);
      const matchesSession = item.session?.toString().includes(q);
      return matchesTitle || matchesSession;
    });
  }, [sortedPlaylist, searchQuery]);

  // Progress metrics
  const completedCount = useMemo(() => {
    return sortedPlaylist.filter((item) => item.completed).length;
  }, [sortedPlaylist]);

  const totalCount = sortedPlaylist.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Auto-scroll active lecture into view in the playlist
  useEffect(() => {
    if (activePlaylistItemRef.current) {
      activePlaylistItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [lecture?.id, lecture?.session, activeRightTab]);

  // Lock body scroll when player is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsCinemaMode((prev) => !prev);
      } else if (e.key === '[' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        if (prevLecture && onSelectLecture) onSelectLecture(prevLecture);
      } else if (e.key === ']' || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        if (nextLecture && onSelectLecture) onSelectLecture(nextLecture);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleToggleCurrentLectureCompleted();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prevLecture, nextLecture, onSelectLecture, lecture]);

  const handleToggleCurrentLectureCompleted = async () => {
    if (!lecture || !onToggleCompleted || isTogglingComplete) return;
    try {
      setIsTogglingComplete(true);
      await onToggleCompleted(lecture);
    } finally {
      setIsTogglingComplete(false);
    }
  };

  const handleToggleItemCompleted = async (
    e: React.MouseEvent,
    targetLecture: VideoPlayerLecture
  ) => {
    e.stopPropagation();
    if (!onToggleCompleted || togglingItemId) return;
    try {
      setTogglingItemId(targetLecture.id || `${targetLecture.session}`);
      await onToggleCompleted(targetLecture);
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleSaveNotesClick = async () => {
    if (!lecture?.id || !onSaveNotes || isSavingNotes) return;
    try {
      setIsSavingNotes(true);
      await onSaveNotes(lecture.id, currentNotes);
      setNotesSaveStatus('Saved!');
      setTimeout(() => setNotesSaveStatus(null), 2000);
    } catch {
      setNotesSaveStatus('Failed to save');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleChangeDirectSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoElementRef.current) {
      videoElementRef.current.playbackRate = speed;
    }
  };

  if (!isOpen || !lecture) return null;

  const isDark = playerTheme === 'dark';

  return (
    <div
      id="video-player-page-frame"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-player-title"
      className={`fixed inset-0 z-50 w-full h-full flex flex-col overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
      }`}
    >
      {/* =========================================================================
          TOP NAVIGATION BAR: Clean, Minimal, Non-Intrusive UX
         ========================================================================= */}
      <header
        className={`h-14 px-4 sm:px-6 flex items-center justify-between gap-4 border-b shrink-0 z-20 ${
          isDark
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Left: Back Action & Clean Breadcrumb Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 border ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-800'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border-zinc-200'
            }`}
            title="Return to course overview (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 min-w-0 text-xs sm:text-sm truncate">
            {subjectTitle && (
              <>
                <span className={`truncate font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {subjectTitle}
                </span>
                <span className={isDark ? 'text-zinc-600' : 'text-zinc-300'}>/</span>
              </>
            )}
            <h1
              id="video-player-title"
              className="font-semibold truncate tracking-tight text-inherit"
              title={lecture.title}
            >
              {lecture.session !== undefined && `Session #${lecture.session}: `}
              {lecture.title}
            </h1>
          </div>
        </div>

        {/* Right: Essential Must-Have Controls (Theme Toggle, Cinema Toggle, Close) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle (Must Have) */}
          <button
            type="button"
            id="video-player-theme-toggle-btn"
            onClick={togglePlayerTheme}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
            }`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-zinc-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Cinema / Split View Mode Toggle */}
          <button
            type="button"
            id="video-player-cinema-toggle-btn"
            onClick={() => setIsCinemaMode((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isCinemaMode
                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                : isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border-zinc-200'
            }`}
            title={isCinemaMode ? 'Show Playlist sidebar (25%)' : 'Hide Sidebar for full-width cinema view'}
          >
            {isCinemaMode ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Show Playlist</span>
              </>
            ) : (
              <>
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cinema</span>
              </>
            )}
          </button>

          {/* Close Player */}
          <button
            type="button"
            id="video-player-close-btn"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
              isDark
                ? 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border-zinc-200'
            }`}
            title="Close video player (Esc)"
            aria-label="Close video player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          DYNAMIC FULL FRAME BODY: 75% Video on Left & 25% Sidebar on Right
         ========================================================================= */}
      <div className="flex-1 w-full flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* =======================================================================
            LEFT SECTION: 75% Screen Video Player Canvas
           ======================================================================= */}
        <main
          id="video-player-75-percent-frame"
          className={`flex flex-col min-w-0 min-h-0 relative h-full bg-black ${
            isCinemaMode
              ? 'w-full flex-1'
              : 'w-full lg:w-[75%] lg:flex-[0_0_75%]'
          }`}
        >
          {/* Video Viewport - Edge-to-edge responsive embed */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center bg-black overflow-hidden select-none">
            {parsedVideo.type === 'direct' ? (
              /* Direct HTML5 Video Player */
              <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
                <video
                  ref={videoElementRef}
                  src={parsedVideo.embedUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full max-h-full object-contain bg-black"
                />
                {/* HTML5 Speed Controls Bar */}
                <div
                  className={`w-full flex items-center justify-between px-4 py-1.5 text-xs border-t shrink-0 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                  }`}
                >
                  <span className="text-zinc-400">Direct Video</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400 mr-1">Speed:</span>
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleChangeDirectSpeed(spd)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                          playbackSpeed === spd
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : parsedVideo.embedUrl ? (
              /* In-Website YouTube, Vimeo, Google Drive Embed Player */
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <iframe
                  key={parsedVideo.embedUrl}
                  id="professional-video-iframe"
                  src={parsedVideo.embedUrl}
                  title={lecture.title}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              /* Empty state when lecture has no video URL */
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  <Video className="w-7 h-7" />
                </div>
                <h2 className="text-base font-semibold text-white mb-1.5">
                  No Video for this Session
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Session #{lecture.session}: "{lecture.title}" does not currently have an embedded video link.
                </p>
                {nextVideoLecture && onSelectLecture && (
                  <button
                    type="button"
                    onClick={() => onSelectLecture(nextVideoLecture)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Next Lecture (#{nextVideoLecture.session})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Bar: Mark Completed & Smooth Lecture Navigation */}
          <footer
            className={`px-4 sm:px-6 py-3 border-t flex items-center justify-between gap-4 shrink-0 z-10 ${
              isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                : 'bg-white border-zinc-200 text-zinc-700'
            }`}
          >
            {/* Mark as Completed Action */}
            <div className="flex items-center gap-3">
              {onToggleCompleted && (
                <button
                  type="button"
                  id="video-player-toggle-complete-btn"
                  onClick={handleToggleCurrentLectureCompleted}
                  disabled={isTogglingComplete}
                  className={`h-9 px-4 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
                    lecture.completed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : isDark
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300'
                  }`}
                  title={lecture.completed ? 'Click to mark incomplete' : 'Click to mark completed'}
                >
                  {isTogglingComplete ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : lecture.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  )}
                  <span>{lecture.completed ? 'Completed' : 'Mark Complete'}</span>
                </button>
              )}
            </div>

            {/* Navigation Controls: Previous / Next Lecture */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="video-player-prev-btn"
                onClick={() => prevLecture && onSelectLecture && onSelectLecture(prevLecture)}
                disabled={!prevLecture}
                className={`h-9 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                }`}
                title={prevLecture ? `Previous: #${prevLecture.session} ${prevLecture.title}` : 'First lecture'}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span
                className={`text-xs px-2 select-none ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                {currentIndex >= 0 ? `${currentIndex + 1} of ${sortedPlaylist.length}` : ''}
              </span>

              <button
                type="button"
                id="video-player-next-btn"
                onClick={() => nextLecture && onSelectLecture && onSelectLecture(nextLecture)}
                disabled={!nextLecture}
                className={`h-9 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                }`}
                title={nextLecture ? `Next: #${nextLecture.session} ${nextLecture.title}` : 'Last lecture'}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </main>

        {/* =======================================================================
            RIGHT SECTION: 25% Screen Playlist & Notes Sidebar (Clean & Easy to Use)
           ======================================================================= */}
        {!isCinemaMode && (
          <aside
            id="video-player-25-percent-playlist-frame"
            className={`w-full lg:w-[25%] lg:flex-[0_0_25%] flex flex-col border-t lg:border-t-0 lg:border-l min-w-0 min-h-0 shrink-0 h-auto lg:h-full overflow-hidden transition-colors ${
              isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                : 'bg-zinc-50 border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Clean Segmented Tab Switcher: Playlist vs Notes */}
            <div
              className={`p-3 border-b shrink-0 ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div
                className={`flex items-center gap-1 p-1 rounded-lg border ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <button
                  type="button"
                  id="video-player-tab-playlist"
                  onClick={() => setActiveRightTab('playlist')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeRightTab === 'playlist'
                      ? isDark
                        ? 'bg-zinc-800 text-white shadow-xs'
                        : 'bg-white text-zinc-900 shadow-xs'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <ListVideo className="w-3.5 h-3.5" />
                  <span>Playlist ({sortedPlaylist.length})</span>
                </button>

                {onSaveNotes && (
                  <button
                    type="button"
                    id="video-player-tab-notes"
                    onClick={() => setActiveRightTab('notes')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeRightTab === 'notes'
                        ? isDark
                          ? 'bg-zinc-800 text-white shadow-xs'
                          : 'bg-white text-zinc-900 shadow-xs'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Notes</span>
                    {lecture.notes && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                )}
              </div>

              {/* Progress Summary and Search (in Playlist tab) */}
              {activeRightTab === 'playlist' && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>
                      {completedCount} of {totalCount} completed
                    </span>
                    <span className="font-medium text-emerald-500">
                      {completionPercent}%
                    </span>
                  </div>

                  {/* Sleek Progress Bar */}
                  <div
                    className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                    }`}
                  >
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  {/* Simple Search Input */}
                  {sortedPlaylist.length > 3 && (
                    <div className="relative pt-1">
                      <Search
                        className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pt-0.5 ${
                          isDark ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Filter lectures..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border focus:outline-none transition-colors ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700'
                            : 'bg-white border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-300'
                        }`}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 pt-0.5 ${
                            isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TAB 1: Streamlined Playlist List */}
            {activeRightTab === 'playlist' && (
              <div
                id="video-player-playlist-list"
                className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-0"
              >
                {filteredPlaylist.length === 0 ? (
                  <div
                    className={`py-10 text-center text-xs ${
                      isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    No matching lectures found
                  </div>
                ) : (
                  filteredPlaylist.map((item, idx) => {
                    const isCurrent =
                      (item.id && item.id === lecture.id) ||
                      item.session === lecture.session;

                    return (
                      <div
                        key={item.id || idx}
                        ref={isCurrent ? activePlaylistItemRef : null}
                        onClick={() => onSelectLecture && onSelectLecture(item)}
                        className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-3 cursor-pointer border select-none ${
                          isCurrent
                            ? isDark
                              ? 'bg-zinc-900 text-white border-zinc-700 font-semibold shadow-xs'
                              : 'bg-white text-zinc-900 border-zinc-300 font-semibold shadow-xs'
                            : isDark
                            ? 'bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300 border-transparent hover:border-zinc-800'
                            : 'bg-transparent hover:bg-white text-zinc-700 border-transparent hover:border-zinc-200'
                        }`}
                      >
                        {/* Completion Checkmark Button */}
                        {onToggleCompleted && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleItemCompleted(e, item)}
                            disabled={togglingItemId === (item.id || `${item.session}`)}
                            className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
                              item.completed
                                ? 'text-emerald-500 hover:text-emerald-400'
                                : isDark
                                ? 'text-zinc-600 hover:text-zinc-400'
                                : 'text-zinc-400 hover:text-zinc-600'
                            }`}
                            title={item.completed ? 'Mark incomplete' : 'Mark completed'}
                          >
                            {togglingItemId === (item.id || `${item.session}`) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : item.completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Title and Session Info */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs leading-snug truncate ${
                              isCurrent
                                ? isDark ? 'text-white' : 'text-zinc-900'
                                : isDark ? 'text-zinc-300' : 'text-zinc-700'
                            }`}
                            title={item.title}
                          >
                            <span className={`font-mono mr-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              #{item.session ?? idx + 1}
                            </span>
                            {item.title}
                          </p>
                        </div>

                        {/* Playing Status indicator or Play Icon */}
                        {isCurrent ? (
                          <span className="text-[10px] font-medium text-emerald-500 shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Playing
                          </span>
                        ) : (
                          item.videoUrl && (
                            <Play className={`w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                              isDark ? 'text-zinc-500' : 'text-zinc-400'
                            }`} />
                          )
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: Notes Section (Must Have) */}
            {activeRightTab === 'notes' && onSaveNotes && (
              <div
                id="video-player-notes-view"
                className={`flex-1 flex flex-col p-3.5 space-y-3 min-h-0 ${
                  isDark ? 'bg-zinc-950' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    Notes · Session #{lecture.session}
                  </span>
                  {notesSaveStatus && (
                    <span className="text-[11px] text-emerald-500 font-medium shrink-0 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {notesSaveStatus}
                    </span>
                  )}
                </div>

                <textarea
                  id="video-player-notes-textarea"
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Type your notes, formulas, or key timestamps here..."
                  className={`w-full flex-1 p-3 rounded-lg border text-xs resize-none font-sans leading-relaxed focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'
                  }`}
                  rows={10}
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    id="video-player-save-notes-btn"
                    onClick={handleSaveNotesClick}
                    disabled={isSavingNotes}
                    className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSavingNotes ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
