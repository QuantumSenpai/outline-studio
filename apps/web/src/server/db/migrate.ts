import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export async function applyMigration(sql: NeonQueryFunction<false, false>, id: string, migration: string) {
  if (!/^\d{3,4}_[a-z0-9_]+$/.test(id) || !migration.trim() || migration.length > 1000000 || migration.includes('$outline_migrate$')) throw new Error('Unsupported migration identifier or SQL file.');
  const hash = createHash('sha256').update(migration).digest('hex');
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(9185274)`,
    sql`CREATE TABLE IF NOT EXISTS outline_migrations (id text PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`,
    sql.query(`DO $outline_migrate$ BEGIN
      IF EXISTS (SELECT 1 FROM outline_migrations WHERE id='${id}') THEN
        IF NOT EXISTS (SELECT 1 FROM outline_migrations WHERE id='${id}' AND hash='${hash}') THEN
          RAISE EXCEPTION 'Applied migration changed; add a new migration instead';
        END IF;
      ELSE
        ${migration}
        INSERT INTO outline_migrations(id,hash) VALUES ('${id}','${hash}');
      END IF;
    END; $outline_migrate$`, []),
  ]);
}
export async function applyMigrations(url: string) {
  const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(30000) } });
  const directory = new URL('../../../migrations/', import.meta.url);
  const files = (await readdir(directory)).filter(file => /^\d{3,4}_[a-z0-9_]+\.sql$/.test(file)).sort();
  if (files.length > 100) throw new Error('Review migration history before applying more than 100 files.');
  for (const file of files) await applyMigration(sql, file.replace(/\.sql$/, ''), await readFile(new URL(file, directory), 'utf8'));
  return files;
}
