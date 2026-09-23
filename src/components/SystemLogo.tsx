import React, { useState } from 'react';

interface SystemLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'image' | 'vector';
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function SystemLogo({
  className = '',
  size = 'md',
  variant = 'image',
  showWordmark = false,
  wordmarkClassName = 'font-bold text-white tracking-tight text-xl',
}: SystemLogoProps) {
  const [imgError, setImgError] = useState(false);

  // Preset dimension classes
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  }[size];

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        className={`relative overflow-hidden bg-white shadow-xs flex items-center justify-center shrink-0 border border-slate-200/50 p-0.5 ${sizeClasses} ${className}`}
        title="ProgressPath"
      >
        {!imgError && variant !== 'vector' ? (
          <img
            src="/Gemini_Generated_Image_szcymaszcymaszcy.png"
            alt="ProgressPath System Logo"
            className="w-full h-full object-contain select-none"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-0.5"
          >
            <defs>
              <linearGradient id="sys-blue" x1="120" y1="360" x2="260" y2="240" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="40%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="sys-cyan" x1="180" y1="320" x2="320" y2="190" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="45%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#00e5ff" />
              </linearGradient>
              <linearGradient id="sys-arrow" x1="270" y1="250" x2="410" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0077b6" />
                <stop offset="35%" stopColor="#00b4d8" />
                <stop offset="70%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="sys-head" x1="290" y1="230" x2="410" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="40%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path
              d="M 110 355 L 175 290 C 185 280 200 280 210 290 L 225 305 L 180 350 C 172 358 162 362 150 362 L 215 362 C 223 362 230 358 235 352 L 255 330 L 275 350 L 250 378 C 238 390 222 396 205 396 L 125 396 C 112 396 102 386 102 373 C 102 366 105 360 110 355 Z"
              fill="url(#sys-blue)"
            />
            <path
              d="M 185 315 C 180 310 180 300 187 293 L 260 220 C 272 208 290 208 302 220 L 315 233 L 290 258 C 285 253 277 253 272 258 L 202 328 C 196 334 186 334 180 328 L 185 315 Z"
              fill="url(#sys-cyan)"
            />
            <path
              d="M 252 284 L 285 251 C 290 246 298 246 303 251 L 340 288 C 345 293 345 301 340 306 L 318 328 C 306 340 288 340 276 328 L 252 304 C 248 300 248 288 252 284 Z"
              fill="url(#sys-arrow)"
            />
            <path
              d="M 285 251 L 350 186 C 356 180 365 180 371 186 L 396 211 C 402 217 402 226 396 232 L 340 288 L 305 253 L 285 251 Z"
              fill="url(#sys-arrow)"
            />
            <polygon
              points="425,115 320,155 355,185 305,235 345,275 395,225 425,260"
              fill="url(#sys-head)"
            />
          </svg>
        )}
      </div>

      {showWordmark && (
        <span className={wordmarkClassName}>
          ProgressPath
        </span>
      )}
    </div>
  );
}
