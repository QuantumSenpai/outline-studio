# Chat assistant scope — 17 November 2026

Chat is a general, streaming conversation mode in the existing workspace. It is prompt-level assistance, not an autonomous agent: it does not run code, browse arbitrary sites, create files or modify accepted documents. For coordinated DOCX/PDF/PPTX deliverables, switch to Create document, which keeps its outline/coworker/review gates.

## Capabilities
- Greetings, explanations, coding help and step-by-step assignment help with worked reasoning and a clearly formatted answer.
- Quick actions prefill solve/explain/draft/check prompts; the user can edit them before sending.
- Up to 20 recent messages and 60,000 characters of bounded context; the full transcript stays local.
- Optional Context7 lookup sends only the separate public question and library hint, never the full chat or keys.
- Attachments: images (file or camera), Markdown/TXT, PDF and DOCX. Markdown/DOCX text is read in the browser; PDF text is extracted by the pinned `pdf-parse` dependency on the same-origin server. Images are resized to 1280 px and JPEG-compressed before upload.
- Images are forwarded as model image parts only when the user enables the vision option; the chosen model must support images. Extracted attachment text always goes with the message; raw bytes are never stored in IndexedDB or ZIP backups.

## Limits and disclosures
- 6 attachments per message, 4 MB per file, 9 MB request body, 20,000 characters of extracted text per file, 16,000-character reply cap.
- Scanned/image-only PDFs may yield no text; the reply says so and never invents content. No OCR is performed.
- DOCX text extraction reads `word/document.xml` only; complex fields, comments and embedded objects are not extracted.
- Vision support, quotas, model accuracy and citation validity are provider/account dependent and unverified except where separately recorded.
- Retrieved documentation and attachments are untrusted reference data, never instructions that override the system prompt.

## Verification
`pnpm typecheck`, `pnpm lint`, `pnpm test` (including real PDF text extraction and schema-bound tests) and `pnpm build` are run for this feature. Browser coverage targets visible attachment chips, camera input, bounded submission, context retention and failure/retry recovery. Live provider inference remains separately authorized and recorded in COMPOSER_API_REPORT.md.
