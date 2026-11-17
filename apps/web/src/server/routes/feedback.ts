import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { feedbackSchema } from '@outline-studio/schemas';
import { database } from '../db/client';
import { feedback } from '../db/schema';
import { owner, readBody } from '../http';
import { limit } from '../db/limits';
import { anonymousBucket } from '../security';
import { ApiError } from '../errors';

export const feedbackRoutes = new Hono();
feedbackRoutes.post('/feedback', async c => {
  const id = await owner(c);
  const data = await readBody(c.req.raw, feedbackSchema, 18000);
  const [existing] = await database().select({ id: feedback.id }).from(feedback)
    .where(and(eq(feedback.id, data.submissionId), eq(feedback.owner, id))).limit(1);
  if (existing) return c.json({ saved: true, id: existing.id });
  await limit(`feedback:${id}`, 5);
  await limit(anonymousBucket(c.req.raw, 'feedback'), 15);
  const saved = await database().insert(feedback).values({ id: data.submissionId, owner: id,
    category: data.category, rating: data.rating, message: data.message, contact: data.contact || null })
    .onConflictDoNothing().returning({ id: feedback.id });
  if (!saved.length) {
    const [replayed] = await database().select({ id: feedback.id }).from(feedback).where(and(eq(feedback.id, data.submissionId), eq(feedback.owner, id))).limit(1);
    if (replayed) return c.json({ saved: true, id: replayed.id });
    throw new ApiError('conflict', 'Submission identifier already exists. Reload the form to create a new submission.', 409);
  }
  return c.json({ saved: true, id: saved[0].id }, 201);
});
