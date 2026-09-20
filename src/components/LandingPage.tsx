import React from 'react';
import {
  BookOpen,
  Code2,
  Calendar as CalendarIcon,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export function LandingPage({ onNavigateToLogin, onNavigateToSignup }: LandingPageProps) {
  return (
    <div id="landing-page-container" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* 1. Global Public Header / Nav */}
      <header id="landing-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            id="landing-brand-logo"
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-tight">Progress Path</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Learning & Code Tracker</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              id="nav-login-btn"
              type="button"
              onClick={onNavigateToLogin}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Log In
            </button>
            <button
              id="nav-signup-btn"
              type="button"
              onClick={onNavigateToSignup}
              className="text-sm font-medium bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white px-4 py-2 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="hero-section" className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-radial from-slate-200/50 via-slate-100/30 to-transparent pointer-events-none -z-10 blur-2xl" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <div
            id="hero-badge"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs mb-6 sm:mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Structured learning roadmaps & engineering benchmarks</span>
          </div>

          {/* Headline */}
          <h1
            id="hero-headline"
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15]"
          >
            Your Personal Learning &amp; Coding Practice Tracker
          </h1>

          {/* Subtext */}
          <p
            id="hero-subtext"
            className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Track lecture milestones, organize coding challenges by difficulty, schedule focused study blocks, and benchmark your engineering readiness in one place.
          </p>

          {/* Hero CTAs */}
          <div id="hero-actions" className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              id="hero-signup-btn"
              type="button"
              onClick={onNavigateToSignup}
              className="w-full sm:w-auto min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-login-btn"
              type="button"
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm sm:text-base border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Log In</span>
            </button>
          </div>

          {/* Key highlights checklist */}
          <div className="mt-10 pt-8 border-t border-slate-200/60 max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero-distraction UI</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Custom &amp; shared curriculum</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Measurable completion metrics</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Overview Section */}
      <section id="features-overview-section" className="py-16 sm:py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2
              id="features-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
            >
              Built to keep your technical study on track
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Four essential modules designed to replace messy notes, lost bookmarks, and disjointed spreadsheets.
            </p>
          </div>

          {/* 4 Feature Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Subject & Topic Tracking */}
            <div
              id="feature-subject-tracking"
              className="flex flex-col bg-slate-50/70 rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-2">
                Subject &amp; Topic Tracking
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Break complex topics down into sequential lecture sessions with instant video links and personalized study notes.
              </p>
            </div>

            {/* Feature 2: Coding Problem Repository */}
            <div
              id="feature-coding-repository"
              className="flex flex-col bg-slate-50/70 rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-2">
                Coding Problem Repository
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Curate algorithmic challenges by difficulty and topic with direct problem links, personal notes, and solved status.
              </p>
            </div>

            {/* Feature 3: Calendar Planner */}
            <div
              id="feature-calendar-planner"
              className="flex flex-col bg-slate-50/70 rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-2">
                Calendar Planner
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Schedule study routines, keep track of upcoming milestones, and ensure consistent daily coding practice.
              </p>
            </div>

            {/* Feature 4: Progress & Readiness Tracking */}
            <div
              id="feature-readiness-tracking"
              className="flex flex-col bg-slate-50/70 rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-2">
                Progress &amp; Readiness Tracking
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Quantify your preparation with real-time completion benchmarks across lectures and algorithmic problem sets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Closing Call to Action Section */}
      <section id="closing-cta-section" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-2xl p-8 sm:p-12 text-center text-white shadow-md relative overflow-hidden">
            {/* Subtle highlight */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2
                id="cta-headline"
                className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight"
              >
                Ready to organize your learning and coding journey?
              </h2>
              <p
                id="cta-subtext"
                className="mt-4 text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed"
              >
                Create your account in seconds and start cataloging lectures, solving problems, and benchmarking your progress today.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <button
                  id="cta-signup-btn"
                  type="button"
                  onClick={onNavigateToSignup}
                  className="w-full sm:w-auto min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-semibold text-sm sm:text-base transition-colors cursor-pointer shadow-xs"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4 text-slate-900" />
                </button>
                <button
                  id="cta-login-btn"
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full sm:w-auto min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-sm sm:text-base border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>Already registered? Log In</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Minimal Public Footer */}
      <footer id="landing-footer" className="mt-auto py-8 border-t border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Progress Path</span>
            <span>&bull;</span>
            <span>Structured technical learning platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Log In
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={onNavigateToSignup}
              className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
