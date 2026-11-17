import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from './errors';

export const cookieName = 'outline-session';
const tokenSchema = z.object({ id: z.uuid(), exp: z.number().int() }).strict();
export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new ApiError('unavailable', 'The server session secret must be configured before submitting or generating.', 503);
  return secret;
}
const sign = (text: string) => createHmac('sha256', sessionSecret()).update(text).digest('base64url');
export function makeSession(id: string, now = Date.now()) {
  const expires = new Date(now + 30 * 86400000);
  const data = Buffer.from(JSON.stringify({ id, exp: expires.getTime() })).toString('base64url');
  return { token: `${data}.${sign(data)}`, expires };
}
export function verifySession(token: string | undefined, now = Date.now()): string {
  if (!token || token.length > 500) throw new ApiError('unauthorized', 'Start a secure session and retry.', 401);
  const [data, signature, extra] = token.split('.');
  if (!data || !signature || extra) throw new ApiError('unauthorized', 'Session is invalid. Reconnect and retry.', 401);
  const expected = Buffer.from(sign(data));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received))
    throw new ApiError('unauthorized', 'Session is invalid. Reconnect and retry.', 401);
  try {
    const session = tokenSchema.parse(JSON.parse(Buffer.from(data, 'base64url').toString()));
    if (session.exp <= now) throw new Error('expired');
    return session.id;
  } catch { throw new ApiError('unauthorized', 'Session expired. Reconnect and retry.', 401); }
}
export function verifyOrigin(request: Request) {
  const allowed = process.env.APP_ORIGIN ?? `${new URL(request.url).protocol}//${request.headers.get('host') ?? new URL(request.url).host}`;
  if (request.headers.get('origin') !== allowed || request.headers.get('sec-fetch-site') === 'cross-site')
    throw new ApiError('forbidden', 'This action must originate from this application.', 403);
}
export function anonymousBucket(request: Request, purpose: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  return createHmac('sha256', sessionSecret()).update(`${purpose}:${ip}`).digest('hex');
}
