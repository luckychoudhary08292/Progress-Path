import React, { useState, useEffect } from 'react';
import { SystemLogo } from './SystemLogo.tsx';
import studyDeskBanner from '../assets/images/study_desk_banner_1791446260071.jpg';
import desktopUiPreview from '../assets/images/desktop_ui_preview.png';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import {
  BookOpen,
  Code2,
  Calendar as CalendarIcon,
  ArrowRight,
  Shield,
  X,
  Mail,
  Github,
  Youtube,
  Laptop,
  Smartphone,
  Check,
  ChevronRight,
  Download,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

interface PlatformStats {
  totalUsers: number;
  totalLectures: number;
  completedLectures: number;
  leetcodeQuestions: number;
  usersWithTasks: number;
  totalTasksAdded: number;
}

export function LandingPage({
  onNavigateToLogin,
  onNavigateToSignup,
  onNavigateToTerms,
  onNavigateToPrivacy,
}: LandingPageProps) {
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | 'security' | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'desktop' | 'mobile' | 'coding'>('desktop');
  const [showPWAInstallGuide, setShowPWAInstallGuide] = useState(false);

  // Progressive Web App install prompt hook (supports Chromium Android/Desktop + iOS Safari flow)
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Real-time aggregate platform metrics
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 1,
    totalLectures: 10,
    completedLectures: 0,
    leetcodeQuestions: 150,
    usersWithTasks: 0,
    totalTasksAdded: 0,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const res = await fetch('/api/public-stats');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPlatformStats({
              totalUsers: typeof data.totalUsers === 'number' ? data.totalUsers : 1,
              totalLectures: typeof data.totalLectures === 'number' ? data.totalLectures : 10,
              completedLectures: typeof data.completedLectures === 'number' ? data.completedLectures : 0,
              leetcodeQuestions: typeof data.leetcodeQuestions === 'number' ? data.leetcodeQuestions : 150,
              usersWithTasks: typeof data.usersWithTasks === 'number' ? data.usersWithTasks : 0,
              totalTasksAdded: typeof data.totalTasksAdded === 'number' ? data.totalTasksAdded : 0,
            });
          }
        }
      } catch {
        // Fallback default stats
      }
    }

    loadStats();
    const timer = setInterval(loadStats, 25000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div
      id="landing-page-container"
      className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased"
    >
      {/* 1. TOP BAR NAVIGATION - Fixed / Stuck to Screen with Black Background */}
      <header
        id="landing-header"
        className="fixed top-0 left-0 right-0 z-50 w-full bg-black/95 backdrop-blur-md border-b border-zinc-800/90 shadow-md transition-colors"
      >
        <div className="w-full max-w-[1920px] mx-auto px-3.5 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 h-14 sm:h-18 flex items-center justify-between text-white bg-black">
          {/* Brand Wordmark & System Logo */}
          <div
            id="landing-brand-logo"
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <SystemLogo size="sm" />
            <span className="font-bold text-white tracking-tight text-base sm:text-xl">
              ProgressPath
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <button
              id="nav-login-btn"
              type="button"
              onClick={onNavigateToLogin}
              className="text-[11px] xs:text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white px-2 xs:px-2.5 sm:px-3.5 py-1 xs:py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-zinc-700 leading-tight"
            >
              Sign In
            </button>
            <button
              id="nav-signup-btn"
              type="button"
              onClick={onNavigateToSignup}
              className="text-[11px] xs:text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-2.5 xs:px-3 sm:px-5 py-1 xs:py-1.5 sm:py-2.5 rounded-md sm:rounded-lg transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer shadow-xs sm:shadow-sm hover:shadow leading-tight"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Header Height Spacer to guarantee perfect alignment below fixed header */}
      <div className="h-14 sm:h-18 w-full shrink-0" aria-hidden="true" />

      {/* 2. HERO SECTION - Big Screen Size Fitted Banner, Compact App-Style on Mobile */}
      <section
        id="hero-banner-section"
        className="relative w-full min-h-0 lg:min-h-[calc(100vh-4.5rem)] flex items-center bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-3.5 sm:py-10 lg:py-12 flex-1 flex items-center">
          <div className="w-full grid grid-cols-12 gap-2.5 sm:gap-6 lg:gap-10 xl:gap-14 2xl:gap-16 items-center">
            {/* Left Column: Left-Aligned Content (Aligned Horizontally on Mobile) */}
            <div className="col-span-7 sm:col-span-7 lg:col-span-7 xl:col-span-6 2xl:col-span-6 flex flex-col items-start text-left space-y-1.5 sm:space-y-5 lg:space-y-7 xl:space-y-8 z-10">
              {/* Mobile App pill tag */}
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] sm:text-[11px] font-semibold lg:hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="truncate">Next-Gen LMS</span>
              </div>

              {/* Left-Aligned Headline */}
              <h1
                id="hero-headline"
                className="text-sm xs:text-base sm:text-3xl md:text-5xl lg:text-[46px] xl:text-[56px] 2xl:text-[64px] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.2] sm:leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                Engineering Study &amp; Problem Tracking Without Clutter.
              </h1>

              {/* Left-Aligned Subtitle */}
              <p
                id="hero-subtext"
                className="text-[11px] sm:text-base lg:text-lg xl:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none"
              >
                Curated video lecture roadmaps, LeetCode problem vaults, and daily academic scheduling built for engineering students to maintain focused momentum across every laptop and display.
              </p>

              {/* Primary Action Buttons (Left-Aligned) */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 w-auto pt-0.5 sm:pt-1">
                <button
                  id="hero-signup-btn"
                  type="button"
                  onClick={onNavigateToSignup}
                  className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2.5 xs:px-3 sm:px-8 py-1 xs:py-1.5 sm:py-4 rounded-md sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] xs:text-xs sm:text-base transition-all cursor-pointer shadow-xs hover:shadow active:scale-98 leading-tight"
                >
                  <span className="sm:inline hidden">Start Learning Free</span>
                  <span className="sm:hidden inline">Start Free</span>
                  <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
                </button>

                {/* Nearby PWA Install / Download App Button */}
                <button
                  id="hero-pwa-install-btn"
                  type="button"
                  onClick={async () => {
                    if (isInstalled) {
                      // Already installed, show friendly confirmation
                      setShowPWAInstallGuide(true);
                      return;
                    }
                    if (isInstallable) {
                      const outcome = await install();
                      if (!outcome) {
                        setShowPWAInstallGuide(true);
                      }
                    } else {
                      // iOS Safari, Firefox, or browser without active beforeinstallprompt
                      setShowPWAInstallGuide(true);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2.5 xs:px-3 sm:px-6 py-1 xs:py-1.5 sm:py-4 rounded-md sm:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-[11px] xs:text-xs sm:text-base transition-all cursor-pointer border border-slate-300/80 dark:border-slate-700 shadow-xs hover:shadow active:scale-98 leading-tight"
                  title="Download and install ProgressPath as an app on your mobile or desktop"
                >
                  <Download className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="sm:inline hidden">
                    {isInstalled ? 'App Installed' : 'Download App (PWA)'}
                  </span>
                  <span className="sm:hidden inline">
                    {isInstalled ? 'Installed' : 'Download App'}
                  </span>
                </button>
              </div>

              {/* Trust Notes (Unboxed Metadata) */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[9px] xs:text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 pt-0 sm:pt-1">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Free</span>
                </span>
                <span aria-hidden="true">&bull;</span>
                <span>Private</span>
                <span aria-hidden="true">&bull;</span>
                <span>PWA</span>
              </div>
            </div>

            {/* Right Column: Attached Image (Aligned Horizontally on Mobile) */}
            <div className="col-span-5 sm:col-span-5 lg:col-span-5 xl:col-span-6 2xl:col-span-6 relative w-full h-auto self-center sm:self-auto sm:h-64 md:h-80 lg:h-[calc(100vh-9.5rem)] xl:h-[calc(100vh-9rem)] min-h-[135px] xs:min-h-[155px] sm:min-h-[240px] lg:min-h-[460px] max-h-[220px] sm:max-h-[340px] lg:max-h-[720px] flex items-center justify-center">
              <div className="relative w-full h-full min-h-[135px] xs:min-h-[155px] sm:min-h-[240px] rounded-lg sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 shadow-xs sm:shadow-2xl bg-slate-100 dark:bg-slate-900 group aspect-[4/3] sm:aspect-auto">
                {/* The Attached Study Desk Image */}
                <img
                  src={studyDeskBanner}
                  alt="Study desk with open textbook, notebooks, colorful pens, and library bookshelf"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />

                {/* 1. Left Partial Gradient Overlay */}
                <div
                  className="absolute inset-y-0 left-0 w-8 sm:w-40 lg:w-48 xl:w-60 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-slate-950 dark:via-slate-950/70 dark:to-transparent pointer-events-none"
                  aria-hidden="true"
                />

                {/* 2. Bottom Partial Gradient Overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 h-8 sm:h-44 bg-gradient-to-t from-white via-white/60 to-transparent dark:from-slate-950 dark:via-slate-950/60 dark:to-transparent pointer-events-none"
                  aria-hidden="true"
                />

                {/* 3. Top Partial Accent Gradient */}
                <div
                  className="absolute inset-x-0 top-0 h-6 sm:h-20 bg-gradient-to-b from-white/40 to-transparent dark:from-slate-950/40 dark:to-transparent pointer-events-none"
                  aria-hidden="true"
                />

                {/* Floating Study Focus Card */}
                <div className="absolute bottom-1.5 right-1.5 sm:bottom-6 sm:right-6 max-w-[125px] sm:max-w-sm p-1.5 sm:p-4 rounded-md sm:rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs sm:shadow-lg text-left z-20 hidden xs:block sm:block">
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <div className="w-5 h-5 sm:w-9 sm:h-9 rounded sm:rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                        Deep Study Mode
                      </div>
                      <div className="text-[8px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                        Zero distraction focus
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. REAL-TIME STATS STRIP (App-style Compact Bento Grid) */}
      <section
        id="stats-strip"
        className="w-full py-5 sm:py-10 bg-slate-100/90 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
      >
        <div className="w-full max-w-[1920px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-6 text-left sm:text-center">
          <div className="p-3 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
              {platformStats.totalUsers.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium truncate">
              Registered Learners
            </div>
          </div>

          <div className="p-3 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums leading-tight">
              {platformStats.totalLectures.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium truncate">
              Video Lectures
            </div>
          </div>

          <div className="p-3 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums leading-tight">
              {platformStats.leetcodeQuestions.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium truncate">
              LeetCode Problems
            </div>
          </div>

          <div className="p-3 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums leading-tight">
              {platformStats.totalTasksAdded.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium truncate">
              Tasks Solved
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE INTERFACE TOUR (Practical Clean Switcher - Full Screen Fitted) */}
      <section
        id="ui-preview-section"
        className="hidden md:block w-full py-10 sm:py-24 px-3.5 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
      >
        <div className="w-full max-w-[1920px] mx-auto space-y-6 sm:space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Interface Tour
            </span>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-slate-950 dark:text-white tracking-tight">
              A Clear, Functional Workspace.
            </h2>
            <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400">
              Designed like practical developer tools — fast, predictable, and focused on study output across any laptop screen.
            </p>
          </div>

          {/* Simple Segmented Tabs (Solid, No Gradients) */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 sm:p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActivePreviewTab('desktop')}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activePreviewTab === 'desktop'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Desktop Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('mobile')}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activePreviewTab === 'mobile'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Mobile App</span>
              </button>
            </div>
          </div>

          {/* Card Showcase with Solid Full-Width Responsive Styling */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 sm:p-8 lg:p-10 text-left shadow-2xs sm:shadow-sm">
            {activePreviewTab === 'desktop' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 xl:gap-12 items-center">
                <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-8 rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 aspect-video shadow-xs sm:shadow-md">
                  <img
                    src={desktopUiPreview}
                    alt="Desktop Workspace View"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/desktop_ui_preview.png';
                    }}
                  />
                </div>
                <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-2.5 sm:space-y-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Laptop className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                    Wide-Screen Multi-Tasking
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Watch sequential YouTube lectures without distractions, write private Markdown notes, and track milestone percentage completion on full-screen displays.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 pt-0.5 sm:pt-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Ad-free YouTube player with notes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Exam readiness bento metrics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>One-click solution walkthroughs</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activePreviewTab === 'mobile' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 xl:gap-12 items-center">
                <div className="lg:col-span-6 flex justify-center">
                  <div className="w-56 sm:w-72 rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-4 border-slate-700 bg-black shadow-lg sm:shadow-xl">
                    <img
                      src="/src/assets/images/mobile_ui_preview_1791443137159.jpg"
                      alt="Mobile App View"
                      className="w-full aspect-[3/4] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="lg:col-span-6 space-y-2.5 sm:space-y-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                    PWA Mobile Touch Experience
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Install ProgressPath onto your smartphone. Zero-blank opening splash screen, right-sliding flyout preferences, and thumb-friendly buttons.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 pt-0.5 sm:pt-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Instant zero-millisecond splash launch</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Floating flyout side drawer panel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Offline service worker precaching</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. CORE THREE FEATURES (App-like Modular Cards) */}
      <section
        id="features-section"
        className="w-full py-6 sm:py-24 px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
      >
        <div className="w-full max-w-[1920px] mx-auto space-y-4 sm:space-y-12">
          <div className="text-center space-y-1.5 sm:space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] sm:text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Core Features
            </span>
            <h2 className="text-lg sm:text-3xl md:text-4xl font-bold text-slate-950 dark:text-white tracking-tight">
              The Three Core Pillars.
            </h2>
            <p className="text-[11px] sm:text-base text-slate-600 dark:text-slate-400">
              Everything needed to build real technical skill, with zero unnecessary distractions.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 xs:gap-2.5 sm:gap-6 lg:gap-8 text-left">
            {/* Card 1 */}
            <div className="p-2 xs:p-2.5 sm:p-8 lg:p-9 rounded-lg sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-1 sm:space-y-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-slate-200 flex items-center justify-center shrink-0 mb-1 sm:mb-3">
                  <BookOpen className="w-3 h-3 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-[11px] xs:text-xs sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  01. Curated Roadmaps
                </h3>
              </div>
              <p className="text-[9px] xs:text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 leading-tight sm:leading-relaxed line-clamp-3 sm:line-clamp-none mt-1 sm:mt-0">
                Sequenced syllabi for DSA, OS, Networks, and DBMS. Track watched videos and notes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-2 xs:p-2.5 sm:p-8 lg:p-9 rounded-lg sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-1 sm:space-y-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-slate-200 flex items-center justify-center shrink-0 mb-1 sm:mb-3">
                  <Code2 className="w-3 h-3 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-[11px] xs:text-xs sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  02. Problem Vault
                </h3>
              </div>
              <p className="text-[9px] xs:text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 leading-tight sm:leading-relaxed line-clamp-3 sm:line-clamp-none mt-1 sm:mt-0">
                Curated LeetCode problems grouped by patterns. Flag problems to revisit before interviews.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-2 xs:p-2.5 sm:p-8 lg:p-9 rounded-lg sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-1 sm:space-y-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-slate-200 flex items-center justify-center shrink-0 mb-1 sm:mb-3">
                  <CalendarIcon className="w-3 h-3 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-[11px] xs:text-xs sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  03. Daily Study Planner
                </h3>
              </div>
              <p className="text-[9px] xs:text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 leading-tight sm:leading-relaxed line-clamp-3 sm:line-clamp-none mt-1 sm:mt-0">
                Schedule study sessions, prioritize tasks, and build daily consistency before coding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PHILOSOPHY CALLOUT (Practical & Full Screen Fitted) */}
      <section
        id="about-philosophy"
        className="w-full py-5 sm:py-24 px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-center"
      >
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto p-3.5 xs:p-4 sm:p-12 lg:p-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 sm:space-y-6 shadow-2xs sm:shadow-sm">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              <span>Built Without Social Traps</span>
            </div>

            <h2 className="text-sm xs:text-base sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug sm:leading-tight">
              No Public Leaderboards. No Distracting Feeds.
            </h2>

            <p className="text-[11px] sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-snug sm:leading-relaxed">
              Most study platforms compete for user screen-time using public rank shaming and notification spam. ProgressPath is built as a private, calm desk for disciplined engineering work across every device.
            </p>

            <div className="pt-0.5 sm:pt-2">
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2.5 xs:px-3 sm:px-7 py-1.5 xs:py-1.5 sm:py-3.5 rounded-md sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] xs:text-xs sm:text-base transition-colors cursor-pointer shadow-xs hover:shadow active:scale-98 leading-tight"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRACTICAL FOOTER (Full Screen Fitted) */}
      <footer id="landing-footer" className="w-full bg-slate-950 text-slate-400 py-8 sm:py-12 px-3.5 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 text-xs sm:text-sm">
        <div className="w-full max-w-[1920px] mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <SystemLogo size="sm" />
              <span className="font-bold text-white text-base sm:text-lg">ProgressPath</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-400 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToTerms) onNavigateToTerms();
                  else setActiveLegalModal('terms');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToPrivacy) onNavigateToPrivacy();
                  else setActiveLegalModal('privacy');
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveLegalModal('security')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Security
              </button>
              <a
                href="mailto:luckypc08292@gmail.com"
                className="hover:text-white transition-colors"
              >
                Support
              </a>
            </div>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <div>
              &copy; {new Date().getFullYear()} ProgressPath. Engineering study platform.
            </div>
            <div>
              luckypc08292@gmail.com
            </div>
          </div>
        </div>
      </footer>

      {/* LEGAL MODALS (Privacy, Terms, Security) */}
      {activeLegalModal && (
        <div
          id="landing-legal-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveLegalModal(null)}
        >
          <div
            id="landing-legal-modal-card"
            className="w-full max-w-lg max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-y-auto p-5 space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {activeLegalModal === 'privacy' && 'Privacy Policy'}
                {activeLegalModal === 'terms' && 'Terms of Service'}
                {activeLegalModal === 'security' && 'Security Architecture'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeLegalModal === 'privacy' && (
                <>
                  <p>
                    ProgressPath is built around privacy. We do not sell or monetize personal study notes, problem solutions, or lecture progress.
                  </p>
                  <p>
                    Passwords are authenticated using standard bcrypt hashes. Session tokens remain in secure client storage.
                  </p>
                  <p>
                    For queries or account deletion, contact{' '}
                    <a href="mailto:luckypc08292@gmail.com" className="text-blue-600 underline">
                      luckypc08292@gmail.com
                    </a>.
                  </p>
                </>
              )}

              {activeLegalModal === 'terms' && (
                <>
                  <p>
                    By registering an account on ProgressPath, you agree to these Terms. ProgressPath provides a study curriculum tracking and problem recording platform for personal, non-commercial education.
                  </p>
                  <p>
                    Users agree to maintain secure credentials and not attempt automated scraping or abuse of the platform.
                  </p>
                </>
              )}

              {activeLegalModal === 'security' && (
                <>
                  <p>
                    ProgressPath implements layered defenses including automatic sliding-window rate limiting on authentication routes (preventing brute-force attacks) and strict API DDoS protection.
                  </p>
                  <p>
                    All API inputs undergo strict schema verification and query sanitization to protect against injection and prototype pollution attacks.
                  </p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA App Install Guide Modal (Mobile & Desktop) */}
      {showPWAInstallGuide && (
        <div
          id="pwa-install-guide-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 text-slate-900 dark:text-white relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowPWAInstallGuide(false)}
              className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close install modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 id="pwa-guide-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {isInstalled ? 'App Is Already Installed' : 'Install ProgressPath App'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isInstalled ? 'Running as standalone application' : 'Install directly on Desktop & Mobile (PWA)'}
                </p>
              </div>
            </div>

            {isInstalled ? (
              <div className="space-y-3 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>ProgressPath is installed! You can launch it directly from your home screen or desktop application menu.</span>
                </div>
              </div>
            ) : isIOS ? (
              <div className="space-y-3 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  To install on iPhone / iPad (iOS Safari):
                </p>
                <ol className="space-y-2 list-decimal list-inside bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs">
                  <li>
                    Tap the <strong className="text-blue-600 dark:text-blue-400">Share</strong> icon (square with upward arrow) in your Safari bottom bar.
                  </li>
                  <li>
                    Scroll down the action sheet and select <strong className="text-slate-900 dark:text-white">"Add to Home Screen"</strong>.
                  </li>
                  <li>
                    Tap <strong className="text-blue-600 dark:text-blue-400">Add</strong> in the top-right corner to place ProgressPath on your phone.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  How to install on your device:
                </p>
                <div className="space-y-2.5 text-[11px] sm:text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <Laptop className="w-3.5 h-3.5 text-blue-600" />
                      <span>On Desktop (Chrome, Edge, Brave, Opera):</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Click the <strong className="text-slate-900 dark:text-white">Install</strong> icon in your browser URL address bar (or menu &gt; <em>"Install Progress Path"</em>).
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>On Android (Chrome, Samsung Internet):</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Tap the browser menu (3 dots) &gt; <strong className="text-slate-900 dark:text-white">"Install app"</strong> or <strong className="text-slate-900 dark:text-white">"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3.5 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" /> Fast offline caching & no store download
              </span>
              <button
                type="button"
                onClick={() => setShowPWAInstallGuide(false)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
