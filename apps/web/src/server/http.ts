import type { Context } from 'hono';
import { z } from 'zod';
import { getCookie } from 'hono/cookie';
import { and, eq, gt } from 'drizzle-orm';
import { database } from './db/client';
import { sessions } from './db/schema';
import { cookieName, verifySession } from './security';
import { ApiError } from './errors';

export async function readBody<T>(request: Request, schema: z.ZodType<T>, maximum = 180000): Promise<T> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new ApiError('invalid_input', 'Use a JSON request.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('invalid_input', 'A request body is required.');
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > maximum) { await reader.cancel(); throw new ApiError('invalid_input', 'Request is too large.', 413); }
      chunks.push(value);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString());
    const result = schema.safeParse(parsed);
    if (!result.success) throw new ApiError('invalid_input', result.error.issues[0]?.message ?? 'Check the submitted fields.');
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('invalid_input', 'Request could not be read as valid JSON.');
  } finally { reader.releaseLock(); }
}
export async function owner(context: Context) {
  const id = verifySession(getCookie(context, cookieName));
  const [session] = await database().select({ id: sessions.id }).from(sessions)
    .where(and(eq(sessions.id, id), gt(sessions.expires, new Date()))).limit(1);
  if (!session) throw new ApiError('unauthorized', 'Session expired. Reconnect to continue.', 401);
  return id;
}
