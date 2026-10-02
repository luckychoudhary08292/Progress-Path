import app, { ensureDbInitialized } from '../server/app.ts';

export default async function handler(req: any, res: any) {
  await ensureDbInitialized();
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/health')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}
