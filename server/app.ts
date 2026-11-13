import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes, { authenticateToken, authenticateAdmin } from './routes/auth.ts';
import dashboardRoutes from './routes/dashboard.ts';
import subjectsRoutes from './routes/subjects.ts';
import problemsRoutes from './routes/problems.ts';
import calendarRoutes from './routes/calendar.ts';
import adminRoutes from './routes/admin.ts';
import feedbackRoutes from './routes/feedback.ts';
import notificationsRoutes from './routes/notifications.ts';
import { PublicStatsRepository } from './repositories.ts';
import { initDatabase, isDbConnected, getDbError, getConnectedDbName } from './db.ts';
import { bootstrapInitialAdmin } from './bootstrap.ts';
import { SYSTEM_LIMITS } from './config/limits.ts';
import {
  securityHeaders,
  corsHandler,
  noSqlInjectionSanitizer,
  hppProtection,
  apiRateLimiter,
} from './middleware/security.ts';

// Load environment configuration
dotenv.config({ override: true });
if (fs.existsSync(path.resolve(process.cwd(), '.env.example'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.example'), override: false });
}

// Lazy, once-per-process database and admin bootstrap initializer (safe for serverless & long-lived Node)
let dbInitPromise: Promise<boolean> | null = null;
export async function ensureDbInitialized(): Promise<boolean> {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        await initDatabase();
        await bootstrapInitialAdmin();
        return true;
      } catch (err) {
        console.error('[Database Init Error]:', err);
        return false;
      }
    })();
  }
  return dbInitPromise;
}

export const app = express();

// Trust reverse proxies (Render, Cloudflare, load balancers) for accurate client IP
app.set('trust proxy', 1);

// 1. Security Headers & Hardening
app.use(securityHeaders);

// 2. CORS Handling
app.use(corsHandler);

// 3. Request parsing & limits (protect against large body payload DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Anti-NoSQL Injection & HPP Sanitizer
app.use(noSqlInjectionSanitizer);
app.use(hppProtection);

// 5. System Health and Instant Status Checks (Render, Vercel & AI Studio dev supervisor)
const healthCheckHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    database: isDbConnected() ? 'connected' : 'fallback-store',
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthCheckHandler);
app.get('/healthz', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// 6. Ensure DB initialization on incoming API requests (non-blocking for health probes)
app.use(async (req, _res, next) => {
  if (req.url.startsWith('/api') && !req.url.startsWith('/api/health')) {
    await ensureDbInitialized();
  }
  next();
});

app.get('/api/system/status', authenticateToken, authenticateAdmin, (_req, res) => {
  const dbConnected = isDbConnected();
  const dbError = getDbError();
  const isAuthError = Boolean(dbError && (dbError.includes('bad auth') || dbError.includes('authentication failed')));

  res.json({
    database: {
      connected: dbConnected,
      databaseName: getConnectedDbName(),
      status: dbConnected ? 'Connected to MongoDB Atlas' : 'Resilient In-Memory High-Performance Store',
      details: dbConnected
        ? 'Mongoose connected directly to MongoDB cluster'
        : isAuthError
        ? 'MongoDB authentication failed. Check MONGODB_URI credentials in environment variables. Fallback store active.'
        : dbError
        ? 'Database connection unavailable. Resilient fallback store active.'
        : 'Offline fallback mode active.',
    },
    limits: {
      maxUsers: SYSTEM_LIMITS.MAX_USERS,
      maxSubjectsPerUser: SYSTEM_LIMITS.MAX_SUBJECTS_PER_USER,
      maxLecturesPerSubject: SYSTEM_LIMITS.MAX_LECTURES_PER_SUBJECT,
      maxProblemsPerUser: SYSTEM_LIMITS.MAX_PROBLEMS_PER_USER,
      maxEventsPerUser: SYSTEM_LIMITS.MAX_EVENTS_PER_USER,
      maxEventsPerDay: SYSTEM_LIMITS.MAX_EVENTS_PER_DAY,
      maxNotificationsPerUser: SYSTEM_LIMITS.MAX_NOTIFICATIONS_PER_USER,
      maxFeedbackPerUser: SYSTEM_LIMITS.MAX_FEEDBACK_PER_USER,
    },
    security: {
      antiBruteForce: `Active (Sliding-window IP limit: ${SYSTEM_LIMITS.AUTH_RATE_LIMIT_MAX} attempts / 15 min + ${SYSTEM_LIMITS.AUTH_LOCKOUT_THRESHOLD}-fail account lockout)`,
      antiDDoS: `Active (Sliding-window rate limiting: ${SYSTEM_LIMITS.IP_API_RATE_LIMIT_PER_MIN} req/min IP + ${SYSTEM_LIMITS.USER_API_RATE_LIMIT_PER_MIN} req/min per-user)`,
      noSqlInjectionProtection: 'Active (Deep sanitization blocking $, ., __proto__, constructor, prototype & deep nesting)',
      xssSanitization: 'Active (HTML escaping, strict http/https URL scheme enforcement, strict CSP)',
      contentSecurityHeaders: 'Active (CSP, HSTS in production, nosniff, SAMEORIGIN, no X-Powered-By)',
      passwordCryptography: 'Active (bcryptjs multi-round salting, min 8 characters)',
      sessionAuthorization: 'Active (JWT HMAC-SHA256 strictly pinned algorithm)',
      roleBasedAccessControl: 'Active (Strict separation of user vs admin privileges)',
      cors: 'Active (Strict origin allowlist validation, no arbitrary origin reflection)',
    },
    performance: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      nodeVersion: process.version,
      serverLatency: 'Sub-millisecond local caching & indexed queries',
    },
  });
});

// 7. Public Platform Stats (Anonymous Real-Time Counts)
app.get('/api/public-stats', async (_req, res) => {
  try {
    const stats = await PublicStatsRepository.getPlatformStats();
    res.json(stats);
  } catch (err) {
    console.error('[Public Stats Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve public platform stats' });
  }
});

// 8. Rate Limiters & Core API Routes
app.use('/api', apiRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationsRoutes);

// 9. Unknown API routes 404 handler (Prevents fallthrough to SPA index.html)
app.all('/api/*', (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// 10. Global Error Handler (Hides verbose stack traces in production)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid JSON payload' });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ message: 'Request payload too large' });
    return;
  }

  console.error('[Unhandled Server Error]:', err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(status).json({
    message: isProduction ? 'Internal Server Error' : err?.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err?.stack }),
  });
});

export default app;
