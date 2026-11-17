import { Hono } from 'hono';
import { verifyOrigin } from './security';
import { ApiError } from './errors';
import { sessionRoutes } from './routes/session';
import { feedbackRoutes } from './routes/feedback';
import { providerRoutes } from './routes/providers';
import { stageRoutes } from './routes/stages';
import { sourceRoutes } from './routes/sources';

export const app = new Hono().basePath('/api');
app.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') verifyOrigin(c.req.raw);
  await next();
});
app.get('/health', c => c.json({ status: 'ok', databaseConfigured: Boolean(process.env.DATABASE_URL), sessionConfigured: Boolean(process.env.SESSION_SECRET) }));
app.route('/', sessionRoutes).route('/', feedbackRoutes).route('/', providerRoutes).route('/', stageRoutes).route('/', sourceRoutes);
app.onError((error, c) => {
  if (error instanceof ApiError) {
    if (error.retryAfter) c.header('Retry-After', String(error.retryAfter));
    return c.json(error.toJSON(), error.status as 400 | 401 | 403 | 409 | 413 | 415 | 429 | 502 | 503 | 504);
  }
  return c.json({ code: 'unavailable', message: 'The server could not complete this action. Your local work is preserved. Retry shortly.' }, 503);
});
