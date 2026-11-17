import { sql } from 'drizzle-orm';
import { database } from './client';
import { rateBuckets } from './schema';
import { ApiError } from '../errors';

export async function limit(key: string, maximum: number, seconds = 3600) {
  const window = Math.floor(Date.now() / (seconds * 1000)) * seconds;
  const result = await database().insert(rateBuckets).values({ key, window, count: 1 }).onConflictDoUpdate({
    target: [rateBuckets.key, rateBuckets.window], set: { count: sql`${rateBuckets.count} + 1` },
    setWhere: sql`${rateBuckets.count} < ${maximum}`,
  }).returning({ count: rateBuckets.count });
  if (!result.length) throw new ApiError('rate_limit', 'Request limit reached. Wait before trying again.', 429, seconds - Math.floor(Date.now() / 1000) % seconds);
}
