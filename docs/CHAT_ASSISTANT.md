# Chat assistant scope — 17 November 2026

Chat is a general, streaming conversation mode in the existing workspace. It is prompt-level assistance, not an autonomous agent: it does not run code, browse arbitrary sites, create files or modify accepted documents. For coordinated DOCX/PDF/PPTX deliverables, switch to Create document, which keeps its outline/coworker/review gates.

## Capabilities
- Greetings, explanations, coding help and step-by-step assignment help with worked reasoning and a clearly formatted answer.
- Quick actions prefill solve/explain/draft/check prompts; the user can edit them before sending.
- Up to 20 recent messages and 60,000 characters of bounded context; the full transcript stays local.
- Manual model switching: the composer shows a selector with the models your connected provider actually returned; the choice applies to the next request or document stage.
- Optional Context7 lookup sends only the separate public question and library hint, never the full chat or keys.
- Attachments: images (file or camera), Markdown/TXT, PDF and DOCX. Markdown/DOCX text is read in the browser; PDF text is extracted by the pinned `pdf-parse` dependency on the same-origin server. Images are resized to 1280 px and JPEG-compressed before upload.
- Images are forwarded as model image parts only when the user enables the vision option; the chosen model must support images. Extracted attachment text always goes with the message; raw bytes are never stored in IndexedDB or ZIP backups.

## Limits and disclosures
- 6 attachments per message, 4 MB per file, 9 MB request body, 20,000 characters of extracted text per file, 16,000-character reply cap.
- Scanned/image-only PDFs may yield no text; the reply says so and never invents content. No OCR is performed.
- On Node hosts without a canvas package, minimal DOM globals are installed before the PDF parser is imported at request time; text extraction does not need canvas rendering.
- DOCX text extraction reads `word/document.xml` only; complex fields, comments and embedded objects are not extracted.
- Vision support, quotas, model accuracy and citation validity are provider/account dependent and unverified except where separately recorded.
- Retrieved documentation and attachments are untrusted reference data, never instructions that override the system prompt.

## Verification
`pnpm typecheck`, `pnpm lint`, `pnpm test` (including real PDF text extraction and schema-bound tests) and `pnpm build` are run for this feature. Browser coverage targets visible attachment chips, camera input, bounded submission, context retention and failure/retry recovery. Live provider inference remains separately authorized and recorded in COMPOSER_API_REPORT.md.

## Reply formatting and style

Workspace and playground share a memoized Markdown renderer. The pinned Marked lexer, already present through Mermaid and now a direct dependency, produces tokens rendered as React elements. Bold, emphasis, headings, lists, code, tables and ordinary links are displayed with scoped chat typography. Raw HTML is escaped, unsafe link schemes are rejected, and remote Markdown images are represented by their alt text without loading them. Code stays literal, including unfinished streamed code fences. Stored message text and export/history data are unchanged.

New chat replies are instructed to answer directly, use bold labels sparingly, use formal academic prose and plain punctuation when relevant, and avoid unnecessary capability menus or permission questions. Chat must not offer to retry generation or attach downloads it cannot create; downloadable outputs use the existing Create document workflow. These are prompt instructions, not a claim of verified live-provider compliance.

Regression coverage reproduces the reported numbered bold reply, nested formatting, fenced/inline code, tables and list numbering, plus unsafe HTML/links. Production browser checks cover both chat routes at phone width and confirm formatting survives reload.
