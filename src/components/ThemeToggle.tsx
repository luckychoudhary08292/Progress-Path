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
      <div className={`space-y-1.5 ${className}`}>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                id={`theme-opt-${opt.id}`}
                onClick={() => setTheme(opt.id)}
                className={`relative flex flex-col items-center sm:items-start text-center sm:text-left p-2 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1 sm:mb-1.5">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center transition-colors mx-auto sm:mx-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>

                  {isSelected && (
                    <span className="hidden sm:flex items-center justify-center w-3.5 h-3.5 rounded-full bg-indigo-600 text-white">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="w-full min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <span
                      className={`text-[11px] sm:text-xs font-bold leading-tight truncate ${
                        isSelected
                          ? 'text-indigo-950 dark:text-indigo-200'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>
                  {showDescription && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug hidden sm:block">
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
