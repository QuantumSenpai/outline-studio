import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { eq, and, desc, sql } from 'drizzle-orm';
import { database } from '../db/client';
import { sessions, runs, feedback } from '../db/schema';
import { anonymousBucket, cookieName, makeSession, verifySession } from '../security';
import { owner } from '../http';
import { decodeCursor, encodeCursor } from '../cursor';
import { limit } from '../db/limits';

export const sessionRoutes = new Hono();
sessionRoutes.post('/session', async c => {
  let existing: string | undefined;
  try { existing = verifySession(getCookie(c, cookieName)); } catch { existing = undefined; }
  if (existing) {
    const [row] = await database().select({ id: sessions.id }).from(sessions).where(eq(sessions.id, existing)).limit(1);
    if (row) return c.json({ connected: true });
  }
  await limit(anonymousBucket(c.req.raw, 'session'), 30);
  const id = crypto.randomUUID();
  const { token, expires } = makeSession(id);
  await database().insert(sessions).values({ id, expires });
  setCookie(c, cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', path: '/', maxAge: 2592000 });
  return c.json({ connected: true });
});
sessionRoutes.get('/session', async c => { await owner(c); return c.json({ connected: true }); });
sessionRoutes.get('/runs', async c => {
  const id = await owner(c);
  const cursor = decodeCursor(c.req.query('before'));
  const items = await database().select({ id: runs.id, revision: runs.revision, updatedAt: runs.updatedAt }).from(runs)
    .where(and(eq(runs.owner, id), cursor.id ? sql`(${runs.updatedAt},${runs.id}) < (${cursor.at}::timestamptz,${cursor.id}::uuid)` : sql`${runs.updatedAt} < ${cursor.at}::timestamptz`)).orderBy(desc(runs.updatedAt), desc(runs.id)).limit(20);
  return c.json({ items, next: items.length === 20 ? encodeCursor(items[items.length - 1].updatedAt, items[items.length - 1].id) : null });
});
sessionRoutes.get('/data', async c => {
  const id = await owner(c);
  const cursor = decodeCursor(c.req.query('before'));
  const records = await database().select().from(feedback).where(and(eq(feedback.owner, id),
    cursor.id ? sql`(${feedback.createdAt},${feedback.id}) < (${cursor.at}::timestamptz,${cursor.id}::uuid)` : sql`${feedback.createdAt} < ${cursor.at}::timestamptz`))
    .orderBy(desc(feedback.createdAt), desc(feedback.id)).limit(500);
  return c.json({ next: records.length === 500 ? encodeCursor(records[records.length - 1].createdAt, records[records.length - 1].id) : null, feedback: records.map(({ owner: ignored, ...record }) => ({ ...record, owner: ignored ? 'this session' : '' })), note: 'Full drafts and transcripts are local. Run metadata is available in /api/runs with pagination.' });
});
sessionRoutes.delete('/data', async c => {
  const id = await owner(c);
  await database().delete(sessions).where(eq(sessions.id, id));
  deleteCookie(c, cookieName, { path: '/' });
  return c.json({ deleted: true });
});
