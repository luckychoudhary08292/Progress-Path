import React, { useState, useEffect } from 'react';
import { SystemLogo } from './SystemLogo.tsx';
import {
  BookOpen,
  Code2,
  Calendar as CalendarIcon,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Circle,
  Shield,
  Lock,
  CreditCard,
  X,
  Youtube,
  Mail,
  Github,
  Users,
  Video,
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

  // Real-time aggregate platform metrics (strictly numerical, zero user private info)
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
        // Fallback store
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
      className="min-h-screen w-full bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
    >
      {/* 1. Global Navigation - Reflects the Existing Footer Background (bg-slate-950 border-b border-slate-800) */}
      <header
        id="landing-header"
        className="sticky top-0 z-40 w-full bg-slate-950 text-slate-300 border-b border-slate-800 shadow-md transition-colors"
      >
        <div className="w-full max-w-[1560px] mx-auto px-3.5 sm:px-8 lg:px-12 2xl:px-16 h-14 sm:h-20 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <div
            id="landing-brand-logo"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <SystemLogo size="sm" />
            <span className="font-bold text-white tracking-tight text-base sm:text-2xl">
              ProgressPath
            </span>
          </div>

          {/* Center Navigation Tagline for Widescreen */}
          <nav className="hidden lg:flex items-center gap-8 text-sm sm:text-base text-slate-400 font-medium">
            <span className="hover:text-white transition-colors cursor-default">Learn</span>
            <span className="text-slate-600 font-bold">&bull;</span>
            <span className="hover:text-white transition-colors cursor-default">Practice</span>
            <span className="text-slate-600 font-bold">&bull;</span>
            <span className="hover:text-white transition-colors cursor-default">Grow</span>
          </nav>

          {/* Right Action Buttons - Space-friendly on mobile, comfortable on desktop */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <button
              id="nav-login-btn"
              type="button"
              onClick={onNavigateToLogin}
              className="text-[11px] sm:text-base font-medium sm:font-semibold text-slate-300 hover:text-white px-2 py-1 sm:px-4 sm:py-2.5 rounded-md sm:rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Log In
            </button>
            <button
              id="nav-signup-btn"
              type="button"
              onClick={onNavigateToSignup}
              className="text-[11px] sm:text-base font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-2.5 py-1 sm:px-6 sm:py-3 rounded-md sm:rounded-xl transition-all shadow-2xs hover:shadow flex items-center gap-1 sm:gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section - Ultra Clean, Crisp & Lightweight */}
      <section
        id="hero-section"
        className="relative w-full pt-6 sm:pt-20 lg:pt-24 pb-8 sm:pb-24 px-3.5 sm:px-8 lg:px-12 2xl:px-16 overflow-hidden bg-slate-100 flex items-center min-h-0 sm:min-h-[580px]"
      >
        {/* Workspace Desk Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <img
            src="/hero_desk_bg.jpg"
            alt="ProgressPath Developer Workspace Desk Background"
            className="w-full h-full object-cover object-bottom sm:object-center brightness-105 contrast-102 scale-[1.02]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-white/35 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white" />
        </div>

        <div className="w-full max-w-[1560px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left Content Column - Direct, Punchy, Crystal-Clear Words (Targeted Element) */}
            <div className="lg:col-span-6 space-y-3 sm:space-y-6 text-left">
              {/* Badge - Clean micro-pill on mobile, full badge on desktop */}
              <div className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50/90 border border-blue-200/60 text-[11px] font-semibold text-blue-700 shadow-2xs backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span>CS Study &amp; Practice</span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-blue-200/80 text-sm font-semibold text-blue-700 shadow-2xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>CS Curriculum &amp; Practice System</span>
              </div>

              {/* Headline - Light, high-impact aesthetic on mobile */}
              <h1 className="sm:hidden text-[26px] font-black tracking-tight text-slate-950 leading-tight">
                Master CS &amp; Code.{' '}
                <span className="text-blue-600 block">Clean &amp; Focused.</span>
              </h1>
              <h1
                id="hero-headline"
                className="hidden sm:block text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.14]"
              >
                Master Computer Science.{' '}
                <span className="text-blue-600 block sm:inline">With Zero Clutter.</span>
              </h1>

              {/* Subtext - Crisp single line on mobile, complete copy on desktop */}
              <p className="sm:hidden text-xs text-slate-600 leading-relaxed font-normal">
                Curated roadmaps, LeetCode vaults, and study planner.
              </p>
              <p
                id="hero-subtext"
                className="hidden sm:block text-lg text-slate-700 leading-relaxed max-w-xl font-normal"
              >
                Sequential lecture roadmaps, curated LeetCode vaults, and daily study scheduling — built to help you learn without distractions.
              </p>

              {/* Desktop Action Buttons (Mobile uses sticky top navigation buttons for zero clutter) */}
              <div className="hidden sm:flex pt-2 items-center gap-3">
                <button
                  id="hero-signup-btn"
                  type="button"
                  onClick={onNavigateToSignup}
                  className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-lg shadow-md hover:shadow-xl transition-all cursor-pointer group"
                >
                  <span>Start Learning Free</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Micro Trust Row - Clean, single-line micro-strip on mobile, full badges on desktop */}
              <div className="sm:hidden flex items-center justify-between text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" /> Free forever
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> 100% private
                </span>
                <span className="text-slate-300">&bull;</span>
                <span>No credit card</span>
              </div>
              <div className="hidden sm:flex pt-2 flex-wrap items-center gap-6 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-slate-500" /> Free forever
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-4 h-4 text-slate-500" /> 100% private data
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-slate-500" /> No credit card
                </span>
              </div>
            </div>

            {/* Desktop-Only Clean Mockup (Completely hidden on mobile to eliminate clutter) */}
            <div className="hidden lg:flex col-span-6 relative items-center justify-end">
              <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-2xl p-6 text-left space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      P
                    </div>
                    <span className="text-sm font-bold text-slate-900">Workspace Overview</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                    Live Sync
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block font-medium">DSA Roadmap</span>
                    <span className="text-base font-bold text-slate-900 block mt-0.5">60% Done</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block font-medium">Problem Vault</span>
                    <span className="text-base font-bold text-slate-900 block mt-0.5">150 Questions</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block font-medium">Daily Focus</span>
                    <span className="text-base font-bold text-slate-900 block mt-0.5">3 Scheduled</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 text-xs">
                    <span className="font-medium text-slate-800">Arrays &amp; Two Pointers</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 text-xs">
                    <span className="font-medium text-slate-800">Linked Lists &amp; Fast-Slow</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white border border-slate-100 text-xs">
                    <span className="font-medium text-slate-600">Trees &amp; Binary Search</span>
                    <Circle className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Real-Time Platform Stats - Compact Small Cards with Live Numbers (No User Private Details) */}
      <section
        id="live-stats-section"
        className="w-full py-5 sm:py-9 px-3.5 sm:px-8 lg:px-12 2xl:px-16 bg-slate-900 text-white border-y border-slate-800"
      >
        <div className="w-full max-w-[1560px] mx-auto space-y-3.5 sm:space-y-5">
          {/* Section Header with Live Activity Pulse */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400">
                Live Platform Activity
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-400">
              Real-time aggregate platform statistics &bull; 100% private data
            </span>
          </div>

          {/* 5 Small Real-Time Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {/* Card 1: Real-time Number of Users */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left space-y-1 shadow-2xs hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-300">Total Users</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {platformStats.totalUsers.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Active learners
              </p>
            </div>

            {/* Card 2: Total Number of Lectures */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left space-y-1 shadow-2xs hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-300">Total Lectures</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {platformStats.totalLectures.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Curriculum sessions
              </p>
            </div>

            {/* Card 3: Completed Lectures */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left space-y-1 shadow-2xs hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-300">Completed</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight">
                {platformStats.completedLectures.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Lectures completed
              </p>
            </div>

            {/* Card 4: LeetCode Questions */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left space-y-1 shadow-2xs hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-300">LeetCode</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-amber-400 tracking-tight">
                {platformStats.leetcodeQuestions.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Questions in vault
              </p>
            </div>

            {/* Card 5: Total Users with Tasks Added */}
            <div className="col-span-2 sm:col-span-1 bg-slate-800/80 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left space-y-1 shadow-2xs hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-300">Users with Tasks</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-purple-400 tracking-tight">
                {platformStats.usersWithTasks.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                {platformStats.totalTasksAdded} tasks logged
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features - Tiny Small Cards (Mobile: Row 1 = 2 columns, Row 2 = 1 column; Desktop = 3 columns) */}
      <section
        id="features-section"
        className="w-full py-5 sm:py-20 px-3.5 sm:px-8 lg:px-12 2xl:px-16 bg-white border-t border-slate-100"
      >
        <div className="w-full max-w-[1560px] mx-auto text-center space-y-4 sm:space-y-10">
          <div className="space-y-0.5 sm:space-y-2">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-blue-600 uppercase">
              BUILT FOR CLARITY
            </span>
            <h2 className="text-lg sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Everything You Need. Nothing You Don't.
            </h2>
          </div>

          {/* Tiny Cards Grid: Mobile Row 1 = 2 cols, Row 2 = 1 col (spanning 2); Desktop = 3 cols */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-6 text-left">
            {/* Card 1: Row 1, Col 1 */}
            <div className="p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all shadow-2xs space-y-1.5 sm:space-y-2.5">
              <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xs sm:text-lg font-bold text-slate-900 mb-0.5 sm:mb-1 leading-snug">
                  Roadmaps
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-600 leading-tight sm:leading-relaxed">
                  Sequential DSA, OS &amp; DBMS curriculums with progress tracking.
                </p>
              </div>
            </div>

            {/* Card 2: Row 1, Col 2 */}
            <div className="p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs transition-all shadow-2xs space-y-1.5 sm:space-y-2.5">
              <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Code2 className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xs sm:text-lg font-bold text-slate-900 mb-0.5 sm:mb-1 leading-snug">
                  Problem Vault
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-600 leading-tight sm:leading-relaxed">
                  Curated LeetCode problems organized by pattern &amp; difficulty.
                </p>
              </div>
            </div>

            {/* Card 3: Row 2, Col 1 (Spans full width across 2 columns on mobile) */}
            <div className="col-span-2 sm:col-span-1 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition-all shadow-2xs">
              <div className="flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-0 sm:space-y-2.5 text-left">
                <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-lg font-bold text-slate-900 mb-0.5 sm:mb-1 leading-snug">
                    Daily Study Planner
                  </h3>
                  <p className="text-[11px] sm:text-sm text-slate-600 leading-tight sm:leading-relaxed">
                    Schedule focus blocks, set priorities &amp; track completed tasks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Desktop-Only Showcase (Hidden on Mobile to keep Mobile clean & light) */}
      <section
        id="showcase-section"
        className="hidden sm:block w-full py-16 lg:py-24 px-3.5 sm:px-8 lg:px-12 2xl:px-16 bg-slate-50/60"
      >
        <div className="w-full max-w-[1560px] mx-auto bg-slate-100/70 rounded-3xl p-8 sm:p-14 border border-slate-200/70">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Overlapping Mockups */}
            <div className="lg:col-span-7 relative flex items-center justify-center">
              <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4 text-left ml-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-base font-bold text-slate-900">Today's Plan</span>
                  <span className="text-xs font-mono text-slate-400">Study Session</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      <span className="font-mono text-slate-500 text-xs">09:00 &ndash; 10:30</span>
                      <span className="font-semibold text-slate-900">Operating Systems</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                      High
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full border border-blue-400 shrink-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      </div>
                      <span className="font-mono text-slate-500 text-xs">11:00 &ndash; 12:00</span>
                      <span className="font-semibold text-slate-900">DSA Practice</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      Normal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Copy */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase block">
                BUILT FOR YOUR GOALS
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Learn. Practice. <br />
                Get Interview Ready.
              </h3>
              <p className="text-base text-slate-600 leading-relaxed">
                A simple, focused platform for engineering students and developers to maintain daily momentum.
              </p>
              <div className="pt-2 space-y-3 text-sm font-medium text-slate-800">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Sequential roadmaps with video lectures</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Practice with curated coding problems</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Daily schedule to stay consistent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Closing Call To Action (Compact & Clean on Mobile, Spacious on Desktop) */}
      <section
        id="closing-cta-section"
        className="relative w-full py-4 sm:py-24 px-3.5 sm:px-8 lg:px-12 2xl:px-16 bg-gradient-to-b from-white via-blue-50/25 to-blue-50/60 overflow-hidden text-center"
      >
        {/* Mountain Peak Vector Illustration in Background (Desktop only) */}
        <div className="hidden sm:flex absolute bottom-0 left-0 right-0 w-full justify-center pointer-events-none opacity-40 select-none overflow-hidden">
          <svg
            viewBox="0 0 1600 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-7xl h-auto"
          >
            <polygon points="120,260 400,130 680,260" fill="#E2E8F0" />
            <polygon points="400,130 460,170 400,260" fill="#CBD5E1" />
            <polygon points="560,260 960,40 1360,260" fill="#E2E8F0" />
            <polygon points="960,40 1040,120 960,260" fill="#CBD5E1" />
            <polygon points="920,260 960,40 1000,120" fill="#F1F5F9" />
            <line x1="960" y1="40" x2="960" y2="12" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            <polygon points="960,12 1005,24 960,36" fill="#3B82F6" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-2 sm:space-y-6">
          <h2 className="text-sm sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-snug">
            <span className="sm:hidden">Start Your Preparation Today</span>
            <span className="hidden sm:inline">Build Compounding Technical Competence Every Single Day.</span>
          </h2>

          <p className="hidden sm:block text-xs sm:text-base text-slate-600 max-w-lg mx-auto">
            Join learners tracking roadmaps, problem solving, and daily study habits without cognitive noise.
          </p>

          <div className="pt-0.5 sm:pt-1">
            <button
              id="cta-signup-btn"
              type="button"
              onClick={onNavigateToSignup}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:px-10 sm:py-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-base shadow-sm hover:shadow-xl transition-all cursor-pointer group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="hidden sm:block pt-1 text-[11px] sm:text-xs text-slate-500 font-medium">
            <span>Free forever</span>
            <span className="mx-2 sm:mx-3">&bull;</span>
            <span>100% private data</span>
            <span className="mx-2 sm:mx-3">&bull;</span>
            <span>No credit card required</span>
          </div>
        </div>
      </section>

      {/* 7. Comprehensive Professional Footer */}
      <footer id="landing-footer" className="w-full bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="w-full max-w-[1560px] mx-auto px-3.5 sm:px-8 lg:px-12 2xl:px-16 pt-3.5 sm:pt-16 pb-3.5 sm:pb-12">
          {/* Mobile-Only Minimal Structured Footer - Minimal Vertical Space */}
          <div className="sm:hidden space-y-2.5">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <SystemLogo size="sm" />
                <span className="font-bold text-white tracking-tight text-xs">
                  ProgressPath
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="mailto:luckypc08292@gmail.com?subject=ProgressPath%20Inquiry"
                  aria-label="Gmail Support"
                  className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-red-400 flex items-center justify-center"
                >
                  <Mail className="w-3 h-3" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                >
                  <Github className="w-3 h-3" />
                </a>
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-red-500 flex items-center justify-center"
                >
                  <Youtube className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
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
              <span className="text-slate-700">&bull;</span>
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
              <span className="text-slate-700">&bull;</span>
              <button
                type="button"
                onClick={() => setActiveLegalModal('security')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Security
              </button>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
              <span>&copy; {new Date().getFullYear()} ProgressPath</span>
              <span className="font-mono text-slate-500">luckypc08292@gmail.com</span>
            </div>
          </div>

          {/* Desktop Full Multi-Column Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-6 sm:gap-8 lg:gap-12 pb-6 sm:pb-12 border-b border-slate-800/80">
            {/* Column 1: Brand Info & Social Icons */}
            <div className="col-span-2 lg:col-span-5 space-y-2.5 sm:space-y-5 text-left">
              <div
                className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <SystemLogo size="sm" />
                <span className="font-bold text-white tracking-tight text-lg sm:text-xl">
                  ProgressPath
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm line-clamp-2 sm:line-clamp-none">
                The structured engineering study platform and algorithmic practice vault. Designed to turn scattered study notes into verifiable technical competence.
              </p>

              {/* Social & Contact Icons including Gmail and YouTube */}
              <div className="flex items-center gap-2.5 sm:gap-3 pt-0.5 sm:pt-1">
                {/* Gmail direct contact */}
                <a
                  href="mailto:luckypc08292@gmail.com?subject=ProgressPath%20Inquiry%20&amp;body=Hi%20ProgressPath%20Team,"
                  aria-label="Contact via Gmail"
                  title="Contact via Gmail (luckypc08292@gmail.com)"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800 text-slate-300 hover:text-red-400 flex items-center justify-center transition-all group"
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
                </a>

                {/* YouTube Channel link */}
                <a
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="ProgressPath on YouTube"
                  title="YouTube Curricula & Walkthroughs"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 hover:border-red-600/50 hover:bg-slate-800 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all group"
                >
                  <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
                </a>

                {/* GitHub link */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="ProgressPath on GitHub"
                  title="Open Source & Community"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all group"
                >
                  <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
                </a>

                <div className="h-4 w-px bg-slate-800 mx-1" />

                <span className="text-[10px] sm:text-xs text-slate-500 font-mono truncate">
                  luckypc08292@gmail.com
                </span>
              </div>
            </div>

            {/* Column 2: Platform Links */}
            <div className="col-span-1 lg:col-span-2 space-y-2 sm:space-y-4 text-left">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
                Platform
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Curricula
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Problems
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Calendar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Readiness
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Curricula */}
            <div className="col-span-1 lg:col-span-2 space-y-2 sm:space-y-4 text-left">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
                Roadmaps
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    DSA Guide
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    OS Concepts
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Networks
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Databases
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Essential Policies & Legal */}
            <div className="col-span-2 lg:col-span-3 space-y-2 sm:space-y-4 text-left pt-2 sm:pt-0 border-t border-slate-900 sm:border-0">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
                Privacy &amp; Security
              </h4>
              <ul className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <li>
                  <button
                    id="footer-nav-privacy-btn"
                    type="button"
                    onClick={() => {
                      if (onNavigateToPrivacy) {
                        onNavigateToPrivacy();
                      } else {
                        setActiveLegalModal('privacy');
                      }
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Privacy Policy</span>
                    <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-semibold border border-blue-800">
                      Private
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    id="footer-nav-terms-btn"
                    type="button"
                    onClick={() => {
                      if (onNavigateToTerms) {
                        onNavigateToTerms();
                      } else {
                        setActiveLegalModal('terms');
                      }
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal('security')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Data Isolation
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:luckypc08292@gmail.com?subject=ProgressPath%20Feedback"
                    className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Gmail Support</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Desktop Sub-Footer Copyright & Status */}
          <div className="hidden sm:flex pt-6 sm:pt-8 flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>&copy; {new Date().getFullYear()} ProgressPath Inc. All rights reserved.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <button
                id="subfooter-privacy-btn"
                type="button"
                onClick={() => {
                  if (onNavigateToPrivacy) {
                    onNavigateToPrivacy();
                  } else {
                    setActiveLegalModal('privacy');
                  }
                }}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                id="subfooter-terms-btn"
                type="button"
                onClick={() => {
                  if (onNavigateToTerms) {
                    onNavigateToTerms();
                  } else {
                    setActiveLegalModal('terms');
                  }
                }}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setActiveLegalModal('security')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Security
              </button>
              <a
                href="mailto:luckypc08292@gmail.com"
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                luckypc08292@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Legal Policy Modal Dialog */}
      {activeLegalModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveLegalModal(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeLegalModal === 'privacy' && 'Privacy Policy'}
                    {activeLegalModal === 'terms' && 'Terms and Conditions'}
                    {activeLegalModal === 'security' && 'Security & Data Isolation'}
                  </h3>
                  <p className="text-xs text-slate-500">Effective Date: 2026-09-23</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed text-left">
              {activeLegalModal === 'privacy' && (
                <>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    1. Zero Data Selling &amp; Strict User Confidentiality
                  </h4>
                  <p>
                    ProgressPath is built on a fundamental respect for student and engineer privacy. We do not sell, rent, or monetize your study notes, personal syllabus checklists, or problem solving records to third parties or advertising networks.
                  </p>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    2. Dual-Tier Topic Isolation
                  </h4>
                  <p>
                    Any custom milestones, lecture notes, video links, or private topics you add to any subject remain completely isolated within your authenticated account. They are not visible to other learners or public visitors.
                  </p>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    3. Authentication &amp; Token Handling
                  </h4>
                  <p>
                    User credentials and session tokens are strictly encrypted in transit using industry-standard TLS cryptographic protocols. Passwords are never stored in plaintext and are salted using modern cryptographic hashing.
                  </p>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    4. Contact &amp; Data Inquiries
                  </h4>
                  <p>
                    If you have questions regarding your data or wish to request complete data deletion, please contact our administrative team directly at{' '}
                    <a href="mailto:luckypc08292@gmail.com" className="text-blue-600 font-semibold underline">
                      luckypc08292@gmail.com
                    </a>.
                  </p>
                </>
              )}

              {activeLegalModal === 'terms' && (
                <>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    1. Acceptance of Terms
                  </h4>
                  <p>
                    By accessing or registering an account on ProgressPath, you agree to these Terms and Conditions. ProgressPath provides a study curriculum tracking and problem recording platform for personal, non-commercial education.
                  </p>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    2. User Conduct &amp; Account Integrity
                  </h4>
                  <p>
                    You agree to maintain the security of your login credentials and not share accounts. Users must not attempt to scrape, attack, circumvent rate limiters, or inject malicious code into the curriculum repository.
                  </p>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    3. Curated Curricula &amp; External References
                  </h4>
                  <p>
                    Course roadmaps and problem links (e.g. references to LeetCode, Codeforces, or YouTube lectures) remain the property of their respective creators. ProgressPath organizes and benchmarks public educational curricula for structured tracking.
                  </p>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    4. Availability &amp; Modifications
                  </h4>
                  <p>
                    We continuously improve ProgressPath features. We reserve the right to deploy updates, maintain system databases, or modify platform features with prior notice.
                  </p>
                </>
              )}

              {activeLegalModal === 'security' && (
                <>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    1. Defense-in-Depth Architecture
                  </h4>
                  <p>
                    ProgressPath implements layered security defenses including automatic sliding-window rate limiting on authentication routes (preventing brute-force attacks) and strict API DDoS protection.
                  </p>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    2. Injection Protection &amp; Sanitization
                  </h4>
                  <p>
                    All API inputs undergo strict schema verification and query sanitization to protect against NoSQL injection, cross-site scripting (XSS), and prototype pollution attacks.
                  </p>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    3. Role-Based Access Control (RBAC)
                  </h4>
                  <p>
                    System administrative tools and global subject management are protected by strict role boundaries. Standard learner accounts cannot modify shared global curriculum templates.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
              >
                Close &amp; Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
