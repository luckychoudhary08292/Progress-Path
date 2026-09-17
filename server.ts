import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.ts';
import dashboardRoutes from './server/routes/dashboard.ts';
import subjectsRoutes from './server/routes/subjects.ts';
import problemsRoutes from './server/routes/problems.ts';
import calendarRoutes from './server/routes/calendar.ts';
import adminRoutes from './server/routes/admin.ts';
import { initDatabase } from './server/db.ts';
import { createServer as createViteServer } from 'vite';

dotenv.config({ override: true });
if (fs.existsSync(path.resolve(process.cwd(), '.env.example'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.example'), override: false });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Connect Database (MongoDB Mongoose or fallback)
  await initDatabase();

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.use('/api/auth', authRoutes);

  // Dashboard routes
  app.use('/api/dashboard', dashboardRoutes);

  // Subjects & Lectures routes
  app.use('/api/subjects', subjectsRoutes);

  // Coding Repository routes
  app.use('/api/problems', problemsRoutes);

  // Calendar routes
  app.use('/api/calendar', calendarRoutes);

  // Admin routes
  app.use('/api/admin', adminRoutes);

  // Vite middleware for development vs static build for production
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
    console.log(`Server running at http://${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
