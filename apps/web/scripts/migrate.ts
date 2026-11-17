import { config } from 'dotenv';
import { applyMigrations } from '../src/server/db/migrate';
config({ path: '.env.local', quiet: true });
config({ path: '../../.env.local', quiet: true });
config({ path: '../../.env', quiet: true });
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required. Use an isolated branch to verify migrations first.');
try {
  const files = await applyMigrations(url);
  process.stdout.write(`Verified ${files.length} immutable migrations under a transaction-scoped lock.\n`);
} catch {
  process.stderr.write('Migration failed. Check connectivity, permissions and immutable migration hashes. Existing unversioned schemas require an explicit reviewed baseline; no credentials are logged.\n');
  process.exitCode = 1;
}
