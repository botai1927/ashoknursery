import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { registerSeoRoutes } from './src/server/seoRoutes.ts';
import { registerPublicRoutes } from './src/server/publicRoutes.ts';
import { registerAdminAiRoutes } from './src/server/adminAiRoutes.ts';
import { registerCloudinaryRoutes } from './src/server/cloudinaryRoutes.ts';
import { registerImageSearchRoutes } from './src/server/imageSearchRoutes.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const portArgIdx = process.argv.indexOf('--port');
  const cliPort =
    portArgIdx !== -1 && process.argv[portArgIdx + 1]
      ? parseInt(process.argv[portArgIdx + 1], 10)
      : NaN;
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
  const nginxPort = process.env.NGINX_PORT ? parseInt(process.env.NGINX_PORT, 10) : NaN;
  const defaultAppPort = process.env.DEFAULT_APP_PORT
    ? parseInt(process.env.DEFAULT_APP_PORT, 10)
    : 3000;
  const port =
    Number.isFinite(cliPort) && cliPort > 0
      ? cliPort
      : Number.isFinite(envPort) && envPort > 0 && !(process.env.NODE_ENV !== 'production' && envPort === nginxPort)
      ? envPort
      : defaultAppPort;

  // Trust 1 proxy hop (Google Cloud Run / reverse proxy) so req.ip reflects true client IP
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Iframe-compatible HTTP security headers (deliberately omits X-Frame-Options so AI Studio preview stays embedded)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    if (process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE)) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  const standardJsonParser = express.json({ limit: '768kb' });
  const cloudinaryUploadJsonParser = express.json({ limit: '15mb' });

  // Skip pre-auth JSON body parsing for /api/admin* routes so auth checks run before body parsing
  app.use((req, res, next) => {
    const normalizedPath = req.path.replace(/\/+$/, '') || '/';
    if (normalizedPath === '/api/admin' || normalizedPath.startsWith('/api/admin/')) {
      return next();
    }
    return standardJsonParser(req, res, next);
  });

  // Register modular API & SEO route handlers
  registerSeoRoutes(app);
  registerPublicRoutes(app);
  registerAdminAiRoutes(app, { standardJsonParser });
  registerCloudinaryRoutes(app, { standardJsonParser, cloudinaryUploadJsonParser });
  registerImageSearchRoutes(app);

  // Explicit 404 JSON response for unknown /api and /api/* endpoints
  app.all(['/api', '/api/*'], (_req, res) => {
    return res.status(404).json({
      success: false,
      error: 'API route not found',
    });
  });

  // Clean JSON error handling for oversized or malformed API payloads
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === 'entity.too.large' || err?.status === 413) {
      return res.status(413).json({
        success: false,
        error: 'অনুরোধের ডাটা সাইজ অনুমোদিত সীমার চেয়ে বড় (Payload too large)।',
      });
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        success: false,
        error: 'অবৈধ JSON ডাটা ফরম্যাট।',
      });
    }
    return next(err);
  });

  // Production static bundle vs Vite development middleware
  const distDir = path.resolve(__dirname, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.NODE_ENV !== 'development' && Boolean(process.env.K_SERVICE) && fs.existsSync(distIndexPath));

  if (!isProd) {
    const enableHmr = process.env.ENABLE_VITE_HMR === 'true' && process.env.DISABLE_HMR !== 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: enableHmr ? undefined : false,
        ws: enableHmr ? undefined : false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (!fs.existsSync(distIndexPath)) {
      console.warn('Warning: dist/index.html not found in production mode. Run "npm run build" before starting.');
    }
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(distIndexPath);
    });
  }

  const httpServer = app.listen(port, '0.0.0.0', () => {
    console.log(
      `Brahmyaman Nursery server running in ${isProd ? 'production' : 'development'} mode on http://0.0.0.0:${port}`
    );
  });

  // Graceful Cloud Run termination handler
  let isShuttingDown = false;
  const shutdownGracefully = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}; closing HTTP server gracefully...`);
    const forceTimer = setTimeout(() => {
      console.warn('Graceful shutdown timeout elapsed; exiting.');
      process.exit(0);
    }, 8000);
    forceTimer.unref();
    httpServer.close(() => {
      clearTimeout(forceTimer);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
  process.on('SIGINT', () => shutdownGracefully('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
