import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { ApiError } from '../errors';

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new ApiError('unavailable', 'Server database is not configured. Your local draft is safe; ask the operator to configure Neon.', 503);
  return drizzle(neon(url, { fetchOptions: { signal: AbortSignal.timeout(8000) } }), { casing: 'snake_case' });
}
