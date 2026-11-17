# Composer send fix and authorized Groq test

Date: 17 November 2026. Scope: the reported inability to send “Hii” and one real test using the user-supplied Groq credential.

## Confirmed root cause

The composer was implemented as an outline-only form. Its button was labelled Create an outline and disabled whenever trimmed input had fewer than 10 characters. The planner/server also require a brief of at least 10 characters. There was no short-message intake or explanation, and Enter inserted a newline rather than sending. The screenshot's “Hii can” was eight characters, so the disabled action was deterministic; it was not caused by a failed Groq request.

An empty conversation could also show Latest messages merely because the introductory suggestions overflowed the transcript. This misleading control is now hidden until actual messages exist.

## Fix

- A visible Send message action accepts nonempty input. Empty/whitespace input stays disabled.
- Enter sends; Shift+Enter inserts a newline; IME composition does not submit mid-composition.
- Greetings and underspecified short input receive deterministic document-intake guidance without a provider request or quota use. This is local onboarding, not a claimed general-purpose AI-chat response.
- Detailed document requests continue into the existing provider/outline approval workflow. The server's minimum-brief validation remains intact.
- Initial intake messages survive the first outline request. Existing accepted drafts/new requests retain the existing archive behaviour. Near the bounded conversation limit, history is snapshotted before a fresh detailed request.
- The large empty-state introduction is replaced by the actual conversation after sending, keeping the composer and response clear. Existing document, version-history and provider controls remain intact.

## Real API test

Used the supplied credential through the existing UI on https://outline-flow.vercel.app, selected Groq openai/gpt-oss-20b, and made one short rainwater-harvesting assignment with two sections and a three-node diagram. The credential was not embedded in source/tests, output, screenshots or this report. No real key was printed.

Observed successful model-list validation, accepted planner outline, writer output, diagram output and advisory review. All relevant application API responses were HTTP 200; each stage's validated output was confirmed through the actual UI, not inferred solely from status codes. One actual DOCX downloaded successfully. Its Quick Look thumbnail was rendered and inspected; full Word pagination is not certified. Browser page-error collection was empty. The fresh test session's server metadata was deleted using only its own cookie; cleanup returned 200. No production schemas/user records were reset.

Artifact: ignored qa-output/live-groq-rainwater.docx. Safe test outcome metadata is outside the repository. One workflow consumed real provider usage; no repeated live load/failure testing was done. No Groq adapter defect was reproduced. This verifies that account/model and brief at the test time, not every model/provider/quota condition or factual accuracy.

Current Groq streaming/authentication documentation was checked through Context7 (/websites/console_groq), including https://console.groq.com/docs/reasoning and https://console.groq.com/docs/text-chat. No credential or proprietary content was sent to documentation search.

## Regression evidence

- Reproduced the missing/disabled short-message send behaviour with a failing browser test before changing the implementation.
- pnpm test: 41 passed; 8 isolated-database tests remain intentionally gated in the ordinary run. The backend API implementation was not changed by this fix.
- pnpm lint and source rules, strict pnpm typecheck and optimized pnpm build passed.
- Full local production Chromium suite: 28 passed in 55.0 seconds, including short input without provider calls, Enter/Shift+Enter, first-outline conversation preservation and existing generation/export/version/ZIP/fallback/recovery journeys.
- Additional greeting screenshots at 390/1440 px inspected; no horizontal page overflow and Send message remained visible.
- git diff --check and task-file credential review are performed before commit. Only task files are staged; unrelated ignore-file changes remain untouched.

## Limits and credential hygiene

The local greeting helper asks for a useful document brief; arbitrary ongoing AI-chat editing is not introduced. Live NVIDIA/Gemini/OpenRouter generation remains unverified. The supplied key was shared in chat and should be rotated by its owner after testing; it is not repeated here. Provider charges/quota and generated factual correctness remain the user's responsibility.

## Deployment

Source commit 6461b38 is deployed and promoted on https://outline-flow.vercel.app/workspace as dpl_5s2XgAFHFX24WhgFMW5xVW2gUTE7. Immutable URL: https://outline-studio-nd72tl863-quantumsenpais-projects.vercel.app. Vercel build and health checks passed. Public Chromium checks at 390 and 1440 px passed greeting Enter-to-send, short-message button submission, Shift+Enter, empty composer recovery, no page overflow and no runtime errors. These hosted greeting checks made zero provider validation/generation requests. The actual live Groq workflow above was performed once before this frontend-only patch; provider/backend adapters were unchanged. No Git push was performed.
