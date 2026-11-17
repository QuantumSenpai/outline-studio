# Local setup and migrations

Use Node 22+ and pnpm 10.28.2. Run `pnpm install --frozen-lockfile`, copy `.env.example` to `.env.local`, then `pnpm dev`. Never commit real environment files. Frontend and API share one Next.js app on http://127.0.0.1:3000. No separate worker, Render service or Cloudflare deployment is required.

Environment names: `DATABASE_URL` (Neon connection), optional `DATABASE_URL_UNPOOLED` (takes precedence for runtime and migrations), `SESSION_SECRET` (random 32+ characters), `APP_ORIGIN` (exact public origin), `NEXT_PUBLIC_SITE_URL` (canonical public URL). Database credentials are server-only. Provider keys come through the UI, never NEXT_PUBLIC variables.

## Database

Create an isolated Neon schema-only branch/database first, configure only its connection, then run `pnpm db:migrate`. SQL files in apps/web/migrations are applied in order. Each migration and its immutable SHA-256 journal entry run in one advisory-locked transaction. Repeating migrations is safe; changing an applied file is rejected. This is not Drizzle Kit's snapshot journal. Do not run `drizzle-kit push` against an existing database.

`pnpm db:generate descriptive_name` creates an empty numbered SQL scaffold. Fill reviewed transactional SQL and update src/server/db/schema.ts together, then test on an isolated branch. Empty files fail migration validation. Nontransactional operations such as CREATE INDEX CONCURRENTLY require a separately reviewed deployment procedure.

For an older unjournaled schema, inspect its exact DDL and reconcile it with migration 001 before recording any baseline. Do not drop existing tables or mark migrations applied blindly. Back up metadata first. Production migration/retention execution is operator work, not performed by the completion session.

`pnpm db:retention` removes expired sessions, 7-day run metadata, 30-day feedback and 2-day rate buckets from the configured DATABASE_URL. Schedule and monitor it using the deployment's existing secure operations workflow; no automatic job is implied. Session expiry/deletion may cascade feedback earlier.

## Production

One Vercel project uses Root Directory apps/web, apps/web/vercel.json and the pnpm workspace build. Set canonical URL and matching APP_ORIGIN to the actual HTTPS site. Configure Neon credentials and SESSION_SECRET server-side. The stage request budget is 45 seconds, below the 60-second function maximum, with short metadata operations. Verify actual account limits, migrations, ownership, cookies and live provider inference before release. The authorized deployment is recorded in ../DEPLOYMENT_REPORT.md. From the repository root, explicitly target `vercel deploy --prod --project outline-studio`; the nested apps/web link names a different project and should not be used accidentally.
