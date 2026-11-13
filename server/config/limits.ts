/**
 * Centralized, environment-configurable User Limits, Quotas & Rate-Limiting Guardrails.
 * Prevents resource exhaustion, spam, brute-force attacks, and unbounded DB growth.
 */

function parsePositiveInt(envVal: string | undefined, fallback: number, allowZero = false): number {
  if (envVal === undefined || envVal.trim() === '') return fallback;
  const parsed = Number.parseInt(envVal.trim(), 10);
  if (Number.isNaN(parsed)) return fallback;
  if (allowZero && parsed === 0) return 0;
  return parsed > 0 ? parsed : fallback;
}

export const SYSTEM_LIMITS = {
  // Total registered user cap across the platform (0 = unlimited)
  MAX_USERS: parsePositiveInt(process.env.MAX_USERS, 500, true),

  // Per-user resource quotas
  MAX_SUBJECTS_PER_USER: parsePositiveInt(process.env.MAX_SUBJECTS_PER_USER, 50),
  MAX_LECTURES_PER_SUBJECT: parsePositiveInt(process.env.MAX_LECTURES_PER_SUBJECT, 500),
  MAX_PROBLEMS_PER_USER: parsePositiveInt(process.env.MAX_PROBLEMS_PER_USER, 1000),
  MAX_EVENTS_PER_USER: parsePositiveInt(process.env.MAX_EVENTS_PER_USER, 1000),
  MAX_EVENTS_PER_DAY: parsePositiveInt(process.env.MAX_EVENTS_PER_DAY, 50),
  MAX_NOTIFICATIONS_PER_USER: parsePositiveInt(process.env.MAX_NOTIFICATIONS_PER_USER, 100),
  MAX_FEEDBACK_PER_USER: parsePositiveInt(process.env.MAX_FEEDBACK_PER_USER, 50),

  // Rate limits & Brute-force protection
  AUTH_RATE_LIMIT_MAX: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 20), // per 15 min per IP
  AUTH_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  AUTH_LOCKOUT_THRESHOLD: parsePositiveInt(process.env.AUTH_LOCKOUT_THRESHOLD, 5),
  AUTH_LOCKOUT_DURATION_MS: parsePositiveInt(process.env.AUTH_LOCKOUT_MINUTES, 15) * 60 * 1000,
  IP_API_RATE_LIMIT_PER_MIN: parsePositiveInt(process.env.IP_API_RATE_LIMIT_PER_MIN, 600),
  USER_API_RATE_LIMIT_PER_MIN: parsePositiveInt(process.env.USER_API_RATE_LIMIT_PER_MIN, 240),

  // Field length bounds
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MAX_NAME_LENGTH: 80,
  MAX_EMAIL_LENGTH: 254,
  MAX_TITLE_LENGTH: 200,
  MAX_CATEGORY_LENGTH: 80,
  MAX_URL_LENGTH: 2048,
  MAX_NOTES_LENGTH: 10000,
  MAX_BULK_ITEMS: 500,
} as const;
