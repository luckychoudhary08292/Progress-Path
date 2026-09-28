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

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              id="nav-login-btn"
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs sm:text-base font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Log In
            </button>
            <button
              id="nav-signup-btn"
              type="button"
              onClick={onNavigateToSignup}
              className="text-xs sm:text-base font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3 sm:px-6 py-1.5 sm:py-3 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
            {/* Left Content Column - Direct, Punchy, Crystal-Clear Words */}
            <div className="lg:col-span-6 space-y-3.5 sm:space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/95 border border-blue-200/80 text-[11px] sm:text-sm font-semibold text-blue-700 shadow-2xs backdrop-blur-md">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>CS Curriculum &amp; Practice System</span>
              </div>

              {/* Headline */}
              <h1
                id="hero-headline"
                className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.18] sm:leading-[1.14]"
              >
                Master Computer Science.{' '}
                <span className="text-blue-600 block sm:inline">With Zero Clutter.</span>
              </h1>

              {/* Subtext - Clear, Readable, No Heavy Fluff */}
              <p
                id="hero-subtext"
                className="text-xs sm:text-lg text-slate-700 leading-relaxed max-w-xl font-normal"
              >
                Sequential lecture roadmaps, curated LeetCode vaults, and daily study scheduling — built to help you learn without distractions.
              </p>

              {/* Action Buttons */}
              <div className="pt-1 sm:pt-2 flex items-center gap-2 sm:gap-3">
                <button
                  id="hero-signup-btn"
                  type="button"
                  onClick={onNavigateToSignup}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-9 sm:py-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-lg shadow-md hover:shadow-xl transition-all cursor-pointer group"
                >
                  <span>Start Learning Free</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="sm:hidden px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Log In
                </button>
              </div>

              {/* Micro Trust Row */}
              <div className="pt-0.5 sm:pt-2 flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" /> Free forever
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" /> 100% private data
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" /> No credit card
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

      {/* 3. Quick Metrics & Platform Highlights Strip - Compact on Mobile, Spacious on Desktop */}
      <section
        id="stats-strip"
        className="w-full bg-slate-900 text-white border-y border-slate-800 py-3.5 sm:py-6 px-3.5 sm:px-8"
      >
        <div className="w-full max-w-[1560px] mx-auto grid grid-cols-4 gap-1.5 sm:gap-6 text-center">
          <div className="space-y-0.5">
            <span className="block text-sm sm:text-2xl font-black tracking-tight text-white">40+</span>
            <span className="block text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Curricula</span>
          </div>
          <div className="space-y-0.5 border-l border-slate-800">
            <span className="block text-sm sm:text-2xl font-black tracking-tight text-white">150+</span>
            <span className="block text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Problems</span>
          </div>
          <div className="space-y-0.5 border-l border-slate-800">
            <span className="block text-sm sm:text-2xl font-black tracking-tight text-white">100%</span>
            <span className="block text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Free &amp; Private</span>
          </div>
          <div className="space-y-0.5 border-l border-slate-800">
            <span className="block text-sm sm:text-2xl font-black tracking-tight text-white">Daily</span>
            <span className="block text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Planner</span>
          </div>
        </div>
      </section>

      {/* 4. Key Features Section - Compact 2x2 Small Cards on Mobile, 4-Card Widescreen Grid on Desktop */}
      <section
        id="features-section"
        className="w-full py-6 sm:py-28 px-3.5 sm:px-8 lg:px-12 2xl:px-16 bg-white border-t border-slate-100"
      >
        <div className="w-full max-w-[1560px] mx-auto text-center">
          {/* Section Overline */}
          <span className="text-[10px] sm:text-sm font-bold tracking-widest text-slate-400 uppercase">
            KEY FEATURES
          </span>

          {/* Section Heading */}
          <h2 className="mt-1 sm:mt-3 text-xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Everything You Need to Stay on Track
          </h2>

          {/* 4 Feature Cards Grid: 2-column small cards on mobile, 4-column on desktop */}
          <div className="mt-6 sm:mt-18 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-8 text-left">
            {/* Feature 1: Structured Curriculum */}
            <div className="p-3.5 sm:p-9 rounded-xl sm:rounded-3xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all space-y-2.5 sm:space-y-5 shadow-2xs">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="text-xs sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 leading-snug">
                  Structured Curriculum
                </h3>
                <p className="text-[11px] sm:text-base text-slate-500 leading-snug line-clamp-2 sm:line-clamp-none">
                  Follow global roadmaps or add your own topics.
                </p>
              </div>
            </div>

            {/* Feature 2: Problem Vault */}
            <div className="p-3.5 sm:p-9 rounded-xl sm:rounded-3xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all space-y-2.5 sm:space-y-5 shadow-2xs">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Code2 className="w-4 h-4 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="text-xs sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 leading-snug">
                  Problem Vault
                </h3>
                <p className="text-[11px] sm:text-base text-slate-500 leading-snug line-clamp-2 sm:line-clamp-none">
                  Practice from LeetCode, Codeforces and more.
                </p>
              </div>
            </div>

            {/* Feature 3: Study Calendar */}
            <div className="p-3.5 sm:p-9 rounded-xl sm:rounded-3xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all space-y-2.5 sm:space-y-5 shadow-2xs">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-4 h-4 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="text-xs sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 leading-snug">
                  Study Calendar
                </h3>
                <p className="text-[11px] sm:text-base text-slate-500 leading-snug line-clamp-2 sm:line-clamp-none">
                  Plan your days, not just your reminders.
                </p>
              </div>
            </div>

            {/* Feature 4: Readiness Gauge */}
            <div className="p-3.5 sm:p-9 rounded-xl sm:rounded-3xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all space-y-2.5 sm:space-y-5 shadow-2xs">
              <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="text-xs sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 leading-snug">
                  Readiness Gauge
                </h3>
                <p className="text-[11px] sm:text-base text-slate-500 leading-snug line-clamp-2 sm:line-clamp-none">
                  See your real progress with simple metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Middle Showcase Section ("Learn. Practice. Get Interview Ready.") */}
      <section
        id="showcase-section"
        className="w-full py-6 sm:py-28 px-3.5 sm:px-8 lg:px-12 2xl:px-16 bg-slate-50/60"
      >
        <div className="w-full max-w-[1560px] mx-auto">
          {/* Mobile-only High-Impact Compact Value Card */}
          <div className="block sm:hidden bg-slate-900 text-white rounded-2xl p-4 space-y-3 text-left shadow-md">
            <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase block">
              BUILT FOR YOUR GOALS
            </span>
            <h3 className="text-lg font-extrabold text-white tracking-tight leading-snug">
              Learn. Practice. Get Interview Ready.
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              A distraction-free system engineered to turn scattered notes into verified technical competence.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px] font-medium text-slate-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Track progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Real questions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Custom roadmaps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Daily consistency</span>
              </div>
            </div>

            {/* Direct Mobile Conversion Action */}
            <div className="pt-1.5">
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Start Preparing Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Full Dual-Column Showcase (Hidden on Mobile) */}
          <div className="hidden sm:block bg-slate-100/70 rounded-3xl 2xl:rounded-[36px] p-8 sm:p-14 lg:p-18 2xl:p-22 border border-slate-200/70">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Overlapping Real-Time Mockups */}
              <div className="lg:col-span-7 relative flex items-center justify-center">
                {/* Back Main Card: "Today's Plan" */}
                <div className="w-full max-w-lg lg:max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5 text-left ml-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-base font-bold text-slate-900">Today's Plan</span>
                    <span className="text-xs sm:text-sm font-mono text-slate-400">23 Apr, 2025</span>
                  </div>

                  <div className="space-y-3.5 text-xs sm:text-sm">
                    {/* Block 1 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                        <span className="font-mono text-slate-500 text-xs sm:text-sm">09:00 &ndash; 10:30</span>
                        <span className="font-semibold text-slate-900">Operating Systems</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          High
                        </span>
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                    </div>

                    {/* Block 2 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-blue-400 shrink-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </div>
                        <span className="font-mono text-slate-500 text-xs sm:text-sm">11:00 &ndash; 12:00</span>
                        <span className="font-semibold text-slate-900">DSA Practice</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          High
                        </span>
                        <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                      </div>
                    </div>

                    {/* Block 3 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-slate-300 shrink-0" />
                        <span className="font-mono text-slate-500 text-xs sm:text-sm">02:00 &ndash; 04:00</span>
                        <span className="font-semibold text-slate-900">DBMS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          Normal
                        </span>
                        <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                      </div>
                    </div>

                    {/* Block 4 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-slate-300 shrink-0" />
                        <span className="font-mono text-slate-500 text-xs sm:text-sm">05:00 &ndash; 06:00</span>
                        <span className="font-semibold text-slate-900">Revision</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          Low
                        </span>
                        <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Front Floating Offset Card: "Problem Details" */}
                <div className="absolute -bottom-6 sm:-bottom-8 -left-2 sm:left-4 w-60 sm:w-68 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-3 text-left transition-transform hover:scale-[1.02]">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Problem Details
                  </span>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-slate-900">Two Sum</h5>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-slate-500">LeetCode</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        Easy
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                        Array
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 leading-snug">
                    Find two numbers that add up to target.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateToSignup}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold text-center transition-colors cursor-pointer"
                  >
                    View Solution
                  </button>
                </div>
              </div>

              {/* Right Column: Narrative Copy & Checkpoint List */}
              <div className="lg:col-span-5 space-y-6 text-left">
                <span className="text-xs sm:text-sm font-bold tracking-widest text-slate-400 uppercase block">
                  BUILT FOR YOUR GOALS
                </span>

                <h3 className="text-4xl sm:text-5xl 2xl:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
                  Learn. Practice. <br />
                  Get Interview Ready.
                </h3>

                <p className="text-base sm:text-lg 2xl:text-xl text-slate-600 leading-relaxed">
                  A simple, focused platform for engineering students and developers.
                </p>

                {/* 4 Green Checkpoint Items */}
                <div className="pt-2 space-y-4 text-base sm:text-lg font-medium text-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <span>Track your progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <span>Practice with real questions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <span>Build your own topics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <span>Stay consistent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Closing Mountain Summit Call To Action */}
      <section
        id="closing-cta-section"
        className="relative w-full pt-12 sm:pt-36 pb-12 sm:pb-28 px-3.5 sm:px-8 lg:px-12 2xl:px-16 bg-gradient-to-b from-white via-blue-50/25 to-blue-50/60 overflow-hidden text-center"
      >
        {/* Mountain Peak Vector Illustration in Background */}
        <div className="absolute bottom-0 left-0 right-0 w-full flex justify-center pointer-events-none opacity-45 select-none overflow-hidden max-h-24 sm:max-h-none">
          <svg
            viewBox="0 0 1600 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-7xl h-auto"
          >
            {/* Left mountain */}
            <polygon points="120,260 400,130 680,260" fill="#E2E8F0" />
            <polygon points="400,130 460,170 400,260" fill="#CBD5E1" />
            {/* Center-right peak with summit flag */}
            <polygon points="560,260 960,40 1360,260" fill="#E2E8F0" />
            <polygon points="960,40 1040,120 960,260" fill="#CBD5E1" />
            <polygon points="920,260 960,40 1000,120" fill="#F1F5F9" />
            {/* Summit Flag */}
            <line x1="960" y1="40" x2="960" y2="12" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            <polygon points="960,12 1005,24 960,36" fill="#3B82F6" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-4 sm:space-y-7">
          <h2 className="text-xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Build Compounding Technical Competence <br className="hidden sm:inline" />
            Every Single Day.
          </h2>

          <div>
            <button
              id="cta-signup-btn"
              type="button"
              onClick={onNavigateToSignup}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 py-3 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm sm:text-lg shadow-md hover:shadow-xl transition-all cursor-pointer group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="pt-1 sm:pt-2 text-[11px] sm:text-sm text-slate-500 font-medium">
            <span>Free to use</span>
            <span className="mx-2 sm:mx-3">&bull;</span>
            <span>Private personal data</span>
            <span className="mx-2 sm:mx-3">&bull;</span>
            <span>No credit card required</span>
          </div>
        </div>
      </section>

      {/* 7. Comprehensive Professional Footer */}
      <footer id="landing-footer" className="w-full bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="w-full max-w-[1560px] mx-auto px-3.5 sm:px-8 lg:px-12 2xl:px-16 pt-8 sm:pt-16 pb-6 sm:pb-12">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-6 sm:gap-8 lg:gap-12 pb-6 sm:pb-12 border-b border-slate-800/80">
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

          {/* Sub-Footer Copyright & Status */}
          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500">
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
