# Playground refresh — 18 November 2026

Kimi's playground was used only as a structural reference (centred composer, compact suggestion pills, quiet empty state); the project's own paper palette, brand and copy are unchanged.

## What changed
- **Cleaner workspace.** In Chat mode the coworker rail is hidden and tabs are reduced to Conversation / Document / History; stage tabs appear only when a task has started or is active. The empty state is centred, the decorative file badge is hidden, and the mobile view drops the long explanation so the heading is never clipped by the composer.
- **Manual model switching.** Validated model lists are kept with each connection. A Model selector in the composer lets you choose among the models your provider actually returned; the choice is used by the next chat request or document stage. Connections with one model show a locked selector.
- **Attachment motion.** Preparing files shows a bounded progress shimmer; attachment chips enter with a short stagger. Upload limits and local-only persistence are unchanged.
- **Micro-interactions and page motion.** Mode/model/attachment/suggestion controls have explicit hover, focus and press transitions using the existing tokens. Tab content and messages use short opacity/translate reveals. All motion is transform/opacity, gated by `prefers-reduced-motion`, and hover effects are pointer-gated.
- **Rotating suggestions.** Four assignment prompts rotate every 12 seconds with a staggered fade; clicking one fills the composer. They no longer sit stacked above the textarea.
- **Footer reveal.** An IntersectionObserver adds `is-visible` when the footer nears the viewport; a hairline expands and the footer text and closing line fade/rise in, with a reduced-motion static fallback.
- **Diagram quality.** GraphViz output now uses larger, spaced nodes, rounded process boxes, distinct shapes, heavier strokes, arrow sizing and a readable Helvetica/Arial type scale. The preview sits in a bordered white frame. The GraphViz string is covered by new unit assertions. No untrusted SVG capability was added.
- **Button legibility.** All new controls set explicit text colours; no inherits from prose link styling. No button text is hidden by colour matching the background.

## Focused Chat cleanup (follow-up)
After visual review at 390 and 1440 px, Chat mode was simplified further: the site header/footer are hidden, the toolbar becomes a 48 px brand bar with icon-only tool buttons, the coworker rail is gone, tabs are compact, the file hint and character counter are removed, and attachments collapse behind a single `+` button with a small Upload/Camera menu. The composer has a shorter textarea and no extra explanatory note; suggestions scroll horizontally on phones. Save status remains available on desktop and tests keep their accessible labels.

## Verification
- pnpm typecheck, pnpm lint/source rules, pnpm test (51 passed, 9 gated DB tests skipped), pnpm build.
- Production local Chromium: 32/32 passed (including new model-switching and attachment tests), plus visual screenshots at 390 and 1440 px and footer-scroll check. No horizontal overflow.
- The one earlier axe timeout under heavy parallel load passed on isolated rerun and in the final clean 32/32 run.
- Not changed: provider keys/secrets, DB, deployment configuration, export formats and assignment gate behaviour.

## Notes
Animation frequency was checked before building: composer/mode controls are tens-of-times-per-day interactions, so their feedback is 100–220 ms; only the first-time footer reveal and rotating empty-state suggestions use longer, decorative motion. No animation was added to Enter-to-send or other high-frequency keyboard actions.
