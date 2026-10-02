import path from 'path';
import express from 'express';
import app, { ensureDbInitialized } from './server/app.ts';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const PORT = process.env.RENDER && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize database and bootstrap initial admin
  await ensureDbInitialized();

  // Serve static files from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

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
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
