import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Loader2, Video } from 'lucide-react';
import { parseVideoUrl, ParsedVideo } from '../utils/videoUtils.ts';

export interface LazyVideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  aspectRatio?: string;
  autoPlay?: boolean;
  rootMargin?: string;
  threshold?: number;
  onLoaded?: () => void;
  showOverlayTitle?: boolean;
}

/**
 * LazyVideoPlayer Component
 * Uses IntersectionObserver to prevent loading heavy YouTube iframes (1.8MB+ of scripts)
 * until the player is scrolled into the viewport (with configurable rootMargin).
 * Displays a lightweight high-res poster facade with instant playback capability.
 */
export function LazyVideoPlayer({
  videoUrl,
  title = 'Video Lecture',
  className = '',
  aspectRatio = 'aspect-video',
  autoPlay = true,
  rootMargin = '200px 0px',
  threshold = 0.1,
  onLoaded,
  showOverlayTitle = false,
}: LazyVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [hasUserActivated, setHasUserActivated] = useState(false);

  // Parse video source and metadata
  const parsedVideo: ParsedVideo = useMemo(() => {
    return parseVideoUrl(videoUrl);
  }, [videoUrl]);

  // Compute high-resolution thumbnail URL
  const thumbnailUrl = useMemo(() => {
    if (parsedVideo.type === 'youtube' && parsedVideo.videoId) {
      return `https://i.ytimg.com/vi/${parsedVideo.videoId}/hqdefault.jpg`;
    }
    return '';
  }, [parsedVideo]);

  // Intersection Observer: Only attach iframe once within viewport distance
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Fallback if browser doesn't support IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInViewport(true);
          // Once intersected, no need to keep observing
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  // Reset loading state when videoUrl changes
  useEffect(() => {
    setIsIframeLoaded(false);
    setHasUserActivated(false);
  }, [videoUrl]);

  const handleManualPlay = () => {
    setHasUserActivated(true);
    setIsInViewport(true);
  };

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    if (onLoaded) {
      onLoaded();
    }
  };

  const shouldRenderIframe = (isInViewport && autoPlay) || hasUserActivated;

  if (!parsedVideo.embedUrl) {
    return (
      <div
        ref={containerRef}
        className={`w-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white rounded-xl border border-zinc-800 ${aspectRatio} ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
          <Video className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-zinc-200">No video URL provided</p>
        <p className="text-xs text-zinc-500 mt-1">Please provide a valid YouTube or video link.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black select-none ${aspectRatio} ${className}`}
    >
      {/* 1. Heavy iframe is ONLY rendered when within viewport or explicitly activated */}
      {shouldRenderIframe ? (
        parsedVideo.type === 'direct' ? (
          <video
            src={parsedVideo.embedUrl}
            controls
            autoPlay={autoPlay || hasUserActivated}
            playsInline
            onLoadedData={handleIframeLoad}
            className="w-full h-full object-contain"
          />
        ) : (
          <iframe
            src={parsedVideo.embedUrl}
            title={title}
            loading="eager"
            onLoad={handleIframeLoad}
            className={`w-full h-full border-0 absolute inset-0 transition-opacity duration-300 ${
              isIframeLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        )
      ) : null}

      {/* 2. Instant Thumbnail Facade & Loading Overlay */}
      {(!shouldRenderIframe || !isIframeLoaded) && (
        <div
          onClick={handleManualPlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950 cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label={`Play ${title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleManualPlay();
            }
          }}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center" />
          )}

          {/* Dimmed backdrop overlay */}
          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />

          {/* Play Icon / Buffering Indicator */}
          <div className="absolute flex flex-col items-center justify-center gap-3">
            {shouldRenderIframe && !isIframeLoaded ? (
              <div className="flex flex-col items-center gap-2.5 bg-black/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-xs font-medium text-white/90 tracking-wide">
                  Buffering player...
                </span>
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-600/90 group-hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-950/50 group-hover:scale-110 transition-all duration-200">
                <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current ml-1 text-white" />
              </div>
            )}
          </div>

          {/* Optional Title Bar on Poster */}
          {showOverlayTitle && (
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              <h3 className="text-sm sm:text-base font-semibold text-white drop-shadow truncate">
                {title}
              </h3>
            </div>
          )}

          {/* Intersection Observer status badge in development/preview */}
          {!shouldRenderIframe && (
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-zinc-300 border border-white/10">
              Lazy loaded
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LazyVideoPlayer;
