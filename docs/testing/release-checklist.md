# Release verification

Run lint/source rules, strict typecheck, unit/contract tests, production build, the complete Playwright suite, dependency audit, secret review and git diff --check. Source rules enforce fewer than 150 lines, no any and zero comments. Browser tests require a running localhost application. Prefer the production build for final evidence; development HMR is not production-runtime evidence.

The gated backend suite needs OUTLINE_TEST_CREDENTIALS_FILE pointing to a private JSON file for a dedicated nondefault/nonprimary Neon test branch. It validates branch name, selects dedicated test databases and resets only that owned test schema. It does not use the production DATABASE_URL. See tests/backend.integration.test.ts before running it. Treat credential files as secrets and do not commit them.

Use mocked providers for repeatable success, rate limits, invalid credentials, credit exhaustion, cancellation, late responses and retry. Do not use real quota for stress tests. A model-list call is not proof of inference. Open generated files in viewers and distinguish layout inspection from container parsing.

Verify widths 360, 390, 768, 1024, 1440 and 1920; keyboard/emulated touch, direct loads/navigation/refresh, reduced motion, restored scroll, dialog focus/scroll cleanup, provider/vault/feedback recovery, project history/ZIP integrity, all six outputs and worker failure recovery. Keep private routes noindex and out of the sitemap. Confirm operator/legal details and an actual retention schedule before publication.

Current measured evidence, exact exclusions and blockers are recorded in ../COMPLETION_REPORT.md. No blanket security or all-device claim follows from these checks.
