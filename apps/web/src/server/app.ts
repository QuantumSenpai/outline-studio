import { Hono } from 'hono';
import { verifyOrigin } from './security';
import { ApiError } from './errors';
import { sessionRoutes } from './routes/session';
import { feedbackRoutes } from './routes/feedback';
import { providerRoutes } from './routes/providers';
import { stageRoutes } from './routes/stages';
import { sourceRoutes } from './routes/sources';
import { chatRoutes } from './routes/chat';

export const app = new Hono<{ Variables: { requestId: string } }>().basePath('/api');
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID()); c.header('X-Request-ID', c.get('requestId'));
  const started = performance.now();
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') verifyOrigin(c.req.raw);
  await next();
  c.header('Server-Timing', `app;dur=${(performance.now() - started).toFixed(1)}`);
});
app.get('/health', c => c.json({ status: 'ok', databaseConfigured: Boolean(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL), sessionConfigured: Boolean(process.env.SESSION_SECRET) }));
app.route('/', chatRoutes);
app.route('/', sessionRoutes).route('/', feedbackRoutes).route('/', providerRoutes).route('/', stageRoutes).route('/', sourceRoutes);
app.onError((error, c) => {
  if (error instanceof ApiError) {
    if (error.retryAfter) c.header('Retry-After', String(error.retryAfter));
    return c.json({ ...error.toJSON(), requestId: c.get('requestId') }, error.status as 400 | 401 | 402 | 403 | 409 | 413 | 415 | 422 | 429 | 502 | 503 | 504);
  }
  return c.json({ requestId: c.get('requestId'), code: 'unavailable', message: 'The server could not complete this action. Your local work is preserved. Retry shortly.' }, 503);
});
