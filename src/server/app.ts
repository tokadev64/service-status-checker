import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/deno';
import { logger } from 'hono/logger';
import { collectStatuses } from './status_service.ts';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('/api/*', cors());

  app.get('/api/status', async (context) => {
    const result = await collectStatuses();
    return context.json(result);
  });

  app.get('*', async (context, next) => {
    if (context.req.path.startsWith('/api/')) {
      return next();
    }

    try {
      return await serveStatic(context.req.raw, {
        fsRoot: 'dist',
        urlRoot: '',
      });
    } catch {
      return context.html(
        '<!doctype html><html><body><h1>Frontend build is missing</h1><p>Run deno task build first.</p></body></html>',
        503,
      );
    }
  });

  return app;
}
