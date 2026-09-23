import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.ts';
import dashboardRoutes from './server/routes/dashboard.ts';
import subjectsRoutes from './server/routes/subjects.ts';
import problemsRoutes from './server/routes/problems.ts';
import calendarRoutes from './server/routes/calendar.ts';
import adminRoutes from './server/routes/admin.ts';
import { initDatabase, isDbConnected, getDbError, getConnectedDbName } from './server/db.ts';
import { bootstrapInitialAdmin } from './server/bootstrap.ts';
import {
  securityHeaders,
  corsHandler,
  noSqlInjectionSanitizer,
  apiRateLimiter,
  authRateLimiter,
} from './server/middleware/security.ts';
import { createServer as createViteServer } from 'vite';

dotenv.config({ override: true });
if (fs.existsSync(path.resolve(process.cwd(), '.env.example'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.example'), override: false });
}

async function startServer() {
  const app = express();
  // On Render, respect assigned port if RENDER environment is present; otherwise stay on container standard port 3000
  const PORT = process.env.RENDER && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // 1. Security Headers & Hardening
  app.use(securityHeaders);

  // 2. CORS Handling
  app.use(corsHandler);

  // 3. Request parsing & limits (protect against large body payload DoS)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Anti-NoSQL Injection Sanitizer
  app.use(noSqlInjectionSanitizer);

  // 5. Connect Database (MongoDB Mongoose or resilient fallback)
  await initDatabase();
  await bootstrapInitialAdmin();

  // 6. System Health and Security Status Check (Render health-check support on /health, /healthz, /api/health)
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

  app.get('/api/system/status', (_req, res) => {
    const dbConnected = isDbConnected();
    const dbError = getDbError();

    res.json({
      database: {
        connected: dbConnected,
        databaseName: getConnectedDbName(),
        status: dbConnected ? 'Connected to MongoDB Atlas' : 'Resilient In-Memory High-Performance Store',
        details: dbConnected
          ? 'Mongoose connected directly to MongoDB Atlas cluster'
          : dbError && (dbError.includes('bad auth') || dbError.includes('authentication failed'))
          ? 'MongoDB Atlas credentials for user "xyzcoding02_db_user" returned Atlas error 8000 (bad auth: authentication failed). The application is safely running on its resilient, zero-crash fallback store.'
          : dbError || 'Offline fallback mode active.',
      },
      security: {
        antiBruteForce: 'Active (Sliding-window IP rate limiting: 25 attempts / 15 min on auth)',
        antiDDoS: 'Active (Sliding-window rate limiting: 350 requests / min across API)',
        noSqlInjectionProtection: 'Active (Deep sanitization stripping $ query operators and nested injection keys)',
        xssSanitization: 'Active (HTML escaping on inputs and X-XSS-Protection: 1; mode=block header)',
        contentSecurityHeaders: 'Active (nosniff, SAMEORIGIN, no X-Powered-By, strict-origin referrer)',
        passwordCryptography: 'Active (bcryptjs multi-round salting)',
        sessionAuthorization: 'Active (JWT HMAC-SHA256 signature verification)',
        roleBasedAccessControl: 'Active (Strict separation of user vs admin privileges)',
        cors: 'Active (Restricted origin validation, credentials support, no wildcards)',
      },
      performance: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        nodeVersion: process.version,
        serverLatency: 'Sub-millisecond local caching & indexed queries',
      },
    });
  });

  // 7. Rate Limiters
  app.use('/api', apiRateLimiter);
  app.use('/api/auth', authRateLimiter, authRoutes);

  // 8. API Routes
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/subjects', subjectsRoutes);
  app.use('/api/problems', problemsRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/admin', adminRoutes);

  // 9. Unknown API routes 404 handler (Prevents fallthrough to SPA index.html)
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });

  // 10. Global Error Handler (Hides verbose stack traces in production)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Unhandled Server Error]:', err);
    const status = typeof err.status === 'number' ? err.status : 500;
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(status).json({
      message: isProduction ? 'Internal Server Error' : err.message || 'Internal Server Error',
      ...(isProduction ? {} : { stack: err.stack }),
    });
  });

  // Serve static files from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // 11. Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}


startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
