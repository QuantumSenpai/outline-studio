import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { databaseBudget } from '../budget';
import { ApiError } from '../errors';

export function database() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new ApiError('unavailable', 'Server database is not configured. Your local draft is safe; ask the operator to configure Neon.', 503);
  const budget = databaseBudget.getStore();
  const signal = budget ? AbortSignal.any([budget, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000);
  return drizzle(neon(url, { fetchOptions: { signal } }), { casing: 'snake_case' });
}
