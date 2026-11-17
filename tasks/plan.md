# Outline Studio implementation plan

The supplied brief is the acceptance specification. No existing SRS or applicable AGENTS.md was found. Preserve the clean starting tree's MIT license, team list and useful module boundaries. No commits, pushes or deployment are authorized.

1. Establish Next.js, strict tooling, shared schemas and architecture ADR. Verify dependency compatibility and schema tests.
2. Build server-rendered public routes, shared visual tokens, responsive hero and illustrative walkthrough. Verify build, metadata and layouts.
3. Add signed sessions, Neon migrations, bounded idempotent stages and feedback persistence. Verify authorization, CSRF, failures and limits with isolated tests; live Neon needs a connection string.
4. Add provider onboarding, encrypted local vault, streaming adapters and explicit fallback. Verify with synthetic providers, cancellation and exhausted budgets. No real quota stress tests.
5. Build XState workspace, acceptance gates, two-way independent work, review, local checkpoints and edits. Verify reload, stale responses and cancellation.
6. Connect templates, IR preview, safe diagrams, DOCX/PDF/PPTX exports and local deletion/export controls. Verify generated files and named viewers where available.
7. Run lint, strict types, tests, production build, accessibility, responsive and performance checks. Record factual results and unverified paths in docs/testing/implementation-report.md.

Design: printed annual direction, seed 760955009. The accepted outline becomes the common spine connecting real document layers. The live public interaction is an explicitly illustrative walkthrough. User palette, fine rules and original SVG illustration take precedence over skill defaults forbidding indigo/rules or demanding unrelated photography. Motion is limited to purposeful sequences per brief.

## Authorized completion continuation — 2026-11-17

The user's completion request supersedes the historical no-commit instruction above and is the current acceptance specification. Preserve the existing stack and working features. No push or deploy. Detailed evidence, dependencies and acceptance checks are tracked in docs/COMPLETION_CHECKLIST.md. Extend this existing plan rather than replacing unfinished historical records.

Implement sequential vertical slices: local project storage and safe migration; project library/autosave; snapshots/history/restore; safe project ZIP and retained files; export/template gaps; backend/provider/research guards; final security/performance/viewer verification and documentation. Commit verified milestones. Unavailable Context7/live credentials/isolated DB/viewers must be recorded, never treated as verified. Do not allow those external limits to block independent local work.

## Chat assistant expansion — 2026-11-17 (current)

User direction: make chat a general assignment-capable assistant (ChatGPT-like), add uploads for images, Markdown, PDF, DOCX and camera capture, with strong limits and honest disclosures.

Architecture decisions:
- Keep one same-origin Hono `/api/chat` route; attachments travel as bounded base64/text inside the strict chat schema, no new cloud storage.
- Extract Markdown/DOCX text in the browser (JSZip already present); extract PDF text on the server with `pdf-parse` (pinned); downscale images client-side before upload.
- Persist only attachment metadata/extracted text locally; never persist raw base64 in IndexedDB or ZIP.
- Images are passed as model image parts only when the user opts in; vision capability is model-dependent and disclosed.
- Assignment help is prompt-level (step-by-step, show working, format answers), not a new autonomous agent loop; exportable deliverables still use Create document.

Slices: (1) schema + extraction utilities; (2) server prompt/PDF/vision plumbing; (3) attachment picker + chat integration; (4) tests, docs, verification. Checkpoints after each slice: lint, typecheck, focused tests.
