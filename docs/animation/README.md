# Outline Studio artwork

Three explanatory loops share a paper, ink and folded-document vocabulary. They describe planned behavior, not a working application. Headings remain fixed while lines, chart bars, content blocks, checks and connections build in staggered sequences.

| Asset | Canvas | Timeline | Static alternative |
|---|---|---|---|
| [Hero](../assets/banner.gif) | 1080 × 650 | 8 seconds, 25 FPS | [PNG](../assets/banner-static.png) |
| [Workflow](../assets/workflow.gif) | 800 × 700 | 8 seconds, 25 FPS | [PNG](../assets/workflow-static.png) |
| [Formats](../assets/formats.gif) | 1080 × 224 | 8 seconds, 25 FPS | [PNG](../assets/formats-static.png) |

## Reproduce

Run from the repository root with Python 3.14 and the macOS Avenir Next font collection. The renderer uses TTC faces 2 (Demi Bold) and 5 (Medium). No font files are redistributed. To use another compatible collection, set `OUTLINE_FONT` to its path; matching faces are required for identical typography.

```sh
python3 -m venv /tmp/outline-studio-animation-env
/tmp/outline-studio-animation-env/bin/python -m pip install -r docs/animation/requirements.txt
/tmp/outline-studio-animation-env/bin/python docs/animation/render.py
/tmp/outline-studio-animation-env/bin/python docs/animation/verify.py
```

Pillow is a documentation-only dependency. Application dependencies and scripts are not required or changed. There are no downloaded graphics, random seeds, API calls or API keys in the renderer. Identical Pillow and font versions produce deterministic assets.

## Sources

- `drawing.py`: palette, font loading, antialiased drawing, document icons and easing.
- `scenes.py`: hero, workflow and format-strip compositions.
- `render.py`: 200 source frames per loop, shared 128-color palette, GIF and PNG encoding.
- `verify.py`: complete decoding, timing, seams, stable headings, links, team and source constraints.
- [preview.html](preview.html): local light/dark surround, animated and static previews.

The renderer draws at twice the final resolution and downsamples with Lanczos. GIFs use a fixed palette with dithering disabled to preserve clean text and keep files small. Encoding coalesces identical frames into longer holds; active changes retain the 40 ms cadence. The PNGs show the complete composition at 5.2 seconds.

Motion uses smoothstep easing for gradual line construction and retraction. The last and first frames are identical, with a quiet resting interval across the seam. No heading moves, no full-frame fades and no flashing effects are used.

## Preview and checks

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/docs/animation/preview.html`. Resize to a phone width and inspect labels, margins, document details and the end of each loop. This local page uses CSS for preview controls only; the README embeds repository-hosted GIFs with supported Markdown/HTML and visible PNG links. The preview follows reduced-motion preferences using static PNGs. GitHub's embedded GIFs have no automatic reduced-motion switch, so their static links remain visible.

Verification also writes desktop, phone-width and seam contact sheets to `/tmp/outline-studio-animation-qa/`. Review those alongside playback. Local previewing does not establish how the final README will render on GitHub; that requires inspection after the files are available there.
