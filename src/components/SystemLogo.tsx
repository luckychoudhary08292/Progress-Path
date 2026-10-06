import React from 'react';

interface SystemLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'svg' | 'image' | 'vector';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function SystemLogo({
  className = '',
  size = 'md',
  variant,
  rounded,
  showWordmark = false,
  wordmarkClassName = 'font-bold text-slate-900 dark:text-white tracking-tight text-xl',
}: SystemLogoProps) {
  // Preset dimension classes with rounded corners
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-xl',
    xl: 'w-16 h-16 rounded-2xl',
  }[size];

  const customRounded = rounded ? `rounded-${rounded}` : '';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`relative overflow-hidden flex items-center justify-center shrink-0 transition-transform border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xs ${sizeClasses} ${customRounded} ${className}`}
        title="ProgressPath"
      >
        <img
          src="/system_logo.svg"
          alt="ProgressPath Logo"
          className="w-full h-full object-cover select-none pointer-events-none rounded-[inherit]"
        />
      </div>

      {showWordmark && (
        <span className={wordmarkClassName}>
          ProgressPath
        </span>
      )}
    </div>
  );
}
