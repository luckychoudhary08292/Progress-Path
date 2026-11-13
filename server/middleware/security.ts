import type { Request, Response, NextFunction } from 'express';
import { SYSTEM_LIMITS } from '../config/limits.ts';

// ----------------------------------------------------------------------
// Rate Limiting & Brute-Force Lockout Stores
// ----------------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface LoginFailureRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const authIpRecords = new Map<string, RateLimitRecord>();
const generalIpRecords = new Map<string, RateLimitRecord>();
const userApiRecords = new Map<string, RateLimitRecord>();
const accountFailures = new Map<string, LoginFailureRecord>();

// Cleanup stale records periodically to prevent memory bloat
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [k, rec] of authIpRecords.entries()) {
    if (rec.resetTime < now) authIpRecords.delete(k);
  }
  for (const [k, rec] of generalIpRecords.entries()) {
    if (rec.resetTime < now) generalIpRecords.delete(k);
  }
  for (const [k, rec] of userApiRecords.entries()) {
    if (rec.resetTime < now) userApiRecords.delete(k);
  }
  for (const [email, rec] of accountFailures.entries()) {
    const expiredLock = rec.lockedUntil !== null && rec.lockedUntil < now;
    const staleWindow = rec.lockedUntil === null && now - rec.firstAttemptAt > SYSTEM_LIMITS.AUTH_RATE_LIMIT_WINDOW_MS;
    if (expiredLock || staleWindow) {
      accountFailures.delete(email);
    }
  }
}, 60000);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Per-account brute-force lockout protection
 */
export function checkAccountLockout(email: string): { locked: boolean; retryAfterSeconds: number } {
  const key = email.trim().toLowerCase();
  const rec = accountFailures.get(key);
  if (!rec || rec.lockedUntil === null) {
    return { locked: false, retryAfterSeconds: 0 };
  }
  const now = Date.now();
  if (rec.lockedUntil <= now) {
    accountFailures.delete(key);
    return { locked: false, retryAfterSeconds: 0 };
  }
  return {
    locked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((rec.lockedUntil - now) / 1000)),
  };
}

export function recordFailedLogin(email: string): { lockedNow: boolean; remainingAttempts: number } {
  const key = email.trim().toLowerCase();
  const now = Date.now();
  let rec = accountFailures.get(key);

  if (!rec || now - rec.firstAttemptAt > SYSTEM_LIMITS.AUTH_RATE_LIMIT_WINDOW_MS) {
    rec = { attempts: 1, firstAttemptAt: now, lockedUntil: null };
    accountFailures.set(key, rec);
    return {
      lockedNow: false,
      remainingAttempts: Math.max(0, SYSTEM_LIMITS.AUTH_LOCKOUT_THRESHOLD - 1),
    };
  }

  rec.attempts += 1;
  if (rec.attempts >= SYSTEM_LIMITS.AUTH_LOCKOUT_THRESHOLD) {
    rec.lockedUntil = now + SYSTEM_LIMITS.AUTH_LOCKOUT_DURATION_MS;
    return { lockedNow: true, remainingAttempts: 0 };
  }

  return {
    lockedNow: false,
    remainingAttempts: Math.max(0, SYSTEM_LIMITS.AUTH_LOCKOUT_THRESHOLD - rec.attempts),
  };
}

export function clearFailedLogin(email: string): void {
  if (!email) return;
  accountFailures.delete(email.trim().toLowerCase());
}

/**
 * Rate limiter for Authentication (Login / Signup)
 * Protects against brute-force attacks and credential stuffing
 * Default Limit: 20 attempts per 15 minutes per client IP
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = SYSTEM_LIMITS.AUTH_RATE_LIMIT_WINDOW_MS;
  const maxAttempts = SYSTEM_LIMITS.AUTH_RATE_LIMIT_MAX;

  let record = authIpRecords.get(ip);
  if (!record || record.resetTime < now) {
    record = { count: 1, resetTime: now + windowMs };
    authIpRecords.set(ip, record);
    return next();
  }

  record.count += 1;
  if (record.count > maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    res.status(429).json({
      message: 'Too many authentication attempts. Please wait a few minutes before trying again.',
      retryAfterSeconds: retryAfterSec,
    });
    return;
  }

  next();
}

/**
 * General API Rate Limiter (IP-based DDoS & scraping guard)
 */
export function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS' || req.path === '/health' || req.path === '/api/health' || req.path === '/healthz') {
    return next();
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = SYSTEM_LIMITS.IP_API_RATE_LIMIT_PER_MIN;

  let record = generalIpRecords.get(ip);
  if (!record || record.resetTime < now) {
    record = { count: 1, resetTime: now + windowMs };
    generalIpRecords.set(ip, record);
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    res.status(429).json({
      message: 'Rate limit exceeded. Too many requests from this IP. Please slow down.',
      retryAfterSeconds: retryAfterSec,
    });
    return;
  }

  next();
}

/**
 * Per-User Authenticated API Rate Limiter
 * Prevents any single authenticated account from flooding or abusing API endpoints
 */
export function userRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  if (!user || !user.id) {
    return next();
  }

  const key = String(user.id);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = SYSTEM_LIMITS.USER_API_RATE_LIMIT_PER_MIN;

  let record = userApiRecords.get(key);
  if (!record || record.resetTime < now) {
    record = { count: 1, resetTime: now + windowMs };
    userApiRecords.set(key, record);
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    res.status(429).json({
      message: 'User request rate limit exceeded. Please wait a moment before continuing.',
      retryAfterSeconds: retryAfterSec,
    });
    return;
  }

  next();
}

/**
 * Security Headers Middleware (Defensive hardening)
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "media-src 'self' https: blob:",
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://drive.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  res.removeHeader('X-Powered-By');
  next();
}

/**
 * Strict CORS Configuration Middleware
 * Validates Origin against configured CORS_ORIGIN allowlist or same-host origin.
 * Never reflects arbitrary unrecognized origins.
 */
export function corsHandler(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');

  if (origin) {
    const rawAllowed = process.env.CORS_ORIGIN || '';
    const configuredOrigins = rawAllowed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const requestHost = req.headers.host;
    const isSameHost =
      Boolean(requestHost) &&
      (origin === `https://${requestHost}` || origin === `http://${requestHost}`);

    const isDevLocal =
      process.env.NODE_ENV !== 'production' &&
      (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) || origin.endsWith('.run.app'));

    const isExplicitlyAllowed = configuredOrigins.includes(origin);

    if (isSameHost || isExplicitlyAllowed || isDevLocal) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (req.method === 'OPTIONS') {
      res.status(403).json({ message: 'Origin not allowed by CORS policy' });
      return;
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively sanitizes objects to prevent NoSQL Injection and Prototype Pollution.
 */
function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 20) return undefined;
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(k) || k.startsWith('$') || k.includes('.')) {
      continue;
    }
    cleanObj[k] = sanitizeValue(v, depth + 1);
  }
  return cleanObj;
}

/**
 * Anti-NoSQL Injection & Anti-Prototype-Pollution Middleware
 */
export function noSqlInjectionSanitizer(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as any;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as any;
  }
  next();
}

/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 * Ensures query parameters cannot be coerced into unexpected arrays by attackers.
 */
export function hppProtection(req: Request, _res: Response, next: NextFunction): void {
  if (req.query && typeof req.query === 'object') {
    const cleanQuery: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(req.query)) {
      if (Array.isArray(val)) {
        cleanQuery[key] = val.length > 0 ? String(val[0]) : '';
      } else {
        cleanQuery[key] = val;
      }
    }
    req.query = cleanQuery as any;
  }
  next();
}

/**
 * HTML escaping sanitizer utility for text fields
 */
export function sanitizeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates URLs to permit strictly http:// or https:// protocols (blocks javascript:, data:, vbscript:, file:).
 * Returns sanitized trimmed URL or throws/flags invalid URLs.
 */
export function isSafeHttpUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > SYSTEM_LIMITS.MAX_URL_LENGTH) return false;
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return false;

  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    // Reject explicit non-http schemes like javascript:foo or data:text/html
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !/^https?:/i.test(trimmed)) {
      return false;
    }
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeSafeUrl(rawUrl: unknown): { valid: boolean; value: string } {
  if (rawUrl === undefined || rawUrl === null) {
    return { valid: true, value: '' };
  }
  if (typeof rawUrl !== 'string') {
    return { valid: false, value: '' };
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: true, value: '' };
  }
  if (!isSafeHttpUrl(trimmed)) {
    return { valid: false, value: '' };
  }
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return { valid: true, value: normalized };
}

/**
 * Validates that a YYYY-MM-DD string represents an actual real calendar date.
 */
export function isValidDateString(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

/**
 * Validates YYYY-MM month format strictly (month 01..12).
 */
export function isValidMonthString(monthStr: unknown): monthStr is string {
  if (typeof monthStr !== 'string') return false;
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr.trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year >= 1970 && year <= 2100 && month >= 1 && month <= 12;
}
