# Playground lifecycle repair

The playground now uses the workspace's `useCheckpoint` initialization and autosave lifecycle and the shared `useChat` request lifecycle. A server page validates the project ID before opening the client screen. Checkpoint URL updates retain the active route, so refreshing a playground project stays on `/playground`.

The duplicate provider request loop was removed. Chat now shares cancellation, streaming, error handling, authorization checks, and sequential fallback behavior with `/workspace`. Stop cancels the active chat or document request. The playground exposes the existing provider setup dialog and local save status, including persistence errors.

Personal Assistant Mode omits current documentation settings and staged attachments from outgoing chat requests and disables the corresponding controls. Mermaid source generation once again escapes ampersands, quotes, and angle brackets in node and edge labels.

## Verification, November 19, 2026

- Lint, TypeScript, and the production build passed.
- Unit tests: 52 passed; 9 database integration tests remained skipped.
- Browser tests against the production build: all three new playground tests and four existing workspace chat tests passed. Provider responses are mocked; these checks do not verify live provider or hosted deployment behavior.
- The direct-load test failed on the original empty composer state before the initialization fix. The special-character test failed before restoring escaping. The assistant-mode test also failed when attachment filtering was deliberately inverted, then passed after restoration.
- The cancellation test reproduced the extra document-cancellation message before Stop was restricted to the active request.

No deployment was performed. Earlier deployment and handoff reports remain historical records.
