# Completion checklist

Updated 17 November 2026. Scope is the current completion request and the simple workspace/version-preservation direction. Verified means the stated acceptance scope was actually tested; it is not a blanket release certification. See COMPLETION_REPORT.md for commands, environment and exclusions.

| Feature | Current evidence | Missing work | Acceptance check | Status |
|---|---|---|---|---|
| Approved architecture | Next/Hono adapter, ADR 005; production build passes | External Vercel project-setting verification | Single app; no added service | Implemented |
| Home/hero/strip | Responsive, temporal GSAP and pause/reduced-motion browser tests | Physical-device/cross-browser expansion | Six widths, contained cards, controls visible | Verified |
| Public routes/navigation | Direct/internal route, cookie and axe tests | Broader assistive-device coverage | All public main headings/actions available | Verified |
| Shared controls/dialogs | Visible labels, focus/scroll cleanup and recovery tests | No exhaustive third-party browser claim | Keyboard/touch pending/error/success | Verified |
| Provider wizard | Reserved-prop/type/lifecycle repairs; schema-valid requests | Live generation separate | Key input, close/reopen, six-width accessibility | Verified |
| Local projects | CRUD/search/duplicate/rename browser and storage tests | Exhaustive storage-quota/multi-tab tests | Reload and scoped deletion preserve other projects | Verified |
| Autosave/checkpoint migration | v1→v2 migration preserves vault; stale save tests | Private mode/low-storage physical testing | Saved/failed state; compatible reload | Verified |
| Named snapshots/compare/restore | Unit/browser restore and comparison tests | Broader large-history usability | Restore higher revision, keep newer history | Verified |
| Historical downloads | Browser byte-for-byte retained comparison and historical Markdown regeneration passed | Full historical Office fidelity in real viewer | Exact retained bytes, regenerate correct snapshot | Verified |
| Complete ZIP backup/import | Hashes/schema/path/bomb guards; actual six-file round trip | Exhaustive archive fuzzer coverage | Corrupt/oversized imports preserve originals | Verified |
| Four templates | Defaults, prompt instructions, label/numbering tests; unrelated artifacts | Full Office pagination verification | Template selection configures actual export | Implemented |
| Academic metadata/logo | Bounded signature/dimension schema; cover output | Broader logo aspect ratios/viewers | No invented institutional approval; safe image | Implemented |
| Planner/accepted outline | Mock browser journey and schema contracts | Live per-model output checks | No writer/diagram before approval | Verified |
| Coworker orchestration | Concurrency 1/2; database atomic lease integration | Live provider timing variability | Partial failures honest, dependencies respected | Verified |
| Review/corrections | Every accepted criterion normalized; edits invalidate review | Model factual accuracy requires user judgement | Manual corrections; bounded retries; no hidden reasoning | Verified |
| Cancellation/retry/stale responses | Identity guards and edit/late-response regressions | All browser-close network outcomes | Late output cannot replace newer edits | Verified |
| Reload recovery | Browser reload/offline/explicit resume coverage | Durable browser-closed work outside scope | No background-completion promise | Verified |
| Provider adapters | Four allowlisted mocked list/SSE contracts | Live inference authorization/accounts | Do not equate list access to generation | Implemented |
| Vault | Encryption/wrong passphrase/lock race/browser recovery | Physical browser compromise outside guarantees | Failed unlock preserves encrypted records | Verified |
| Bounded fallback | Eligibility/cooldown/error contracts and exhaustion browser test | Live quota/account conditions | Only enabled authorized connections, at most 3 attempts | Verified |
| Live AI generation | No live inference by this agent | Explicit minimal provider/account tests | Record actual model/date/output/cost | Blocked |
| API boundaries | 8 real isolated DB/Hono tests; caps/deadlines/error IDs | Production runtime/config checks | Ownership/origin/replay/timeout safety | Verified |
| Neon migrations/persistence | Isolated branch; concurrent immutable journal tests; CLI replay0 | Production baseline and retention operations | No production data reset; constraints/indexes | Verified |
| DOCX/PDF/PPTX | Real downloads and 12 synthetic files; PDF pages/Quick Look previews | Full Word/PowerPoint pagination/slides | No content silently omitted; disclosed limitations | Partial |
| Markdown/SVG/PNG | Actual download, UTF8/asset/schema validations | Expanded visual diagram fixtures | Static B/W labelled diagrams, safe MIME/name | Verified |
| Worker failure/recovery | Injected bootstrap error then successful six-format retry | Broader browser worker failures | Readable error; bounded deadline; cleanup | Verified |
| Research/source integrity | Crossref metadata path; DOI validation; imported verification reset | Claim-level research is not implemented/certified | Unresolved citations never treated as verified support | Implemented |
| Cookies/feedback | Reject/reopen/preferences; retry preservation; isolated persistence | Production policy/hosting review | No trackers installed, failed input retained | Verified |
| Privacy/Terms/licenses | Updated storage/font disclosures; third-party notices | Operator identity/contact/applicable terms | Match actual architecture and retention | Partial |
| SEO/private metadata | Canonical/public axe; private noindex/sitemap assertions | Actual production canonical origin | Private workspace/projects/history excluded | Verified |
| 404/error boundary | 404 return path tests; error component inspected | Injected production error-boundary recovery | Usable return/retry, no private metadata | Implemented |
| Responsive/accessibility | Chromium six widths, keyboard/emulated touch, reduced-motion axe | Safari/Firefox/screen-reader/physical devices | No page overflow or blocked core controls | Verified |
| Performance | Local bundle/CLS/dialog/API and isolated DB probes | Vercel cold starts, field metrics, provider latency | Method/environment/limits documented | Implemented |
| Security checks | Audit0, tracked secret patterns, authorization/import regressions | External penetration/production review | No key leakage claim beyond tested scope | Verified |
| Setup/report/handoff | README/env/setup reconciled; report and exact handoff | Operator release prerequisites | Evidence distinguishes mocked/live/blocked | Implemented |
| Context7 | Tool unavailable; official docs fallback used | Tool connection if specifically required | Do not claim Context7 execution | Blocked |
| Deployment readiness | Local optimized build and isolated DB pass; other-agent config preserved | Dashboard root/env/live/retention verification | No push/deploy by this agent | Partial |

## Subsequent deployment evidence

User authorized Vercel deployment after completion. Production release and domain are now verified for the hosted smoke scope in DEPLOYMENT_REPORT.md. The full local test suite, live AI inference, legal/operator completion and operational monitoring remain distinct; deployment does not mark those untested paths verified.
