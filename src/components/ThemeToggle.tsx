import React from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemePreference } from '../context/ThemeContext.tsx';

interface ThemeToggleProps {
  variant?: 'segmented' | 'cards';
  className?: string;
  showDescription?: boolean;
}

export function ThemeToggle({
  variant = 'segmented',
  className = '',
  showDescription = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const options: Array<{
    id: ThemePreference;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'light',
      label: 'Light',
      description: 'Clean daylight aesthetic with sharp text contrast',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Low-light theme designed to reduce eye strain',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System',
      description: `Synchronizes automatically with device OS (${resolvedTheme === 'dark' ? 'currently Dark' : 'currently Light'})`,
      icon: Laptop,
    },
  ];

  if (variant === 'cards') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                id={`theme-opt-${opt.id}`}
                onClick={() => setTheme(opt.id)}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {isSelected && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isSelected
                          ? 'text-indigo-950 dark:text-indigo-200'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {opt.label}
                    </span>
                    {opt.id === 'system' && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                        ({resolvedTheme})
                      </span>
                    )}
                  </div>
                  {showDescription && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
                      {opt.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Segmented Pill Control (Default)
  return (
    <div
      id="theme-preference-segmented-control"
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 select-none ${className}`}
      role="radiogroup"
      aria-label="Theme preference selector"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            id={`theme-btn-${opt.id}`}
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(opt.id)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold ring-1 ring-slate-900/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
            title={`Switch to ${opt.label} theme`}
          >
            <Icon
              className={`w-3.5 h-3.5 transition-colors ${
                isSelected
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
