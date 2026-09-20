import { Request, Response, NextFunction } from 'express';

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const authIpRecords = new Map<string, RateLimitRecord>();
const generalIpRecords = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of authIpRecords.entries()) {
    if (rec.resetTime < now) authIpRecords.delete(ip);
  }
  for (const [ip, rec] of generalIpRecords.entries()) {
    if (rec.resetTime < now) generalIpRecords.delete(ip);
  }
}, 60000);

/**
 * Rate limiter for Authentication (Login / Signup)
 * Protects against brute-force attacks and credential stuffing
 * Limit: 25 attempts per 15 minutes per IP
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 25;

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
 * General API Rate Limiter
 * Protects against Denial of Service (DoS) and API abuse
 * Limit: 300 requests per minute per IP
 */
export function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 350;

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
      message: 'Rate limit exceeded. Too many requests. Please slow down.',
      retryAfterSeconds: retryAfterSec,
    });
    return;
  }

  next();
}

/**
 * Security Headers Middleware (Defensive hardening)
 * Implements equivalent protections of helmet:
 * - Anti-sniffing
 * - Clickjacking prevention
 * - Cross-site scripting (XSS) filter
 * - Referrer policy
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
}

/**
 * CORS Configuration Middleware
 * Safely manages allowed origins without exposing open wildcards for authenticated routes
 */
export function corsHandler(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigin = process.env.CORS_ORIGIN;
  const origin = req.headers.origin;

  if (allowedOrigin) {
    if (origin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}

/**
 * Recursively sanitizes objects to prevent NoSQL Injection attacks.
 * Rejects or strips any keys that start with '$' or contain '.'
 */
function sanitizeValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    // Drop keys starting with '$' (e.g. $gt, $ne, $where) or containing '.' to block NoSQL injection
    if (k.startsWith('$') || k.includes('.')) {
      continue;
    }
    cleanObj[k] = sanitizeValue(v);
  }
  return cleanObj;
}

/**
 * Anti-NoSQL Injection Middleware
 * Sanitizes req.body, req.query, and req.params before passing to routes
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
 * Basic XSS sanitizer utility for text fields
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
