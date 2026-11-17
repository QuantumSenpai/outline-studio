# ADR 005: One Next.js deployment, bounded stages and Neon

Accepted: 2026-11-17. Supersedes ADR 001 and 003 deployment decisions.

Use Next.js App Router for server-rendered public pages, reliable per-route metadata and same-origin Hono APIs in one Vercel project. This replaces the earlier Vite/router and Cloudflare proxy proposal. There is no second proxy deployment.

Use Vercel Node.js Functions with an explicit 60-second maximum and a shorter 45-second upstream deadline. Each model stage is a separate bounded request. XState in the open browser coordinates accepted prerequisites and at most two independent tasks. IndexedDB stores full drafts and compatible checkpoints. Closing the browser stops scheduling; unfinished requests may need explicit retry. There is no durable background-worker claim.

Neon Postgres stores only signed-guest ownership, run/stage identifiers, idempotency leases, rate limits and feedback. Drizzle uses Neon's HTTP driver for short queries and atomic noninteractive batches. No prompts, transcripts, provider keys or binary documents are stored there. Private reads and writes require server-verified sessions, and mutations require a matching Origin.

Provider keys arrive from the UI and transit only the same-origin endpoint and selected allowlisted provider. Optional local persistence uses PBKDF2 and AES-GCM. Browser renderers consume one validated Document IR. Heavy renderers and diagram engines are dynamically imported.

Consequences: no cross-device synchronization, background completion or accounts. A lost streaming response may have consumed provider quota; the server records an uncertain outcome and requires explicit retry with a fresh attempt. Metadata never replays private model output. DB availability is required for real generation and feedback; public pages and local review remain available without it.
