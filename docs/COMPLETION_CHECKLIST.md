# Completion checklist

Scope: the 2026-11-17 completion request is the acceptance specification. ADR 005 controls deployment. Statuses reflect evidence, not filenames. Previous Chromium coverage is recorded in PROGRESS.md; new features require fresh acceptance checks.

| Feature | Current evidence | Missing work | Acceptance check | Status |
|---|---|---|---|---|
| Approved stack and architecture | Next/Hono/Vercel/Neon source; ADR 005 | Replace obsolete README/env/setup docs | One deployment; runnable setup | Partial |
| Public routes and hero | Previous 22-test production run; scoped GSAP | Recheck after implementation | Six widths, time samples, reduced motion | Implemented |
| Controls and dialogs | Focus, labels, pending and PNG regressions | Recheck shared changes | Keyboard, touch, recovery, no stale overlays | Implemented |
| Local project library | fc5428c; project CRUD browser flow passed | Six-width final checks | CRUD browser and storage tests | Implemented |
| Autosave and recovery | Project-aware save state, stale-save rejection and reload tested | Storage-failure/multi-tab final checks | Reload and failed-save tests | Implemented |
| Named snapshots and version history | Snapshot/compare/restore browser and storage tests passed | Final accessibility/responsive check | Restore creates a higher revision | Implemented |
| Per-version exports | Only current document export | Export historical accepted revision | Historical file content test | Not started |
| Complete project ZIP | Manifest/hash/path/expansion tests; actual file round trip passed | Final release coverage | Safe round trip; corrupt/oversized/path attacks | Implemented |
| Four distinct templates | Prompt instructions and preview variants | Verify export semantics and actual defaults | Unrelated topics across templates | Partial |
| Academic settings and logo | Zod fields and cover renderers | Validate exported fields/numbering/logo | Viewer inspection and artifacts | Implemented |
| Planner and accepted outline | XState; Zod schema; mock browser coverage | Negative prerequisites and stale identity tests | No downstream work before acceptance | Implemented |
| Writer/diagram concurrency | Limit 1/2; Promise.allSettled | Verify partial failure/checkpoints | Both scheduling limits and partial success | Implemented |
| Review and corrections | Advisory review; edits invalidate review | Explicit bounded correction journey | Missing criteria visible; edits preserved | Partial |
| Cancellation/retry/stale responses | Abort signals; run/revision comparison | Guard streamed partials and metadata changes | Late responses never overwrite new work | Partial |
| Browser-close recovery | Local resumeCheckpoint | Recheck project switches and interrupted state | Explicit retry; no background promise | Implemented |
| Provider onboarding/vault | Four allowlisted providers; encrypted vault | Current links/defaults/capability claims | Contract/error tests; no key leakage | Partial |
| Live provider generation | No live evidence from previous work | Authorized configured test credentials | One minimal live outline per tested adapter | Blocked |
| Explicit bounded fallback | Eligible connections, cooldowns, three attempts | Credential/credit and stale-eligibility coverage | No unauthorized switch or extra charge approval | Implemented |
| Hono API boundaries | Schemas, origin/session validation, body caps | Route contracts, request IDs, error consistency | Ownership/input/timeout integration tests | Partial |
| Neon persistence/migrations | Initial migration and metadata tables | Isolated DB tests and reproducibility evidence | Constraints, races, ownership, retention | Partial |
| Database isolation | Existing local config must not be exposed | Discover isolated test database/branch | No destructive tests on user data | Blocked |
| DOCX/PDF/PPTX | Actual downloads passed; basic renderer tests | Viewer layouts, long content, warnings/unsupported glyphs | Real viewers plus assertions | Partial |
| Markdown and bundle outputs | Revision Markdown and full ZIP wired; download test passed | Final content/release check | Content and MIME assertions | Implemented |
| Static SVG/PNG diagrams | Validated IR; sanitized Graphviz assets | Worker error/deadline handling | Black/white labels; injected input tests | Implemented |
| Research/source integrity | Read-only Crossref lookup | Verify metadata provenance/import handling | No invented source promoted to verified | Partial |
| Cookies and legal | Working preference storage; existing legal pages | Match new project retention and operator details | Reopen/change/reject; accurate disclosures | Partial |
| Feedback | Validated scoped storage; mock recovery | Isolated persistence/idempotency verification | Failed submission preserved; real DB test | Partial |
| Metadata/SEO/accessibility | Public metadata, sitemap, axe tests | New private routes, broken README anchor, coverage | No private sitemap/metadata content | Implemented |
| Performance | No recorded measurements | Bundles, CLS, responsiveness, API/DB timings | Reproducible lab record | Not started |
| Security/release checks | Existing unit guards, CSP, allowlisted destinations | Audit deps/secrets/uploads/authorization | Actual command output and triage | Partial |
| Completion documentation | Progress history exists; many docs empty | Report, setup, migrations, truthful limitations | Evidence-linked report and scoped commits | Partial |
| Context7 verification | No Context7 tool in this session | External tool availability | Official docs fallback recorded | Blocked |
| Deployment | Vercel config exists | Operator variables, isolated/live checks | Readiness only; no deployment authorized | Partial |

## Execution order

1. Preserve starting work; evidence audit and dependency/security foundations.
2. Add a backwards-compatible local project repository, autosave and identity guards.
3. Build project library and version preview/compare/restore UI.
4. Complete bounded ZIP/Markdown/retained-file round trips and historical exports.
5. Close backend, providers, research, template/export and worker defects with tests.
6. Reconcile documentation/legal/SEO, run production journeys and measured release checks.
7. Record external blockers exactly, review and commit coherent milestones without pushing/deploying.
