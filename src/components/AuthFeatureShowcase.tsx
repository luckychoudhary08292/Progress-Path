import React from 'react';
import { BookOpen, Code2, Calendar, ShieldCheck } from 'lucide-react';
import { SystemLogo } from './SystemLogo.tsx';

export function AuthFeatureShowcase() {
  return (
    <div
      id="auth-feature-showcase"
      className="hidden md:flex md:w-5/12 lg:w-1/2 bg-slate-950 text-white p-8 lg:p-12 flex-col justify-between select-none border-l border-slate-800/80"
    >
      {/* Top: Clean Brand Header */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <SystemLogo size="md" />
          <span className="font-bold text-white tracking-tight text-lg">
            ProgressPath
          </span>
        </div>

        <h2 className="text-xl lg:text-2xl font-semibold tracking-tight text-white leading-snug">
          Your personal engineering study vault.
        </h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          A calm, structured workspace to track curricula, solve problems, and build technical mastery.
        </p>
      </div>

      {/* Middle: 3 Simple, Understated Pillars */}
      <div className="my-8 space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Curriculum Roadmaps
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured syllabi with private lecture notes and milestone tracking.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Problem Vault
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Organize coding problems, revisit tricky algorithms, and track solutions.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Study Calendar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Plan daily focus sessions and keep a consistent learning rhythm.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: Subtle Trust Note */}
      <div className="pt-6 border-t border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
        <span>Private by default. Focused on quiet, disciplined learning.</span>
      </div>
    </div>
  );
}
