import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  Save,
  Loader2,
  Play,
  Sun,
  Moon,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ListVideo,
  Video,
  LayoutGrid,
  Tv,
  Search,
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

type PlayerTheme = 'dark' | 'white';
type DesktopTab = 'lectures' | 'notes';

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
  // Theme state: white or dark
  const [playerTheme, setPlayerTheme] = useState<PlayerTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('video_player_theme');
      if (saved === 'white' || saved === 'dark') return saved;
    }
    return 'white';
  });

  const togglePlayerTheme = () => {
    setPlayerTheme((prev) => {
      const next = prev === 'dark' ? 'white' : 'dark';
      try {
        localStorage.setItem('video_player_theme', next);
      } catch {}
      return next;
    });
  };

  // Cinema mode (Desktop): toggles 75% video / 25% sidebar vs 100% full cinema video
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [desktopActiveTab, setDesktopActiveTab] = useState<DesktopTab>('lectures');
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('');

  // Notes state for inline/sidebar notes editor
  const [editingNotesLectureId, setEditingNotesLectureId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Toggle completion loading state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Mobile playlist dropdown accordion open/close state
  const [isMobilePlaylistOpen, setIsMobilePlaylistOpen] = useState(true);

  // Viewport breakpoint detection: exactly synchronized with Tailwind lg (min-width: 1024px)
  // Renders ONLY ONE video element at any instant to prevent duplicate audio/video streams or echoes
  const [isDesktopView, setIsDesktopView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 1024px)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktopView(e.matches);
    };
    handleMediaChange(mql);
    mql.addEventListener('change', handleMediaChange);
    return () => mql.removeEventListener('change', handleMediaChange);
  }, []);

  // Direct video controls state (HTML5 video)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoTopRef = useRef<HTMLDivElement | null>(null);
  const desktopPlaylistItemRef = useRef<HTMLDivElement | null>(null);

  // Sorted lectures list
  const sortedPlaylist = useMemo(() => {
    if (!playlist || playlist.length === 0) {
      return lecture ? [lecture] : [];
    }
    return [...playlist].sort((a, b) => (a.session ?? 0) - (b.session ?? 0));
  }, [playlist, lecture]);

  // Current lecture index
  const currentIndex = useMemo(() => {
    if (!lecture) return -1;
    return sortedPlaylist.findIndex(
      (item) => (item.id && item.id === lecture.id) || item.session === lecture.session
    );
  }, [lecture, sortedPlaylist]);

  // Prev & Next lecture calculations
  const prevLecture = currentIndex > 0 ? sortedPlaylist[currentIndex - 1] : null;
  const nextLecture =
    currentIndex >= 0 && currentIndex < sortedPlaylist.length - 1
      ? sortedPlaylist[currentIndex + 1]
      : null;

  // Next lecture with a video link if current has no video
  const nextVideoLecture = useMemo(() => {
    if (currentIndex < 0) return null;
    for (let i = currentIndex + 1; i < sortedPlaylist.length; i++) {
      if (sortedPlaylist[i].videoUrl && sortedPlaylist[i].videoUrl!.trim() !== '') {
        return sortedPlaylist[i];
      }
    }
    return null;
  }, [currentIndex, sortedPlaylist]);

  // Filtered lectures for desktop search
  const filteredPlaylist = useMemo(() => {
    if (!desktopSearchQuery.trim()) return sortedPlaylist;
    const q = desktopSearchQuery.toLowerCase();
    return sortedPlaylist.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSession = item.session?.toString().includes(q);
      return matchTitle || matchSession;
    });
  }, [sortedPlaylist, desktopSearchQuery]);

  // Parse current video embed url
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

  // Sync draft notes whenever active lecture changes
  useEffect(() => {
    if (lecture) {
      setNotesDraft(lecture.notes || '');
      setSaveSuccessMsg(null);
    }
  }, [lecture?.id, lecture?.notes]);

  // Auto-scroll active lecture into view in desktop sidebar
  useEffect(() => {
    if (desktopPlaylistItemRef.current) {
      desktopPlaylistItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [lecture?.id, lecture?.session, desktopActiveTab]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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
        if (lecture) handleToggleCompletedLecture(lecture);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prevLecture, nextLecture, onSelectLecture, lecture]);

  // Toggle mark done for current or any lecture
  const handleToggleCompletedLecture = async (targetLecture: VideoPlayerLecture) => {
    if (!onToggleCompleted || togglingId) return;
    const targetKey = targetLecture.id || `${targetLecture.session}`;
    try {
      setTogglingId(targetKey);
      await onToggleCompleted(targetLecture);
    } finally {
      setTogglingId(null);
    }
  };

  // Open / toggle notes editor for a lecture
  const handleOpenNotes = (e: React.MouseEvent, targetLecture: VideoPlayerLecture) => {
    e.stopPropagation();
    const targetKey = targetLecture.id || `${targetLecture.session}`;
    if (editingNotesLectureId === targetKey) {
      setEditingNotesLectureId(null);
      setSaveSuccessMsg(null);
    } else {
      setEditingNotesLectureId(targetKey);
      setNotesDraft(targetLecture.notes || '');
      setSaveSuccessMsg(null);
    }
  };

  // Save notes handler
  const handleSaveNotes = async (targetLecture: VideoPlayerLecture) => {
    if (!targetLecture.id || !onSaveNotes || isSavingNotes) return;
    try {
      setIsSavingNotes(true);
      await onSaveNotes(targetLecture.id, notesDraft);
      setSaveSuccessMsg('Notes saved successfully');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch {
      setSaveSuccessMsg('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Select a lecture and scroll video player into view on mobile
  const handleSelectLecture = (targetLecture: VideoPlayerLecture) => {
    if (onSelectLecture) {
      onSelectLecture(targetLecture);
    }
    if (mobileVideoTopRef.current) {
      mobileVideoTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const completedCount = sortedPlaylist.filter((l) => l.completed).length;

  return (
    <div
      id="video-player-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-player-modal-heading"
      className={`fixed inset-0 z-50 w-full h-full flex flex-col overflow-hidden transition-colors duration-150 ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* =========================================================================
          MODE A: MOBILE SIZE SCREEN (< lg breakpoint)
          Simply just a small back button and then subject name.
          Then below that 16:9 ratio video lecture frame.
          Then lecture name.
          Then remaining classes or lectures in normal format with notes icon.
          Green highlight if marked as done, normal format if not done!
         ========================================================================= */}
      <div id="mobile-video-player-view" className="lg:hidden flex flex-col w-full h-full overflow-hidden">
        {/* Mobile Top Bar: Small Back Button & Subject Name */}
        <header
          id="mobile-player-header"
          className={`h-12 px-3 flex items-center justify-between gap-3 border-b shrink-0 z-40 transition-colors ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              id="mobile-player-back-btn"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95 border ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Back (Esc)"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <h1
              id="mobile-player-subject-name"
              className="text-sm font-bold tracking-tight truncate select-none"
              title={subjectTitle || 'Subject Lectures'}
            >
              {subjectTitle || 'Subject Lectures'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="mobile-player-theme-btn"
              onClick={togglePlayerTheme}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-zinc-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              id="mobile-player-close-btn"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border-slate-200'
              }`}
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Scrollable Body */}
        <div
          id="mobile-player-scroll-body"
          ref={mobileVideoTopRef}
          className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col relative"
        >
          {/* 16:9 Ratio Video Lecture Frame (Sticky Frame 1) */}
          <div
            id="mobile-video-16-9-frame"
            style={{ top: 0 }}
            className="sticky top-0 z-30 w-full aspect-video bg-black relative shrink-0 overflow-hidden shadow-sm"
          >
            {!isDesktopView && (
              parsedVideo.type === 'direct' ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={videoElementRef}
                    key={parsedVideo.embedUrl}
                    src={parsedVideo.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
              ) : parsedVideo.embedUrl ? (
                <iframe
                  key={`mobile-${parsedVideo.embedUrl}`}
                  id="mobile-video-iframe"
                  src={parsedVideo.embedUrl}
                  title={lecture.title}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">
                    No video for this class
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mb-3">
                    Session #{lecture.session}: "{lecture.title}" has no video URL.
                  </p>
                  {nextVideoLecture && onSelectLecture && (
                    <button
                      type="button"
                      onClick={() => handleSelectLecture(nextVideoLecture)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Next Class (#{nextVideoLecture.session})</span>
                    </button>
                  )}
                </div>
              )
            )}
          </div>

          {/* Current Lecture Name & Mark Done Action (Sticky Frame 2) */}
          <div
            id="mobile-current-lecture-info"
            style={{ top: '56.25vw' }}
            className={`sticky top-[56.25vw] z-20 p-3.5 border-b flex items-start justify-between gap-3 shrink-0 transition-colors shadow-xs ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-0.5">
                <span>
                  {lecture.session !== undefined ? `Session #${lecture.session}` : 'Current Lecture'}
                </span>
                <span>•</span>
                <span>{currentIndex >= 0 ? `${currentIndex + 1} of ${sortedPlaylist.length}` : ''}</span>
                {lecture.completed && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Done
                  </span>
                )}
              </div>

              <h2 className="text-sm font-bold leading-snug tracking-tight text-inherit">
                {lecture.title}
              </h2>
            </div>

            {onToggleCompleted && (
              <button
                type="button"
                id="mobile-mark-done-btn"
                onClick={() => handleToggleCompletedLecture(lecture)}
                disabled={togglingId === (lecture.id || `${lecture.session}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 border ${
                  lecture.completed
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                    : isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title={lecture.completed ? 'Click to mark incomplete' : 'Click to mark as done'}
              >
                {togglingId === (lecture.id || `${lecture.session}`) ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : lecture.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span>{lecture.completed ? 'Completed' : 'Mark Done'}</span>
              </button>
            )}
          </div>

          {/* Remaining Classes or Lectures in Normal Format with Dropdown */}
          <section id="mobile-remaining-lectures" className="p-3 w-full flex-1">
            {/* Playlist Dropdown Header Bar */}
            <div
              id="mobile-playlist-dropdown-bar"
              onClick={() => setIsMobilePlaylistOpen((prev) => !prev)}
              className={`mb-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer select-none transition-all ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-100'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <ListVideo className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold tracking-tight">Playlist</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {sortedPlaylist.length} Classes
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      • {completedCount}/{sortedPlaylist.length} done
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Quick Dropdown Select + Expand/Collapse Chevron */}
              <div
                className="flex items-center gap-1.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Dropdown Menu for Quick Jump */}
                <div className="relative">
                  <select
                    id="mobile-playlist-dropdown-select"
                    aria-label="See and select playlist lecture"
                    value={lecture.id || `${lecture.session}`}
                    onChange={(e) => {
                      const selected = sortedPlaylist.find(
                        (item) => (item.id || `${item.session}`) === e.target.value
                      );
                      if (selected) {
                        handleSelectLecture(selected);
                      }
                    }}
                    className={`text-[11px] font-medium py-1 pl-2 pr-5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[125px] sm:max-w-[170px] truncate ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                        : 'bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    {sortedPlaylist.map((item, idx) => (
                      <option
                        key={item.id || `${item.session ?? idx}`}
                        value={item.id || `${item.session ?? idx}`}
                      >
                        #{item.session ?? idx + 1} {item.title} {item.completed ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Dropdown Expand / Collapse Button */}
                <button
                  type="button"
                  id="mobile-playlist-dropdown-toggle-btn"
                  onClick={() => setIsMobilePlaylistOpen((prev) => !prev)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                  }`}
                  title={isMobilePlaylistOpen ? 'Collapse playlist' : 'Expand playlist'}
                  aria-label={isMobilePlaylistOpen ? 'Collapse playlist' : 'Expand playlist'}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMobilePlaylistOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Dropdown Body: Playlist Items or Collapsed State */}
            {isMobilePlaylistOpen ? (
              <div className="space-y-1.5">
              {sortedPlaylist.map((item, idx) => {
                const isCurrent =
                  (item.id && item.id === lecture.id) ||
                  item.session === lecture.session;
                const isDone = !!item.completed;
                const itemKey = item.id || `${item.session ?? idx}`;
                const isEditingNotes = editingNotesLectureId === itemKey;
                const isTogglingThis = togglingId === itemKey;

                return (
                  <div
                    key={itemKey}
                    id={`mobile-lecture-row-${item.session ?? idx}`}
                    className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                      isDone
                        ? isDark
                          ? 'bg-emerald-950/25 border-emerald-800/70 text-emerald-100 shadow-2xs'
                          : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                        : isCurrent
                        ? isDark
                          ? 'bg-zinc-900 border-zinc-700 text-white ring-1 ring-zinc-600'
                          : 'bg-white border-blue-300 text-slate-900 ring-1 ring-blue-400/40 shadow-2xs'
                        : isDark
                        ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div
                      onClick={() => handleSelectLecture(item)}
                      className="p-2.5 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                    >
                      {/* Left: Mark Done Checkbox & Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {onToggleCompleted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCompletedLecture(item);
                            }}
                            disabled={isTogglingThis}
                            className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                              isDone
                                ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                                : isDark
                                ? 'text-zinc-500 hover:text-zinc-300'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                          >
                            {isTogglingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isDone ? (
                              <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white dark:fill-emerald-400 dark:text-zinc-950" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isDone
                                ? isDark
                                  ? 'text-emerald-200 font-bold'
                                  : 'text-emerald-900 font-bold'
                                : isCurrent
                                ? isDark
                                  ? 'text-white font-bold'
                                  : 'text-blue-900 font-bold'
                                : isDark
                                ? 'text-zinc-200'
                                : 'text-slate-800'
                            }`}
                          >
                            <span
                              className={`font-mono mr-1.5 text-xs ${
                                isDone
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : isDark
                                  ? 'text-zinc-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              #{item.session ?? idx + 1}
                            </span>
                            {item.title}
                          </p>
                        </div>
                      </div>

                      {/* Right: Notes Icon & Current Indicator */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCurrent && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                              isDone ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                            }`}
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Playing</span>
                          </span>
                        )}

                        <button
                          type="button"
                          id={`mobile-notes-btn-${item.session ?? idx}`}
                          onClick={(e) => handleOpenNotes(e, item)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
                            isEditingNotes
                              ? 'bg-amber-500 text-white'
                              : isDone
                              ? 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                              : isDark
                              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                          title={item.notes ? 'View notes (Notes exist)' : 'Add notes'}
                        >
                          <FileText className="w-4 h-4" />
                          {item.notes && !isEditingNotes && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1" />
                          )}
                        </button>

                        <ChevronRight
                          className={`w-3.5 h-3.5 ${
                            isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Inline notes expander on mobile */}
                    {isEditingNotes && onSaveNotes && (
                      <div
                        className={`p-3 border-t transition-colors ${
                          isDark
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                            : 'bg-amber-50/60 border-amber-200 text-slate-900'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                            <span>Notes · #{item.session ?? idx + 1}</span>
                          </span>
                          {saveSuccessMsg && (
                            <span className="text-[11px] font-semibold text-emerald-600">
                              {saveSuccessMsg}
                            </span>
                          )}
                        </div>

                        <textarea
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          placeholder="Add study notes, formulas, or key concepts for this lecture..."
                          rows={3}
                          className={`w-full p-2 rounded-lg text-xs resize-none border focus:outline-none transition-colors ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500'
                              : 'bg-white border-amber-200 text-slate-900 placeholder:text-slate-400'
                          }`}
                        />

                        <div className="flex items-center justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setEditingNotesLectureId(null)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNotes(item)}
                            disabled={isSavingNotes}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            {isSavingNotes ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            <span>Save Notes</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            ) : (
              <div
                onClick={() => setIsMobilePlaylistOpen(true)}
                className={`p-3.5 rounded-xl border border-dashed text-center cursor-pointer transition-colors ${
                  isDark
                    ? 'border-zinc-800 hover:border-zinc-700 text-zinc-400 bg-zinc-900/40 hover:bg-zinc-900/60'
                    : 'border-slate-300 hover:border-slate-400 text-slate-600 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                  <ListVideo className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tap to drop down full playlist ({sortedPlaylist.length} classes)</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* =========================================================================
          MODE B: WEBSITE / DESKTOP MODE (>= lg breakpoint)
          75% Screen Video on Left + Right Side Scrollable Other Lectures!
         ========================================================================= */}
      <div id="desktop-video-player-view" className="hidden lg:flex flex-col w-full h-full overflow-hidden">
        {/* Desktop Top Header Bar */}
        <header
          id="desktop-player-header"
          className={`h-14 px-6 flex items-center justify-between gap-4 border-b shrink-0 z-20 ${
            isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Left: Back Button & Subject / Lecture Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              id="desktop-player-back-btn"
              onClick={onClose}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 border ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
              }`}
              title="Return to course overview (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2 min-w-0 text-sm truncate">
              {subjectTitle && (
                <>
                  <span className={`truncate font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {subjectTitle}
                  </span>
                  <span className={isDark ? 'text-zinc-600' : 'text-slate-300'}>/</span>
                </>
              )}
              <h1
                id="video-player-modal-heading"
                className="font-bold truncate tracking-tight text-inherit"
                title={lecture.title}
              >
                {lecture.session !== undefined && `Session #${lecture.session}: `}
                {lecture.title}
              </h1>
            </div>
          </div>

          {/* Right: Mark Done, Theme, Cinema & Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mark Done */}
            {onToggleCompleted && (
              <button
                type="button"
                id="desktop-header-mark-done-btn"
                onClick={() => handleToggleCompletedLecture(lecture)}
                disabled={togglingId === (lecture.id || `${lecture.session}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                  lecture.completed
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                    : isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {togglingId === (lecture.id || `${lecture.session}`) ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : lecture.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span>{lecture.completed ? 'Completed' : 'Mark Done'}</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              type="button"
              id="desktop-theme-toggle-btn"
              onClick={togglePlayerTheme}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Cinema / Fullscreen mode toggle */}
            <button
              type="button"
              id="desktop-cinema-toggle-btn"
              onClick={() => setIsCinemaMode((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isCinemaMode
                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                  : isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
              }`}
              title={isCinemaMode ? 'Show Lectures Sidebar (25%)' : 'Hide Sidebar for full cinema video'}
            >
              {isCinemaMode ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Show Lectures</span>
                </>
              ) : (
                <>
                  <Tv className="w-3.5 h-3.5" />
                  <span>Cinema</span>
                </>
              )}
            </button>

            {/* Close */}
            <button
              type="button"
              id="desktop-close-btn"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-slate-200'
              }`}
              title="Close video player (Esc)"
              aria-label="Close video player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Desktop Split Body: 75% Screen Video on Left & 25% Scrollable Lectures on Right */}
        <div className="flex-1 w-full flex min-h-0 overflow-hidden relative">
          {/* ===================================================================
              LEFT: 75% SCREEN VIDEO CANVAS
             =================================================================== */}
          <main
            id="desktop-75-percent-video-canvas"
            className={`flex flex-col min-w-0 min-h-0 relative h-full bg-black ${
              isCinemaMode ? 'w-full flex-1' : 'w-full lg:w-[75%] lg:flex-[0_0_75%]'
            }`}
          >
            {/* Edge-to-edge Video Viewport */}
            <div className="flex-1 w-full h-full relative flex items-center justify-center bg-black overflow-hidden select-none">
              {isDesktopView && (
                parsedVideo.type === 'direct' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
                    <video
                      ref={videoElementRef}
                      key={parsedVideo.embedUrl}
                      src={parsedVideo.embedUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full max-h-full object-contain bg-black"
                    />
                    {/* Speed Controls Bar */}
                    <div
                      className={`w-full flex items-center justify-between px-4 py-1.5 text-xs border-t shrink-0 ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-900 border-zinc-800 text-zinc-200'
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
                  <div className="w-full h-full relative flex items-center justify-center bg-black">
                    <iframe
                      key={parsedVideo.embedUrl}
                      id="desktop-75-percent-iframe"
                      src={parsedVideo.embedUrl}
                      title={lecture.title}
                      className="w-full h-full border-0 absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto text-white">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-zinc-900 border border-zinc-800 text-zinc-400">
                      <Video className="w-7 h-7" />
                    </div>
                    <h2 className="text-base font-semibold mb-1">No Video for this Session</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                      Session #{lecture.session}: "{lecture.title}" does not currently have an embedded video link.
                    </p>
                    {nextVideoLecture && onSelectLecture && (
                      <button
                        type="button"
                        onClick={() => handleSelectLecture(nextVideoLecture)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Play Next Lecture (#{nextVideoLecture.session})</span>
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Bottom Controls Bar */}
            <footer
              className={`px-6 py-3 border-t flex items-center justify-between gap-4 shrink-0 z-10 ${
                isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {/* Lecture Title & Session */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                <span className="font-semibold text-xs text-slate-400 dark:text-zinc-500 shrink-0">
                  {lecture.session !== undefined ? `#${lecture.session}` : ''}
                </span>
                <span className="font-semibold text-xs text-inherit truncate">
                  {lecture.title}
                </span>
                {lecture.completed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                    Done
                  </span>
                )}
              </div>

              {/* Prev / Next Navigation Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="desktop-prev-lecture-btn"
                  onClick={() => prevLecture && handleSelectLecture(prevLecture)}
                  disabled={!prevLecture}
                  className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border ${
                    isDark
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                  title={prevLecture ? `Previous: #${prevLecture.session} ${prevLecture.title}` : 'First lecture'}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="text-xs px-2 select-none text-slate-400 dark:text-zinc-500 font-mono">
                  {currentIndex >= 0 ? `${currentIndex + 1} / ${sortedPlaylist.length}` : ''}
                </span>

                <button
                  type="button"
                  id="desktop-next-lecture-btn"
                  onClick={() => nextLecture && handleSelectLecture(nextLecture)}
                  disabled={!nextLecture}
                  className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border ${
                    isDark
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                  title={nextLecture ? `Next: #${nextLecture.session} ${nextLecture.title}` : 'Last lecture'}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </footer>
          </main>

          {/* ===================================================================
              RIGHT: 25% SCREEN SCROLLABLE OTHERS LECTURES SIDEBAR
             =================================================================== */}
          {!isCinemaMode && (
            <aside
              id="desktop-25-percent-lectures-sidebar"
              className={`w-full lg:w-[25%] lg:flex-[0_0_25%] flex flex-col border-l min-w-0 min-h-0 shrink-0 h-full overflow-hidden transition-colors ${
                isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {/* Sidebar Header & Tab Switcher */}
              <div
                className={`p-3 border-b shrink-0 ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center gap-1 p-1 rounded-lg border ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setDesktopActiveTab('lectures')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      desktopActiveTab === 'lectures'
                        ? isDark
                          ? 'bg-zinc-800 text-white shadow-2xs'
                          : 'bg-white text-slate-900 shadow-2xs'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Lectures ({sortedPlaylist.length})</span>
                  </button>

                  {onSaveNotes && (
                    <button
                      type="button"
                      onClick={() => setDesktopActiveTab('notes')}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        desktopActiveTab === 'notes'
                          ? isDark
                            ? 'bg-zinc-800 text-white shadow-2xs'
                            : 'bg-white text-slate-900 shadow-2xs'
                          : isDark
                          ? 'text-zinc-400 hover:text-zinc-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Notes</span>
                      {lecture.notes && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    </button>
                  )}
                </div>

                {/* Progress summary & search */}
                {desktopActiveTab === 'lectures' && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                        {completedCount} of {sortedPlaylist.length} completed
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {sortedPlaylist.length > 0 ? Math.round((completedCount / sortedPlaylist.length) * 100) : 0}%
                      </span>
                    </div>

                    <div
                      className={`w-full h-1 rounded-full overflow-hidden ${
                        isDark ? 'bg-zinc-800' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            sortedPlaylist.length > 0
                              ? Math.round((completedCount / sortedPlaylist.length) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    {sortedPlaylist.length > 3 && (
                      <div className="relative">
                        <Search
                          className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                            isDark ? 'text-zinc-500' : 'text-slate-400'
                          }`}
                        />
                        <input
                          type="text"
                          placeholder="Search lectures..."
                          value={desktopSearchQuery}
                          onChange={(e) => setDesktopSearchQuery(e.target.value)}
                          className={`w-full pl-8 pr-7 py-1 text-xs rounded-lg border focus:outline-none transition-colors ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700'
                              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                          }`}
                        />
                        {desktopSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDesktopSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TAB 1: Scrollable List of Other Lectures */}
              {desktopActiveTab === 'lectures' && (
                <div
                  id="desktop-lectures-scrollable-list"
                  className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar min-h-0"
                >
                  {filteredPlaylist.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                      No matching lectures found
                    </div>
                  ) : (
                    filteredPlaylist.map((item, idx) => {
                      const isCurrent =
                        (item.id && item.id === lecture.id) ||
                        item.session === lecture.session;
                      const isDone = !!item.completed;
                      const itemKey = item.id || `${item.session ?? idx}`;
                      const isEditingNotes = editingNotesLectureId === itemKey;
                      const isTogglingThis = togglingId === itemKey;

                      return (
                        <div
                          key={itemKey}
                          ref={isCurrent ? desktopPlaylistItemRef : null}
                          className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                            isDone
                              ? isDark
                                ? 'bg-emerald-950/25 border-emerald-800/70 text-emerald-100 shadow-2xs'
                                : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                              : isCurrent
                              ? isDark
                                ? 'bg-zinc-900 border-zinc-700 text-white ring-1 ring-zinc-600'
                                : 'bg-white border-blue-300 text-slate-900 ring-1 ring-blue-400/40 shadow-2xs'
                              : isDark
                              ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div
                            onClick={() => handleSelectLecture(item)}
                            className="p-2.5 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                          >
                            {/* Checkbox & Lecture Name */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {onToggleCompleted && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCompletedLecture(item);
                                  }}
                                  disabled={isTogglingThis}
                                  className={`p-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                                    isDone
                                      ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                                      : isDark
                                      ? 'text-zinc-500 hover:text-zinc-300'
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                  title={isDone ? 'Mark incomplete' : 'Mark done'}
                                >
                                  {isTogglingThis ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white dark:fill-emerald-400 dark:text-zinc-950" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-xs font-semibold truncate ${
                                    isDone
                                      ? isDark ? 'text-emerald-200 font-bold' : 'text-emerald-900 font-bold'
                                      : isCurrent
                                      ? isDark ? 'text-white font-bold' : 'text-blue-900 font-bold'
                                      : isDark ? 'text-zinc-200' : 'text-slate-800'
                                  }`}
                                  title={item.title}
                                >
                                  <span
                                    className={`font-mono mr-1 text-[11px] ${
                                      isDone
                                        ? 'text-emerald-700 dark:text-emerald-300'
                                        : isDark ? 'text-zinc-400' : 'text-slate-400'
                                    }`}
                                  >
                                    #{item.session ?? idx + 1}
                                  </span>
                                  {item.title}
                                </p>
                              </div>
                            </div>

                            {/* Right: Notes Icon & Status */}
                            <div className="flex items-center gap-1 shrink-0">
                              {isCurrent && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${
                                    isDone ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  <Play className="w-2 h-2 fill-current" />
                                  <span>Playing</span>
                                </span>
                              )}

                              {/* Notes icon */}
                              <button
                                type="button"
                                id={`desktop-notes-btn-${item.session ?? idx}`}
                                onClick={(e) => handleOpenNotes(e, item)}
                                className={`p-1 rounded-md transition-all cursor-pointer relative ${
                                  isEditingNotes
                                    ? 'bg-amber-500 text-white'
                                    : isDone
                                    ? 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                    : isDark
                                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                                title={item.notes ? 'View notes (Notes exist)' : 'Add notes'}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {item.notes && !isEditingNotes && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-0.5 right-0.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Inline notes on desktop */}
                          {isEditingNotes && onSaveNotes && (
                            <div
                              className={`p-2.5 border-t text-xs transition-colors ${
                                isDark
                                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                                  : 'bg-amber-50/60 border-amber-200 text-slate-900'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                  Notes · #{item.session ?? idx + 1}
                                </span>
                                {saveSuccessMsg && (
                                  <span className="text-[10px] font-semibold text-emerald-600">
                                    {saveSuccessMsg}
                                  </span>
                                )}
                              </div>
                              <textarea
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                                rows={2}
                                className={`w-full p-2 text-xs rounded border focus:outline-none ${
                                  isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-amber-200'
                                }`}
                              />
                              <div className="flex items-center justify-end gap-1.5 mt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingNotesLectureId(null)}
                                  className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveNotes(item)}
                                  disabled={isSavingNotes}
                                  className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: Notes Editor View for Current Lecture */}
              {desktopActiveTab === 'notes' && onSaveNotes && (
                <div
                  id="desktop-notes-view"
                  className={`flex-1 flex flex-col p-3.5 space-y-3 min-h-0 ${
                    isDark ? 'bg-zinc-950' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold truncate">
                      Notes · Session #{lecture.session}: {lecture.title}
                    </span>
                    {saveSuccessMsg && (
                      <span className="text-[11px] text-emerald-600 font-semibold shrink-0">
                        {saveSuccessMsg}
                      </span>
                    )}
                  </div>

                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Type lecture notes, formulas, or key timestamps here..."
                    className={`w-full flex-1 p-3 rounded-lg border text-xs resize-none leading-relaxed focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-300'
                    }`}
                    rows={10}
                  />

                  <button
                    type="button"
                    onClick={() => handleSaveNotes(lecture)}
                    disabled={isSavingNotes}
                    className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSavingNotes ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Notes</span>
                  </button>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
