import { Hono } from 'hono';
import { connectionSchema } from '@outline-studio/schemas';
import { readBody, owner } from '../http';
import { listModels } from '../providers/transport';
import { limit } from '../db/limits';
import { ApiError } from '../errors';

export const providerRoutes = new Hono();
providerRoutes.post('/providers/validate', async c => {
  const id = await owner(c);
  await limit(`validation:${id}`, 30);
  const connection = await readBody(c.req.raw, connectionSchema, 3000);
  try {
    const models = await listModels(connection, AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(15000)]));
    return c.json({ models, verifiedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('timeout', 'Provider connection timed out or disconnected. Check your key and try again.', 504);
  }
});
