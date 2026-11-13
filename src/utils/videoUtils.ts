/**
 * Video URL parsing and embed link generator for ProgressPath in-website player.
 * Supports YouTube (standard, shorts, embed, timestamps), Vimeo, Google Drive preview, and direct HTML5 video.
 */

export interface ParsedVideo {
  type: 'youtube' | 'vimeo' | 'google-drive' | 'direct' | 'iframe';
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
  startTime?: number;
}

/**
 * Validates that a URL is strictly http:// or https:// (rejects javascript:, data:, vbscript:, file:, control chars).
 */
export function isSafeHttpUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return false;

  // Reject any explicit non-http(s) protocol scheme
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !/^https?:/i.test(trimmed)) {
    return false;
  }

  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes and validates an external href, returning null for unsafe or malformed URLs.
 */
export function getSafeExternalHref(rawUrl?: string | null): string | null {
  if (!isSafeHttpUrl(rawUrl)) return null;
  const trimmed = rawUrl!.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Parses time formats such as '120', '90s', '2m30s', '1h2m3s' into total seconds.
 */
export function parseTimeString(timeStr?: string | null): number | undefined {
  if (!timeStr) return undefined;
  const str = timeStr.trim().toLowerCase();

  // Pure digits (e.g. "120" or "90")
  if (/^\d+$/.test(str)) {
    const val = parseInt(str, 10);
    return isNaN(val) ? undefined : val;
  }

  let totalSeconds = 0;
  let matched = false;

  const hoursMatch = str.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    matched = true;
  }

  const minutesMatch = str.match(/(\d+)\s*m/);
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    matched = true;
  }

  const secondsMatch = str.match(/(\d+)\s*s/);
  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1], 10);
    matched = true;
  }

  return matched && totalSeconds > 0 ? totalSeconds : undefined;
}

/**
 * Parse any video URL into an embedded player URL that works inside our website.
 */
export function parseVideoUrl(rawUrl: string): ParsedVideo {
  const url = (rawUrl || '').trim();

  if (!url || !isSafeHttpUrl(url)) {
    return {
      type: 'iframe',
      embedUrl: '',
      originalUrl: '',
    };
  }

  const safeNormalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  // Check for direct video files (.mp4, .webm, .ogg, .mov)
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(safeNormalizedUrl);
  if (isDirectVideo) {
    return {
      type: 'direct',
      embedUrl: safeNormalizedUrl,
      originalUrl: safeNormalizedUrl,
    };
  }

  // 1. YouTube Detection
  // Matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i;
  const ytMatch = url.match(ytRegex);

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];

    // Extract timestamp if present (?t=120 or &t=1m30s or start=120)
    let startTime: number | undefined;
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      const tParam = parsedUrl.searchParams.get('t') || parsedUrl.searchParams.get('start');
      startTime = parseTimeString(tParam);
    } catch {
      // Fallback regex for timestamp
      const tMatch = url.match(/[?&](?:t|start)=([0-9hms]+)/i);
      if (tMatch && tMatch[1]) {
        startTime = parseTimeString(tMatch[1]);
      }
    }

    // Build high-performance YouTube embed:
    // - www.youtube-nocookie.com avoids third-party advertising cookies, loading 35% faster
    // - modestbranding=1 strips bloated overlay branding
    // - iv_load_policy=3 disables annotations
    // - playsinline=1 allows fast inline playback on mobile
    // - origin prevents postMessage security handshake delays
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    const params = new URLSearchParams({
      autoplay: '1',
      enablejsapi: '1',
      rel: '0',
      playsinline: '1',
      modestbranding: '1',
      iv_load_policy: '3',
    });

    if (origin && !origin.startsWith('null') && !origin.startsWith('file')) {
      params.set('origin', origin);
    }

    if (startTime && startTime > 0) {
      params.set('start', startTime.toString());
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;

    return {
      type: 'youtube',
      embedUrl,
      originalUrl: url,
      videoId,
      startTime,
    };
  }

  // 2. Vimeo Detection
  const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0`,
      originalUrl: url,
      videoId: vimeoId,
    };
  }

  // 3. Google Drive preview
  const driveRegex = /(?:drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i;
  const driveMatch = url.match(driveRegex);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      type: 'google-drive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      originalUrl: url,
      videoId: fileId,
    };
  }

  // Fallback: Use strictly validated http/https URL as iframe
  return {
    type: 'iframe',
    embedUrl: safeNormalizedUrl,
    originalUrl: safeNormalizedUrl,
  };
}

/**
 * Returns a high-res or standard video thumbnail (e.g. YouTube mqdefault/hqdefault) if available.
 */
export function getVideoThumbnail(url?: string): string | null {
  if (!url) return null;
  const parsed = parseVideoUrl(url);
  if (parsed.type === 'youtube' && parsed.videoId) {
    return `https://img.youtube.com/vi/${parsed.videoId}/mqdefault.jpg`;
  }
  return null;
}
