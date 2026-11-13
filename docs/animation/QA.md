# Outline Studio artwork verification

Checked locally on 13 November 2026, starting from commit `117ad80`.

## Repository evidence

The initial worktree was clean. No merge or rebase was in progress. The tracked checkout contained `README.md`, `LICENSE` and two banner assets. No `AGENTS.md`, separate project specification, application source, package manifest or application scripts were present. Content follows the supplied requirements and existing project documentation; every product capability is labeled as planned.

## Asset results

| GIF | Bytes | Encoded frames | Duration |
|---|---:|---:|---:|
| Hero | 150,998 | 101 | 8,000 ms |
| Workflow | 180,595 | 160 | 8,000 ms |
| Formats | 91,624 | 81 | 8,000 ms |

Each timeline has 200 source frames at 25 FPS. Identical frames are coalesced into holds. All encoded durations are multiples of 40 ms; every GIF is below 1 MB. Complete decoding succeeds in Pillow 13.0.0 and FFmpeg 9.0.2.

The decoded first and last frames are pixel-identical. Heading regions remain unchanged across every frame. Adjacent average luminance changes remain below 0.20 on a 0–255 scale, supplementing visual checks for flashing. Static PNGs match the complete composition at 5.2 seconds.

## Visual inspection

- Inspected desktop PNG compositions and 343 px wide reductions for clipping, alignment, typography and readable format labels.
- Inspected decoded contact sheets at 0, 1.6, 3.2, 5.2, 7.04 and 7.96 seconds, including both sides of the loop boundary.
- Opened the local preview in Chromium at 1000 px and 375 px viewport widths. Reduced-motion mode correctly selected PNGs; every image loaded.
- Text contrast ratios: near-black on paper 14.66:1, secondary text on paper 5.34:1, indigo on paper 7.20:1, teal stage numbers on white 4.70:1. Fine neutral rules are decorative.
- Confirmed the small saffron accent survives GIF palette conversion. No glow, neon, flashing, moving headings or typing banner is used.

## Documentation and source checks

Exact team names, order and roll numbers pass. Relative links and navigation anchors resolve. The renderer and verification sources have no Python comments; every delivered text file is under 150 lines and every Python function is under 30 lines. No API keys are included. Changes are limited to the README and documentation artwork/sources; the existing MIT license is preserved.

Run [verify.py](verify.py) to repeat automated checks, then inspect [preview.html](preview.html) for visual review. `git diff --check` passes. Re-rendering with the same local Python, Pillow and font files produces identical GIF and PNG hashes.

## Limits

Actual GitHub README rendering was not tested: these changes remain local, with no commit or push. The browser preview checks the artwork rather than a GitHub-rendered Markdown page. Browser screenshots used the reduced-motion stills; GIF timing and seams were checked through complete decoding and representative frames. Application builds, provider calls and document exports cannot be tested because the application is not implemented. A fresh dependency installation and rendering on other operating systems were not tested; Avenir Next is a local macOS font dependency.
