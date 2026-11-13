from pathlib import Path
from PIL import Image
from drawing import INDIGO, INK, MUTED, PAPER, RULE, SAFFRON, SCALE, TEAL, WHITE
from scenes import SCENES, SIZES

ASSETS = Path(__file__).resolve().parents[1] / "assets"
FPS = 25
SECONDS = 8
FRAME_COUNT = FPS * SECONDS


def raster(scene, time):
    image = SCENES[scene](time)
    return image.resize(SIZES[scene], Image.Resampling.LANCZOS)


def palette_for(scene):
    width, height = SIZES[scene]
    samples = Image.new("RGB", (width, height * 4))
    for index, time in enumerate([0, 1.8, 3.2, 4.8]):
        samples.paste(raster(scene, time), (0, index * height))
    palette = samples.quantize(colors=120, method=Image.Quantize.MEDIANCUT)
    fixed = [channel for color in (PAPER, WHITE, INK, INDIGO, TEAL, SAFFRON, MUTED, RULE)
             for channel in bytes.fromhex(color.lstrip("#"))]
    palette.putpalette(palette.getpalette()[:360] + fixed)
    return palette


def render(scene):
    palette = palette_for(scene)
    frames = []
    for index in range(FRAME_COUNT):
        frame = raster(scene, index / FPS)
        frames.append(frame.quantize(palette=palette, dither=Image.Dither.NONE))
    target = ASSETS / f"{scene}.gif"
    frames[0].save(target, save_all=True, append_images=frames[1:], duration=1000 // FPS,
                   loop=0, optimize=True, disposal=1)
    raster(scene, 5.2).save(ASSETS / f"{scene}-static.png", optimize=True)
    print(f"{scene}: {target.stat().st_size:,} bytes, {FRAME_COUNT} source frames, {FPS} FPS")


def main():
    assert SCALE == 2
    ASSETS.mkdir(parents=True, exist_ok=True)
    for scene in SCENES:
        render(scene)


if __name__ == "__main__":
    main()
