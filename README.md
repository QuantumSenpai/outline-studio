<div align="center">

<img src="docs/assets/banner.gif" alt="Outline Studio. Every format. One flow. Animated paths connect a brief to PPTX, DOCX, PDF and diagrams." width="100%">

# Outline Studio

### Every format. One flow.

Free, local-first AI assignment orchestrator.<br>
Turns a brief or rubric into PPTX, DOCX, PDF and diagrams. Bring your own API key.

**[Overview](#overview)** · **[Architecture](#architecture)** · **[Roadmap](#roadmap)** · **[Team](#team)**

</div>

---

## Overview

Outline Studio is being built to turn an assignment brief into a coordinated set of documents. The planned workflow starts with the requirements, creates an outline, writes structured content and exports it into the formats you need.

**Status: pre-implementation.** This repository currently contains the project license and documentation. The capabilities below describe the intended product; working exports and provider integrations are not available yet.

| Start with | Build towards |
| :--- | :--- |
| A topic, brief or assignment question | A structured document with headings, paragraphs and tables |
| A rubric or college format | Content checked against the assignment requirements |
| One shared content model | PPTX, DOCX, PDF and diagrams from the same workflow |
| Your own provider key | Provider choice without a shared project API key |

## The workflow

1. **Define** the brief, audience, length and required format.
2. **Plan** an outline around the assignment requirements.
3. **Write** content into a validated document model.
4. **Review** the draft and revise it before export.
5. **Export** through format-specific renderers.

Phase 1 focuses on a single agent chain and DOCX/PDF exports. Rubric extraction, automated review, verified references and additional formats belong to later phases.

## Architecture

The planned architecture is browser-first: a React PWA coordinates generation, keeps local history and runs document exporters. A small stateless proxy forwards requests to supported cloud providers.

| Layer | Responsibility | Planned technology |
| :--- | :--- | :--- |
| Interface | Brief input, provider settings and document review | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui |
| Orchestration | Typed steps, cancellation, retries and checkpoints | XState, Zustand, Zod |
| Local storage | History, document data and optional encrypted keys | Dexie, IndexedDB, WebCrypto |
| Provider access | Provider adapters and request forwarding | Cloudflare Workers, Hono |
| Document model | Shared validated JSON intermediate representation | TypeScript, Zod |
| Export | Deterministic document generation | docx, pdf-lib, pdfmake, later PptxGenJS |
| Diagrams | Structured diagrams rendered as SVG/PNG | Mermaid, Graphviz WASM |
| Background work | Keep expensive processing off the main UI thread | Web Workers, Comlink |

The AI produces structured content rather than binary office files. Zod validates that content before dedicated renderers turn it into documents. Export layout is controlled by code; visual fidelity still requires testing.

## Privacy and provider keys

These are implementation requirements, not completed security guarantees.

- API keys enter through the UI and stay in session memory by default.
- An optional key vault encrypts saved keys using a passphrase-derived key.
- Keys must never appear in source files, URLs, plaintext local storage or logs.
- Cloud generation sends the selected content and key through the proxy to the chosen provider. Local-first storage does not mean cloud requests stay on the device.
- The proxy must restrict upstream hosts, enforce request limits and avoid retaining request content or keys.
- Encryption at rest does not protect an unlocked session against malicious JavaScript.

Outline Studio is intended to be free software. Provider pricing, quotas and hosting limits are separate constraints; BYOK does not guarantee free inference.

## Roadmap

| Phase | Scope | Status |
| :---: | :--- | :--- |
| **01** | Provider adapters, Zod Document IR, single agent chain, DOCX/PDF export, API key vault | **Next to build** |
| 02 | PPTX export, Mermaid/Graphviz diagrams, themes, streaming interface | Planned |
| 03 | Rubric extraction, review loop, citation verification, college templates | Planned |
| 04 | PWA offline support, OCR input, English/Hindi UI, accessibility pass | Planned |
| 05 | Local model integrations and renderer/template extensions | Planned |

Development proceeds one phase at a time. Phase 1 is the current implementation scope.

## Development

Application setup commands will be added once the Phase 1 workspace exists. There is no runnable application in this documentation release.

Planned workspace layout:

```text
outline-studio/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── ui/
│   │       ├── domain/
│   │       ├── adapters/
│   │       └── workers/
│   └── proxy/
│       └── src/
├── packages/
│   ├── schemas/
│   └── config/
├── docs/
│   ├── assets/
│   └── adr/
└── .github/workflows/
```

Code standards: strict TypeScript, no `any`, no code comments, Zod validation at boundaries, files under 150 lines and functions under 30 lines. Planned checks include Biome, type checking, Vitest, provider mocks, export validation and Playwright.

## Team

Built together by the following team members. Names are listed in the order provided by the team.

| No. | Team member | University roll number |
| :---: | :--- | :--- |
| 01 | **Krishnendu Adak** | `UG/SOET/30/24/343` |
| 02 | **Krishnendu Das** | `UG/SOET/30/24/448` |
| 03 | **Md Danish Raza** | `UG/SOET/30/24/369` |
| 04 | **Sneha Das** | `UG/SOET/30/24/467` |
| 05 | **Shreankita Das** | `UG/SOET/30/24/436` |
| 06 | **Shruti Nayak** | `UG/SOET/30/24/423` |
| 07 | **Rudra Bharti** | `UG/SOET/30/24/462` |
| 08 | **Aniket Shaw** | `UG/SOET/30/24/409` |

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

**Outline Studio**<br>
Every format. One flow.

</div>
