import React, { useState, useEffect } from 'react';
import { BookOpen, Code2, Calendar as CalendarIcon, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  stat: string;
  statLabel: string;
  badge: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'subjects',
    title: 'Subject & Topic Tracking',
    tagline: 'Structured Course Roadmaps',
    description: 'Break complex topics into sequential lecture sessions with instant video links and personal study notes.',
    icon: BookOpen,
    stat: '100%',
    statLabel: 'Milestone tracking',
    badge: 'Curriculum',
  },
  {
    id: 'coding',
    title: 'Coding Problem Repository',
    tagline: 'Targeted Algorithmic Practice',
    description: 'Curate challenges by difficulty and topic with direct problem URLs, personal notes, and solved status.',
    icon: Code2,
    stat: 'Easy → Hard',
    statLabel: 'Tiered challenges',
    badge: 'Algorithm Hub',
  },
  {
    id: 'calendar',
    title: 'Calendar & Readiness Benchmarks',
    tagline: 'Consistent Study Schedule',
    description: 'Schedule daily study blocks, set milestone deadlines, and monitor your holistic engineering readiness.',
    icon: CalendarIcon,
    stat: 'Real-time',
    statLabel: 'Readiness scores',
    badge: 'Planner',
  },
];

export function AuthFeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const activeFeature = FEATURES[activeIndex];
  const ActiveIcon = activeFeature.icon;

  return (
    <div
      id="auth-feature-showcase"
      className="hidden md:flex md:w-5/12 lg:w-1/2 bg-slate-900 text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden select-none"
    >
      {/* Subtle ambient lighting effect */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-sm text-white">
            P
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-sm block leading-none">Progress Path</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Engineering LMS</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-slate-200 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Technical preparation platform</span>
        </div>

        <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-white leading-snug">
          Keep your engineering curriculum and coding practice on track.
        </h2>
      </div>

      {/* Middle: Active Feature Card Showcase */}
      <div className="relative z-10 my-6">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 backdrop-blur-xs transition-all duration-300">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <ActiveIcon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-white/10 text-slate-300">
              {activeFeature.badge}
            </span>
          </div>

          <p className="text-xs font-semibold text-blue-400 tracking-wide uppercase mb-1">
            {activeFeature.tagline}
          </p>
          <h3 className="text-base font-bold text-white tracking-tight mb-2">
            {activeFeature.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed min-h-[38px]">
            {activeFeature.description}
          </p>

          <div className="mt-4 pt-3.5 border-t border-slate-700/70 flex items-center justify-between text-xs">
            <span className="text-slate-400">{activeFeature.statLabel}</span>
            <span className="font-semibold text-white font-mono">{activeFeature.stat}</span>
          </div>
        </div>

        {/* Carousel indicators & manual controls */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {FEATURES.map((feat, idx) => (
            <button
              key={feat.id}
              type="button"
              id={`showcase-dot-${feat.id}`}
              onClick={() => setActiveIndex(idx)}
              className={`transition-all duration-200 cursor-pointer ${
                activeIndex === idx
                  ? 'w-6 h-2 bg-blue-500 rounded-full'
                  : 'w-2 h-2 bg-slate-700 hover:bg-slate-600 rounded-full'
              }`}
              aria-label={`Show ${feat.title}`}
            />
          ))}
        </div>
      </div>

      {/* Footer Trust checklist */}
      <div className="relative z-10 pt-4 border-t border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero-distraction, focus-oriented layout</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instant readiness calculation &amp; audit logging</span>
          </div>
        </div>
      </div>
    </div>
  );
}
