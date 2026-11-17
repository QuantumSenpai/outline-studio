import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
config({ path: '../../.env.local', quiet: true });
config({ path: '../../.env', quiet: true });
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required. Use the Neon pooled connection string.');
const sql = neon(url);
await sql`CREATE TABLE IF NOT EXISTS outline_migrations (id text PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
const id = '001_initial';
const migration = await readFile(new URL(`../migrations/${id}.sql`, import.meta.url), 'utf8');
const hash = createHash('sha256').update(migration).digest('hex');
const existing = await sql`SELECT hash FROM outline_migrations WHERE id=${id}`;
if (existing.length && existing[0].hash !== hash) throw new Error('Applied migration was changed. Add a new migration instead.');
if (!existing.length) {
  const statements = migration.split(';').map(s => s.trim()).filter(Boolean);
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(9185274)`,
    ...statements.map(statement => sql.query(statement, [])),
    sql`INSERT INTO outline_migrations(id,hash) VALUES (${id},${hash})`,
  ]);
  process.stdout.write('Applied 001_initial atomically.\n');
} else process.stdout.write('Database already migrated.\n');
