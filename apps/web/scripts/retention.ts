import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
config({ path: '../../.env.local', quiet: true });
config({ path: '../../.env', quiet: true });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const sql = neon(process.env.DATABASE_URL);
await sql.transaction([
  sql`DELETE FROM feedback WHERE created_at < now()-interval '30 days'`,
  sql`DELETE FROM runs WHERE updated_at < now()-interval '7 days'`,
  sql`DELETE FROM guest_sessions WHERE expires < now()`,
  sql`DELETE FROM rate_buckets WHERE "window" < extract(epoch from now()-interval '2 days')`,
]);
process.stdout.write('Expired feedback, run metadata, sessions and rate buckets deleted.\n');
