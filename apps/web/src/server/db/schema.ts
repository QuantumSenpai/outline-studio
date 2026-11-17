import { pgTable, uuid, timestamp, text, integer, primaryKey, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const sessions = pgTable('guest_sessions', {
  id: uuid().primaryKey(), expires: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, t => [index('session_expiry_idx').on(t.expires)]);
export const runs = pgTable('runs', {
  id: uuid().primaryKey(), owner: uuid().notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  revision: integer().notNull(), createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, t => [index('runs_owner_updated_idx').on(t.owner, t.updatedAt, t.id), check('positive_revision', sql`${t.revision} > 0`)]);
export const stages = pgTable('stages', {
  requestId: uuid().primaryKey(), runId: uuid().notNull().references(() => runs.id, { onDelete: 'cascade' }),
  revision: integer().notNull(), stage: text().notNull(), attempt: integer().notNull(),
  fingerprint: text().notNull(), status: text().notNull(), provider: text().notNull(), model: text().notNull(),
  startedAt: timestamp({ withTimezone: true }).defaultNow().notNull(), endedAt: timestamp({ withTimezone: true }),
}, t => [uniqueIndex('stage_attempt_idx').on(t.runId, t.revision, t.stage, t.attempt),
  index('stage_run_status_idx').on(t.runId, t.status),
  check('bounded_attempt', sql`${t.attempt} BETWEEN 1 AND 3`),
  check('stage_status', sql`${t.status} IN ('running','completed','failed','cancelled')`),
  check('stage_name', sql`${t.stage} IN ('planner','writer','diagram','reviewer')`)]);
export const feedback = pgTable('feedback', {
  id: uuid().primaryKey(), owner: uuid().notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  category: text().notNull(), rating: integer(), message: text().notNull(), contact: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
}, t => [index('feedback_owner_date_idx').on(t.owner, t.createdAt, t.id), index('feedback_date_idx').on(t.createdAt),
  check('feedback_category', sql`${t.category} IN ('idea','problem','experience')`),
  check('feedback_rating', sql`${t.rating} BETWEEN 1 AND 5`),
  check('feedback_message_length', sql`length(${t.message}) BETWEEN 10 AND 4000`)]);
export const rateBuckets = pgTable('rate_buckets', {
  key: text().notNull(), window: integer().notNull(), count: integer().notNull().default(1),
}, t => [primaryKey({ columns: [t.key, t.window] }), index('bucket_window_idx').on(t.window)]);
