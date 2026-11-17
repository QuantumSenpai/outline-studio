# Outline Studio

**Every format. One flow.** Local-first document orchestration with your own provider account.

## Project status

Implemented application, with release limitations documented in [completion report](docs/COMPLETION_REPORT.md) and [acceptance checklist](docs/COMPLETION_CHECKLIST.md). Live provider inference and public deployment are not verified. Free software does not mean free model usage.

## Chat assistant

Open Workspace for a streaming, ChatGPT-style conversation with your selected provider. A compact model selector in the composer lets you switch between the models your provider returned. Chat keeps the full transcript locally and sends a bounded recent context. It handles greetings, explanations, coding and step-by-step assignment help. Quick actions can prefill a solving, explanation, drafting or checking prompt. Switch to Create document for accepted outlines, coworkers and coordinated exports; chatting does not overwrite accepted documents.

Attach up to 6 files per message (4 MB each): images, Markdown/TXT, PDF and DOCX. Use Camera for a phone/photo capture. Markdown and DOCX text is read in your browser, PDF text on our same-origin server, and images are resized before upload. Attached text is sent with your message; images are only sent to the model when you enable the vision option and the chosen model supports images. Only file names and extracted text are saved locally; raw file bytes are never stored in IndexedDB or project backups.

Enable Context7 documentation when asking about software. Enter a separate public docs question/library hint; only those fields go to Context7. Retrieved source links stay with the reply. Anonymous lookup worked in verification but has low limits; optional server-only CONTEXT7_API_KEY enables the operator's account limits. Lookup failure is disclosed and ordinary chat remains available. Retrieved documentation is untrusted reference data, not proof of claim correctness.

## The workflow

Create/open a local project → select one of four templates → connect a provider → enter a brief → approve an outline → run writer/diagram tasks → review/edit → export → snapshot/restore.

Academic assignment, professional report, research-paper draft and question-paper solutions configure real workspace defaults and generation instructions. They do not certify institutional compliance. DOCX, PDF, PPTX, Markdown, SVG, PNG and complete project ZIP outputs are implemented. Slides summarize content, with full section text in speaker notes; equations remain labelled literal TeX in files. PDF tables use labelled rows. Inspect exported files before submission.

Projects, transcripts, checkpoints, snapshots and retained files live in IndexedDB. Restore creates a new revision, preserving history. ZIP import validates schemas, paths, hashes and expansion limits and creates a separate project. It excludes keys and vault secrets. Retained files preserve original bytes; other historical exports are regenerated using the installed renderer.

## Architecture

Next.js App Router/React, strict TypeScript, Tailwind v4, Radix/shadcn-style controls, Lucide, GSAP/ScrollTrigger, XState, Zustand and Zod. Same-origin Hono APIs use the supported Next.js integration in **one Vercel deployment**. Neon/Drizzle store signed guest ownership, bounded stage metadata, rate limits and feedback; full documents and keys stay out of the database. Dexie handles local persistence, WebCrypto the optional encrypted key vault. Heavy browser rendering engines load on demand.

[ADR 005](docs/adr/005-next-vercel-neon.md) supersedes historical Vite/Cloudflare deployment proposals. The open browser coordinates short checkpointed stages, with concurrency 1 or 2. Closing it interrupts work; there is no durable background completion or cloud document synchronization.

## Development

Node 22+ and pnpm 10.28.2 are required.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open http://127.0.0.1:3000. Public pages and local review work without Neon; real generation, provider validation and feedback need server configuration. See [setup](docs/setup/development.md), [provider guidance](docs/setup/providers.md) and [release checks](docs/testing/release-checklist.md).

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
pnpm test:e2e
```

Browser tests require Playwright Chromium installed and a running app on port 3000. Unit runs skip the explicit isolated-database suite unless its credential-file variable is supplied. Never point destructive integration tests at production. See the report for actual tested environment and commands.

## BYOK and privacy

Advertised adapters: NVIDIA, Groq, Gemini and OpenRouter. Enter keys in the existing provider dialog; authorize each model's possible costs. Model-list validation proves access to that list, not generation compatibility. Session memory is the default. Optional encrypted persistence uses PBKDF2/AES-GCM; the passphrase cannot be recovered. Fallback is opt-in, bounded and restricted to configured authorized candidates.

Keys and relevant input transit the same-origin API to the selected allowlisted provider. Local storage is not a claim that inference runs on-device. No optional analytics/tracking is installed. Feedback contains only submitted fields. See the application's Privacy and Terms pages. Operator identity/contact details and a monitored retention schedule are required before publication.

## Team

| Member | Roll number |
|---|---|
| Krishnendu Adak | UG/SOET/30/24/343 |
| Krishnendu Das | UG/SOET/30/24/448 |
| Md Danish Raza | UG/SOET/30/24/369 |
| Sneha Das | UG/SOET/30/24/467 |
| Shreankita Das | UG/SOET/30/24/436 |
| Shruti Nayak | UG/SOET/30/24/423 |
| Rudra Bharti | UG/SOET/30/24/462 |
| Aniket Shaw | UG/SOET/30/24/409 |

## License

[MIT License](LICENSE). The existing copyright and license terms are unchanged.
