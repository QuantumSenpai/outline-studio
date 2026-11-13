import os
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont

PAPER = "#F7F4EE"
INK = "#1E2030"
INDIGO = "#4338CA"
TEAL = "#087F8C"
SAFFRON = "#BD6419"
MUTED = "#626471"
RULE = "#D9D6D1"
WHITE = "#FFFEFA"
SCALE = 2
FONT = os.environ.get("OUTLINE_FONT", "/System/Library/Fonts/Avenir Next.ttc")


@lru_cache(maxsize=64)
def font(size, weight):
    return ImageFont.truetype(FONT, round(size * SCALE), index=weight)


def canvas(size):
    return Image.new("RGB", tuple(v * SCALE for v in size), PAPER)


def coords(values):
    return tuple(round(v * SCALE) for v in values)


def mix(first, second, amount):
    a = bytes.fromhex(first.lstrip("#"))
    b = bytes.fromhex(second.lstrip("#"))
    return tuple(round(x + (y - x) * amount) for x, y in zip(a, b))


def text(image, xy, value, size=24, color=INK, weight=5):
    ImageDraw.Draw(image).text(coords(xy), value, font=font(size, weight), fill=color)


def line(image, points, color=RULE, width=2):
    points = [coords(point) for point in points]
    ImageDraw.Draw(image).line(points, fill=color, width=round(width * SCALE), joint="curve")


def box(image, bounds, fill=WHITE, outline=RULE, radius=0):
    ImageDraw.Draw(image).rounded_rectangle(coords(bounds), radius * SCALE, fill, outline, SCALE)


def smooth(value):
    value = min(1, max(0, value))
    return value * value * (3 - 2 * value)


def reveal(time, delay, span=0.72):
    entrance = smooth((time - delay) / span)
    exit_phase = smooth((time - 6.0 - delay * 0.18) / 0.82)
    return entrance * (1 - exit_phase)


def trace(image, points, progress, color=INDIGO, width=3):
    lengths = [((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5 for a, b in zip(points, points[1:])]
    remaining = sum(lengths) * progress
    for start, end, length in zip(points, points[1:], lengths):
        if remaining <= 0:
            break
        fraction = min(1, remaining / max(length, 0.001))
        tip = tuple(a + (b - a) * fraction for a, b in zip(start, end))
        line(image, [start, tip], color, width)
        remaining -= length


def rule(image, x, y, width, progress, color=INDIGO, thickness=4):
    line(image, [(x, y), (x + width, y)], RULE, thickness)
    if progress > 0:
        line(image, [(x, y), (x + width * progress, y)], color, thickness)


def tick(image, x, y, progress, color=TEAL, size=18):
    trace(image, [(x, y + size * 0.5), (x + size * 0.35, y + size), (x + size, y)], progress, color, 3)


def page(image, x, y, width, height, color=INDIGO):
    fold = min(23, width * 0.2)
    points = [(x, y), (x + width - fold, y), (x + width, y + fold), (x + width, y + height), (x, y + height), (x, y)]
    ImageDraw.Draw(image).polygon([coords(p) for p in points], WHITE)
    line(image, points, RULE, 2)
    line(image, [(x + width - fold, y), (x + width - fold, y + fold), (x + width, y + fold)], RULE)
    line(image, [(x, y), (x + width - fold, y)], color, 3)


def icon(image, kind, x, y, width, height, time, delay):
    color = TEAL if kind in ("DOCX", "Diagrams") else INDIGO
    progress = reveal(time, delay)
    if kind == "Diagrams":
        diagram(image, x, y, width, height, time, delay)
        return
    page(image, x, y, width, height, color)
    if kind == "PPTX":
        rule(image, x + 13, y + 26, width - 46, progress, color, 4)
        for index, value in enumerate([0.4, 0.7, 1]):
            level = reveal(time, delay + 0.12 * index) * value
            box(image, (x + 14 + index * 20, y + height - 14 - 38 * level, x + 24 + index * 20, y + height - 14), color, color)
    else:
        for index in range(3 if kind == "PDF" else 4):
            length = (width - 28) * (0.66 if index == 3 else 1)
            rule(image, x + 14, y + 29 + index * 14, length, reveal(time, delay + index * 0.1), color, 3)
        if kind == "PDF":
            tick(image, x + width - 26, y + height - 24, reveal(time, delay + 0.6), color, 12)


def diagram(image, x, y, width, height, time, delay):
    centers = [(x + width / 2, y + 14), (x + 16, y + height - 16), (x + width - 16, y + height - 16)]
    for index in (1, 2):
        points = [centers[0], (centers[0][0], y + height / 2), (centers[index][0], y + height / 2), centers[index]]
        line(image, points, RULE)
        trace(image, points, reveal(time, delay + index * 0.14), TEAL)
    for index, (cx, cy) in enumerate(centers):
        color = mix(WHITE, TEAL, reveal(time, delay + index * 0.18))
        box(image, (cx - 12, cy - 9, cx + 12, cy + 9), color, TEAL, 3)
