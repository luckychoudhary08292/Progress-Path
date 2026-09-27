import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  ListVideo,
  FileText,
  Save,
  Loader2,
  Tv,
  HelpCircle,
  Search,
  Video,
  Play,
  LayoutGrid,
  Sun,
  Moon,
  ArrowLeft,
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
type PlaylistFilter = 'all' | 'uncompleted' | 'has_video';
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
  // Cinema mode toggles between 75% video / 25% playlist vs 100% video
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>('playlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistFilter, setPlaylistFilter] = useState<PlaylistFilter>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState<string | null>(null);
  const [isTogglingComplete, setIsTogglingComplete] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Theme state: allows switching between Neutral Sleek Dark and Clean Crisp White
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
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
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

  // Filtered playlist for the 25% sidebar search/filter
  const filteredPlaylist = useMemo(() => {
    return sortedPlaylist.filter((item) => {
      // Filter by search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSession = item.session?.toString().includes(q);
        if (!matchesTitle && !matchesSession) return false;
      }

      // Filter by filter tab
      if (playlistFilter === 'uncompleted') {
        return !item.completed;
      }
      if (playlistFilter === 'has_video') {
        return Boolean(item.videoUrl && item.videoUrl.trim() !== '');
      }

      return true;
    });
  }, [sortedPlaylist, searchQuery, playlistFilter]);

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
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsCinemaMode((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleBrowserFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        togglePlayerTheme();
      } else if (e.key === '[' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        if (prevLecture && onSelectLecture) {
          onSelectLecture(prevLecture);
        }
      } else if (e.key === ']' || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        if (nextLecture && onSelectLecture) {
          onSelectLecture(nextLecture);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleToggleCurrentLectureCompleted();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prevLecture, nextLecture, onSelectLecture, lecture]);

  // Lock body scroll when player is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleToggleBrowserFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleCopyLink = async () => {
    if (!lecture?.videoUrl) return;
    try {
      await navigator.clipboard.writeText(lecture.videoUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

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
      setNotesSaveStatus('Notes saved!');
      setTimeout(() => setNotesSaveStatus(null), 2500);
    } catch {
      setNotesSaveStatus('Failed to save notes');
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
      ref={playerContainerRef}
      className={`fixed inset-0 z-50 w-full h-full flex flex-col overflow-hidden transition-colors duration-200 select-none ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      }`}
    >
      {/* =========================================================================
          TOP DYNAMIC PAGE HEADER BAR: Clean, Full-Width, Dedicated Player Nav
         ========================================================================= */}
      <header
        className={`h-14 sm:h-15 px-3 sm:px-5 flex items-center justify-between gap-3 border-b shrink-0 z-20 ${
          isDark
            ? 'bg-zinc-950 border-zinc-800/90 text-zinc-100 shadow-md'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
        }`}
      >
        {/* Left: Back to Course Action & Active Lecture Details */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          {/* Back button giving authentic dynamic page feel */}
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700/80'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border-zinc-300/80'
            }`}
            title="Back to subject curriculum (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Playing indicator badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border ${
              isDark
                ? 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title="Now Playing in Website"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono text-[10px] tracking-wider">NOW PLAYING</span>
          </span>

          {lecture.session !== undefined && (
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded shrink-0 border ${
                isDark
                  ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                  : 'bg-zinc-100 text-zinc-800 border-zinc-300'
              }`}
            >
              #{lecture.session}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h1
              id="video-player-title"
              className="text-xs sm:text-sm font-semibold truncate tracking-tight"
              title={lecture.title}
            >
              {lecture.title}
            </h1>
            {subjectTitle && (
              <div
                className={`flex items-center gap-1 text-[11px] truncate ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                <BookOpen className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">{subjectTitle}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Theme Switcher (White/Dark), Layout Mode, Fullscreen & Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* WHITE / DARK THEME TOGGLE BUTTON */}
          <button
            type="button"
            id="video-player-theme-toggle-btn"
            onClick={togglePlayerTheme}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-zinc-700'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}
            title={
              isDark
                ? 'Switch to White / Light Mode (Shortcut: M)'
                : 'Switch to Dark Mode (Shortcut: M)'
            }
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">White Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-zinc-700" />
                <span className="hidden md:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* 75%/25% Split Screen vs 100% Full Cinema Mode Toggle */}
          <button
            type="button"
            id="video-player-cinema-toggle-btn"
            onClick={() => setIsCinemaMode((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isCinemaMode
                ? isDark
                  ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                  : 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                : isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border-zinc-300'
            }`}
            title={
              isCinemaMode
                ? 'Switch to 75% Video / 25% Playlist layout (Shortcut: T)'
                : 'Switch to Full Cinema View (Shortcut: T)'
            }
          >
            {isCinemaMode ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Show Playlist (25%)</span>
              </>
            ) : (
              <>
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Full Cinema</span>
              </>
            )}
          </button>

          {/* Copy Video URL */}
          {lecture.videoUrl && (
            <button
              type="button"
              id="video-player-copy-link-btn"
              onClick={handleCopyLink}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border-zinc-700'
                  : 'bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 border-zinc-300'
              }`}
              title={copiedLink ? 'Copied video URL!' : 'Copy video link'}
              aria-label="Copy video URL"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}

          {/* External Tab Fallback */}
          {lecture.videoUrl && (
            <a
              id="video-player-external-link"
              href={lecture.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-lg transition-colors inline-flex items-center border ${
                isDark
                  ? 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border-zinc-700'
                  : 'bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 border-zinc-300'
              }`}
              title="Open video in external YouTube tab"
              aria-label="Open on external site"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Keyboard Shortcuts Help Popover */}
          <div className="relative">
            <button
              type="button"
              id="video-player-shortcuts-help-btn"
              onClick={() => setShowShortcutsHelp((prev) => !prev)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                isDark
                  ? 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border-zinc-700'
                  : 'bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 border-zinc-300'
              }`}
              title="Keyboard Shortcuts & Tips"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {showShortcutsHelp && (
              <div
                id="video-player-shortcuts-popover"
                className={`absolute right-0 top-full mt-2 w-72 rounded-xl p-3.5 shadow-2xl text-xs z-50 border animate-in fade-in ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                    : 'bg-white border-zinc-300 text-zinc-800 shadow-xl'
                }`}
              >
                <div
                  className={`font-semibold mb-2 flex items-center justify-between pb-1.5 border-b ${
                    isDark ? 'border-zinc-800 text-white' : 'border-zinc-200 text-zinc-900'
                  }`}
                >
                  <span>Keyboard Shortcuts</span>
                  <button
                    type="button"
                    onClick={() => setShowShortcutsHelp(false)}
                    className={isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Close Player</span>
                    <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'}`}>
                      Esc
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Toggle Theme (White/Dark)</span>
                    <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'}`}>
                      M
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Toggle Cinema (100% / 75%)</span>
                    <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'}`}>
                      T
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Browser Fullscreen</span>
                    <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'}`}>
                      F
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Toggle Mark Completed</span>
                    <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'}`}>
                      C
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Previous / Next Lecture</span>
                    <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'}`}>
                      [ / ]
                    </kbd>
                  </div>
                </div>
                <div className={`mt-2.5 pt-2 border-t text-[10px] ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
                  💡 Click any lecture in the 25% playlist on the right to immediately switch and play.
                </div>
              </div>
            )}
          </div>

          {/* Close Player (Esc) */}
          <button
            type="button"
            id="video-player-close-btn"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
              isDark
                ? 'bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border-zinc-700'
                : 'bg-zinc-100 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 border-zinc-300'
            }`}
            title="Close Player (Esc)"
            aria-label="Close video player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          DYNAMIC FULL FRAME BODY: 75% Left Video & 25% Right Playlist
          Utilizes 100% of height and width with zero squeezing
         ========================================================================= */}
      <div className="flex-1 w-full flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* =======================================================================
            LEFT SECTION: 75% Screen Video Player (Pure Neutral Cinema Surround)
           ======================================================================= */}
        <main
          id="video-player-75-percent-frame"
          className={`flex flex-col min-w-0 min-h-0 relative h-full transition-all duration-200 bg-black ${
            isCinemaMode
              ? 'w-full flex-1'
              : 'w-full lg:w-[75%] lg:flex-[0_0_75%]'
          }`}
        >
          {/* Main Video Viewport - True Full Bleed Fit */}
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
                  <span className="font-semibold text-zinc-400">Direct Video Player</span>
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
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-600'
                  }`}
                >
                  <Video className="w-8 h-8" />
                </div>
                <h2 className="text-base font-semibold text-white mb-1.5">
                  No Video Attached to this Session
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

          {/* Bottom Controls Bar of the 75% Video Frame */}
          <div
            className={`px-4 sm:px-6 py-2.5 sm:py-3 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 z-10 ${
              isDark
                ? 'bg-zinc-950 border-zinc-800/90 text-zinc-300'
                : 'bg-white border-zinc-200 text-zinc-700 shadow-xs'
            }`}
          >
            {/* Mark as Completed Action */}
            <div className="flex items-center gap-2.5">
              {onToggleCompleted && (
                <button
                  type="button"
                  id="video-player-toggle-complete-btn"
                  onClick={handleToggleCurrentLectureCompleted}
                  disabled={isTogglingComplete}
                  className={`py-1.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                    lecture.completed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-1 ring-emerald-500 shadow-emerald-950/40'
                      : isDark
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-emerald-600/60'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 hover:border-emerald-600/60'
                  }`}
                  title={
                    lecture.completed
                      ? 'Click to mark incomplete (Shortcut: C)'
                      : 'Click to mark completed (Shortcut: C)'
                  }
                >
                  {isTogglingComplete ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : lecture.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  )}
                  <span>{lecture.completed ? 'Completed' : 'Mark as Complete'}</span>
                </button>
              )}

              {lecture.completed && (
                <span className="text-[11px] font-medium text-emerald-500 hidden sm:inline">
                  ✓ Topic mastered
                </span>
              )}
            </div>

            {/* Navigation Controls: Previous / Next Lecture */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="video-player-prev-btn"
                onClick={() => prevLecture && onSelectLecture && onSelectLecture(prevLecture)}
                disabled={!prevLecture}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                }`}
                title={
                  prevLecture
                    ? `Previous lecture: #${prevLecture.session} ${prevLecture.title} (Shortcut: [)`
                    : 'First lecture in playlist'
                }
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span
                className={`text-xs font-mono px-2 hidden md:inline ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                {currentIndex >= 0
                  ? `Lecture ${currentIndex + 1} of ${sortedPlaylist.length}`
                  : ''}
              </span>

              <button
                type="button"
                id="video-player-next-btn"
                onClick={() => nextLecture && onSelectLecture && onSelectLecture(nextLecture)}
                disabled={!nextLecture}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                }`}
                title={
                  nextLecture
                    ? `Next lecture: #${nextLecture.session} ${nextLecture.title} (Shortcut: ])`
                    : 'Last lecture in playlist'
                }
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* =======================================================================
            RIGHT SECTION: 25% Screen Playlist / Notes Sidebar
            Dynamic, High-Contrast & Sleek White/Dark Support
           ======================================================================= */}
        {!isCinemaMode && (
          <aside
            id="video-player-25-percent-playlist-frame"
            className={`w-full lg:w-[25%] lg:flex-[0_0_25%] flex flex-col border-t lg:border-t-0 lg:border-l min-w-0 min-h-0 shrink-0 h-auto lg:h-full overflow-hidden transition-colors ${
              isDark
                ? 'bg-zinc-950 border-zinc-800/90 text-zinc-100'
                : 'bg-zinc-50 border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Playlist Header & Tab Bar */}
            <div
              className={`p-3 sm:p-3.5 border-b shrink-0 ${
                isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ListVideo className="w-4 h-4 text-emerald-500 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider truncate">
                    Course Playlist
                  </h3>
                </div>
                <span
                  className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border shrink-0 ${
                    isDark
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                  }`}
                >
                  {completedCount}/{totalCount} done
                </span>
              </div>

              {/* Course Progress bar */}
              <div
                className={`w-full h-1.5 rounded-full overflow-hidden mb-2.5 ${
                  isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                }`}
              >
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>

              {/* Switcher Tabs: Playlist vs Study Notes */}
              <div
                className={`flex items-center gap-1 p-0.5 rounded-lg border ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-800'
                    : 'bg-zinc-100 border-zinc-200'
                }`}
              >
                <button
                  type="button"
                  id="video-player-tab-playlist"
                  onClick={() => setActiveRightTab('playlist')}
                  className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeRightTab === 'playlist'
                      ? isDark
                        ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/60'
                        : 'bg-white text-zinc-900 shadow-xs border border-zinc-300/80'
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
                    className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeRightTab === 'notes'
                        ? isDark
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-600 text-white shadow-xs'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Notes</span>
                    {lecture.notes && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                )}
              </div>

              {/* Search & Filter Controls */}
              {activeRightTab === 'playlist' && sortedPlaylist.length > 2 && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="relative">
                    <Search
                      className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                        isDark ? 'text-zinc-500' : 'text-zinc-400'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Search lectures..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border focus:outline-none transition-colors ${
                        isDark
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-600'
                          : 'bg-white border-zinc-300 text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                          isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px]">
                    {(['all', 'uncompleted', 'has_video'] as PlaylistFilter[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setPlaylistFilter(f)}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer border ${
                          playlistFilter === f
                            ? isDark
                              ? 'bg-zinc-800 text-white font-semibold border-zinc-700'
                              : 'bg-white text-zinc-900 font-semibold border-zinc-300 shadow-xs'
                            : isDark
                            ? 'text-zinc-400 hover:text-zinc-300 border-transparent'
                            : 'text-zinc-600 hover:text-zinc-800 border-transparent'
                        }`}
                      >
                        {f === 'all'
                          ? 'All'
                          : f === 'uncompleted'
                          ? 'Pending'
                          : 'With Video'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tab 1: Scrollable Playlist of Other Lectures */}
            {activeRightTab === 'playlist' && (
              <div
                id="video-player-playlist-list"
                className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1.5 custom-scrollbar min-h-0"
              >
                {filteredPlaylist.length === 0 ? (
                  <div
                    className={`py-8 text-center text-xs ${
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
                    const hasVideo = Boolean(item.videoUrl && item.videoUrl.trim() !== '');

                    return (
                      <div
                        key={item.id || idx}
                        ref={isCurrent ? activePlaylistItemRef : null}
                        onClick={() => onSelectLecture && onSelectLecture(item)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border group ${
                          isCurrent
                            ? isDark
                              ? 'bg-zinc-900 text-white border-zinc-600 ring-1 ring-zinc-500/40 shadow-md'
                              : 'bg-white text-zinc-900 border-zinc-400 ring-1 ring-zinc-300 shadow-md'
                            : isDark
                            ? 'bg-zinc-950 hover:bg-zinc-900/90 text-zinc-300 border-zinc-900 hover:border-zinc-800'
                            : 'bg-zinc-100/70 hover:bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        {/* Session Number & Status Indicator */}
                        <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                          <span
                            className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                              isCurrent
                                ? isDark
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-emerald-600 text-white border-emerald-600'
                                : isDark
                                ? 'bg-zinc-900 text-zinc-400 border-zinc-800 group-hover:text-zinc-200'
                                : 'bg-zinc-200 text-zinc-700 border-zinc-300 group-hover:text-zinc-900'
                            }`}
                          >
                            #{item.session ?? idx + 1}
                          </span>
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isCurrent && (
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                  isDark
                                    ? 'bg-rose-950 text-rose-400 border-rose-800'
                                    : 'bg-rose-100 text-rose-700 border-rose-300'
                                }`}
                              >
                                PLAYING
                              </span>
                            )}
                            <p
                              className={`text-xs font-medium leading-snug line-clamp-2 ${
                                isCurrent
                                  ? isDark
                                    ? 'text-white font-semibold'
                                    : 'text-zinc-900 font-semibold'
                                  : isDark
                                  ? 'text-zinc-300 group-hover:text-white'
                                  : 'text-zinc-700 group-hover:text-zinc-900'
                              }`}
                              title={item.title}
                            >
                              {item.title}
                            </p>
                          </div>

                          <div
                            className={`flex items-center gap-2 mt-1 text-[10px] ${
                              isDark ? 'text-zinc-400' : 'text-zinc-500'
                            }`}
                          >
                            {hasVideo ? (
                              <span className="inline-flex items-center gap-1 text-emerald-500">
                                <Video className="w-3 h-3" />
                                <span>Video</span>
                              </span>
                            ) : (
                              <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>
                                No video link
                              </span>
                            )}
                            {item.notes && (
                              <span className="inline-flex items-center gap-0.5 text-amber-500">
                                <FileText className="w-3 h-3" />
                                <span>Notes</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Completion Toggle Button right in playlist */}
                        {onToggleCompleted && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleItemCompleted(e, item)}
                            disabled={togglingItemId === (item.id || `${item.session}`)}
                            className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 mt-0.5 ${
                              item.completed
                                ? 'text-emerald-500 hover:text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40'
                                : isDark
                                ? 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'
                                : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200'
                            }`}
                            title={
                              item.completed
                                ? 'Mark as incomplete'
                                : 'Mark as completed'
                            }
                          >
                            {togglingItemId === (item.id || `${item.session}`) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : item.completed ? (
                              <CheckCircle2 className="w-4 h-4 fill-emerald-950/20" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Study Notes View in the 25% Column */}
            {activeRightTab === 'notes' && onSaveNotes && (
              <div
                id="video-player-notes-view"
                className={`flex-1 flex flex-col p-3 space-y-2.5 min-h-0 ${
                  isDark ? 'bg-zinc-950' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold truncate ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  >
                    Notes: #{lecture.session} {lecture.title}
                  </span>
                  {notesSaveStatus && (
                    <span className="text-[11px] text-emerald-500 font-medium shrink-0">
                      {notesSaveStatus}
                    </span>
                  )}
                </div>

                <textarea
                  id="video-player-notes-textarea"
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Take timestamped notes, formulas, or summaries while watching..."
                  className={`w-full flex-1 p-2.5 rounded-xl border text-xs resize-none font-sans leading-relaxed focus:outline-none ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500'
                  }`}
                  rows={10}
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    id="video-player-save-notes-btn"
                    onClick={handleSaveNotesClick}
                    disabled={isSavingNotes}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {isSavingNotes ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Notes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRightTab('playlist')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                    }`}
                  >
                    Back to Playlist
                  </button>
                </div>
              </div>
            )}

            {/* Bottom 25% Footer Bar */}
            <div
              className={`p-2 sm:px-3 border-t text-[10px] flex items-center justify-between shrink-0 ${
                isDark
                  ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
                  : 'bg-white border-zinc-200 text-zinc-500'
              }`}
            >
              <span>Click lecture to switch video</span>
              <span className="font-mono">Shortcuts: [ / ]</span>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
