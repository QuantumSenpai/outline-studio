# GSAP hero, navigation and loading completion

The hero uses an original kinetic paper fan inspired by the 3D stack work in [Codrops' GSAP collection](https://tympanus.net/codrops/hub/gsap-highlights/). HTML/CSS 3D keeps the actual report, slide, diagram and chat content selectable and accessible. The existing GSAP dependency sequences the fan, brings the selected format forward and drives fine-pointer tilt with quickTo. There are no new animation packages, WebGL assets or permanent rendering loops.

## Motion behavior

- The fan opens and gathers, supports four formats and three sample ideas, and responds to desktop pointers. Phone controls remain 44 px or larger; pointer tilt ignores touch. A CSS fallback remains usable before GSAP loads or if its chunk fails.
- Explore now uses a reversible GSAP timeline with a staggered entrance and accelerated reverse exit. Outside click, Escape/focus return, inert closed contents, rapid toggles, reduced motion and delayed engine loading are handled. A WAAPI fallback animates an early click before GSAP is ready.
- New messages enter once over 260 ms, with no replay while streaming or restoring history. The composer settles over 280 ms; tabs use 220 ms, pages 260 ms and dialogs 240/180 ms. The earlier reduced-motion dialog-presence repair is preserved.
- GSAP loads after the page's load event, or sooner when Explore is requested. It is shared between the hero and navigation. GSAP contexts and media-query handlers are reverted on unmount; outstanding fallback animations are canceled.

## Loading changes

Removed the unused Bricolage font import, preloaded the local display font with adjusted fallback metrics, removed the Zod runtime dependency from the global storage-preference control while retaining its validation, and disabled speculative public navigation/CTA route prefetches. Academic font faces remain available for document previews.

Production benchmark: three cold contexts per width; Chromium, cache disabled, 4x CPU slowdown, 40 ms latency, 1.6 Mbps download. Before and final after runs were taken without other browser tests running. These are local lab results, not hosted field measurements.

| Median metric | Before | After |
| --- | ---: | ---: |
| Phone full load | 1558.2 ms | 1403.7 ms |
| Desktop full load | 1546.5 ms | 1405.5 ms |
| Phone total transfer | 259357 B | 261359 B |
| Desktop total transfer | 310845 B | 261359 B |
| Phone LCP | 472 ms | 572 ms |
| Desktop LCP | 476 ms | 576 ms |
| Phone CLS | 0.0488 | 0 |
| Desktop CLS | 0.0037 | 0 |

The result is about 9–10% faster full loading and 16% less desktop transfer. Phone transfer grows by about 2 KB, and measured LCP is 100 ms later. The font/geometry is stable rather than shifting after the initial paint. No improvement to hosted response times or provider latency is claimed. Raw results are in ignored qa-output/load-before.json and load-after.json; rerun apps/web/scripts/measure-motion-load.mjs against a local production server.

## Validation

The full production Chromium suite passed 44/44; a subsequent additional emulated-phone tap test covers the fan, format switching and mobile navigation. Lint/source rules, TypeScript, production build and 52 unit tests passed; 9 gated database tests remain skipped. Browser provider responses and incremental chat streams are synthetic.

The CPU-throttled rapid-switch test sampled 89 frame intervals: 16.8 ms at the 95th percentile and maximum. It verifies the GSAP fan settles after interruption. Screenshots at phone, tablet and desktop widths were generated and inspected. No physical-phone GPU, software keyboard or Safari verification is claimed.

Official API references: [GSAP context cleanup](https://gsap.com/docs/v3/GSAP/gsap.context/), [quickTo](https://gsap.com/docs/v3/GSAP/gsap.quickTo/) and [matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia/). The installed Next.js font and template documentation was used for font loading and route behavior.

## Workspace follow-up

The desktop coworker sidebar stays mounted and uses a 240 ms enter/exit transition, with short staggered row entrances and a running-task status pulse. Chat mode makes it inert and removes it from the accessibility tree. Mobile workflow controls continue to use the existing dialog.

The Chat/Create document control, workspace view bar and coworker selection now share a moving highlight. It measures the selected target, animates only transforms, and retargets an interrupted animation from its current displayed position. Resize, dynamic tab insertion, scroll positions, cleanup and reduced motion are handled.

The main workspace glides into its new position over 280 ms when the sidebar changes. Pointer-down captures the displayed position before a rapid mode change. Panel arrivals use an explicit 240 ms WAAPI transition, including consecutive coworker views that reuse a DOM node; this avoids Radix's initial CSS-animation suppression. History, composer contents and request lifecycle remain unchanged.

Keyboard highlights and panel selection stay immediate. Reduced motion cancels active workspace movement. New regression tests cover draft preservation, rapid mode/view changes, highlight alignment, coworker switches and emulated-phone workflow navigation.

Final workspace follow-up verification: all 47 production Chromium browser tests passed in 1.8 minutes. Lint/source rules, TypeScript, production build and 52 unit tests passed; 9 gated database tests were skipped. The new workspace tests failed before the selection/sidebar implementation and passed afterward. Desktop sidebar and phone screenshots were captured; physical-phone and Safari verification remains outside this evidence.

The owner authorized committing and pushing these changes with the workspace follow-up. Git history records the final source revision. No explicit deployment was requested or performed.
