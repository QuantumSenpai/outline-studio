# Vercel deployment — 17 November 2026

This deployment was explicitly authorized after the completion report. It supersedes earlier statements that this agent had not deployed. No Git push was performed.

## Live release

- Primary/canonical address: https://outline-flow.vercel.app
- Existing project: outline-studio, confirmed Root Directory apps/web, Next.js, Node 26.x.
- Deployment: dpl_5bVa6if91BRpUNjKLiyj1ws9abMh
- Immutable deployment URL: https://outline-studio-h3rkn2t7b-quantumsenpais-projects.vercel.app
- Deployed source commit: cfb32d0, including provider/workspace fixes dad3b60 and completion evidence fdf01b3.
- Vercel build in iad1 completed successfully; Next compiled, strict TypeScript and all 16 static-generation steps passed. Build log reported 54 seconds. pnpm reported ignored esbuild install scripts; the actual build succeeded.
- Built using vercel deploy --prod --skip-domain --yes --project outline-studio, health checked, then promoted using vercel promote.

## Deployment fixes and domains

CLI inspection confirmed apps/web as the actual Vercel Root Directory. Moved vercel.json there to fix the CLI's root-location warning. Added .vercelignore after dry-run inspection found QA output in the upload inventory. Final upload: 254 files, 3,736,320 bytes; no env files, local Neon settings, QA artifacts, agent configuration, dependencies or local build directories in the checked inventory.

outline-studio.vercel.app was unavailable. Assigned outline-flow.vercel.app to the existing project, set production APP_ORIGIN and NEXT_PUBLIC_SITE_URL to https://outline-flow.vercel.app and verified canonical metadata.

The previous outlinestudio.vercel.app address remains attached without a forced redirect so existing browser-local projects can still be opened/exported. A temporary redirect was removed after considering origin-bound IndexedDB. Use the new domain for provider/server operations. Existing local drafts and vault data do not automatically transfer between origins: export a project ZIP on the previous origin and import it on the new site. No user's local data was read or migrated by this session.

## Actual hosted checks

Public Chromium smoke tests at 390 and 1440 px returned HTTP 200 for home, providers, templates, projects, history and workspace. Checked visible main headings, page bounds, provider dialog steps, Escape close and canonical workspace metadata. No page runtime errors were collected.

Public /api/health returned status ok with database/session configured. Created a fresh temporary guest session on the new domain; verified Secure/HttpOnly session cookie and successful ownership-scoped /api/runs access. Deleted only that fresh test session using its own cookie; cleanup returned 200. Production user records were not reset or migrated. The legacy /workspace export route was also checked for HTTP 200.

Earlier local release evidence remains: 38 unit/contract tests, 8 isolated Neon integration tests, 27 production-local browser tests, lint/typecheck/build/frozen install/dependency audit and whitespace checks. The complete browser suite was not rerun against production; hosted checks above are the actual tested subset. No real provider inference or quota test was performed.

## Operations and rollback

Vercel currently reports this release Ready and promoted. Previous production URL observed before deployment: https://outline-studio-g20z35k1t-quantumsenpais-projects.vercel.app. A rollback requires inspecting that deployment's actual state and restoring its matching origin/domain settings before promotion; blindly promoting an older build with different APP_ORIGIN can break mutations. No rollback or automatic-monitoring guarantee is claimed.

Operator/legal details, monitored retention scheduling, full Office fidelity, live provider inference and broader devices/browsers remain as documented in COMPLETION_REPORT.md. Keep production migrations separate and reviewed; this deployment did not change/reset production schemas. Secrets remain server-only and were not printed.
