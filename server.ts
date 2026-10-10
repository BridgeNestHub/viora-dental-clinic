import './src/server/loadEnv.js';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes/api.js';
import { loadDatabase } from './src/server/db/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Hosts such as Render/Railway provide PORT; AI Studio / Cloud Run proxies to the 3000 default.
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize DB & Seed data
  loadDatabase();

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // JSON error responses for API failures (malformed bodies, unexpected exceptions) instead of crashes or HTML pages
  app.use('/api', (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);

    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ success: false, error: { message: 'Malformed JSON request body.' } });
      return;
    }
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ success: false, error: { message: 'Request body is too large.' } });
      return;
    }

    console.error('[Viora Dental Server] Unhandled API error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error.' } });
  });

  // Serve generated asset images if requested directly
  app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));

  // In production, serve dist folder. In development, mount Vite dev server middlewares.
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Viora Dental Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Viora Dental Server] Startup failed:', err);
  process.exit(1);
});
