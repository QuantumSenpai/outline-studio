import ast
import io
import re
import tokenize
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat
from render import ASSETS, FPS, FRAME_COUNT, SECONDS, raster
from scenes import SCENES, SIZES

ROOT = ASSETS.parents[1]
QA = Path("/tmp/outline-studio-animation-qa")
TEAM = [("Krishnendu Adak", "343"), ("Krishnendu Das", "448"), ("Md Danish Raza", "369"),
        ("Sneha Das", "467"), ("Shreankita Das", "436"), ("Shruti Nayak", "423"),
        ("Rudra Bharti", "462"), ("Aniket Shaw", "409")]
HEADINGS = {"banner": [(0, 0, 1080, 283)], "formats": [(0, 140, 1080, 224)],
            "workflow": [(0, 0, 800, 160), (32, 170, 384, 240), (416, 170, 768, 240),
                         (34, 428, 382, 496), (418, 428, 766, 496)]}


def decode(scene):
    path = ASSETS / f"{scene}.gif"
    frames, durations = [], []
    with Image.open(path) as image:
        assert image.info["loop"] == 0
        for index in range(image.n_frames):
            image.seek(index)
            image.load()
            frames.append(image.convert("RGB"))
            durations.append(image.info["duration"])
    assert path.stat().st_size < 1_000_000
    assert 50 < len(frames) <= FRAME_COUNT
    assert sum(durations) == SECONDS * 1000
    assert all(value >= 1000 // FPS and value % (1000 // FPS) == 0 for value in durations)
    assert all(frame.size == SIZES[scene] for frame in frames)
    return frames, durations


def check_pixels(scene, frames):
    assert ImageChops.difference(frames[0], frames[-1]).getbbox() is None
    for frame in frames:
        for area in HEADINGS[scene]:
            assert ImageChops.difference(frame.crop(area), frames[0].crop(area)).getbbox() is None
    means = [ImageStat.Stat(frame.convert("L")).mean[0] for frame in frames]
    jump = max(abs(a - b) for a, b in zip(means, means[1:]))
    assert jump < 2
    with Image.open(ASSETS / f"{scene}-static.png") as image:
        assert ImageChops.difference(image.convert("RGB"), raster(scene, 5.2)).getbbox() is None
    return jump


def contact_sheet(scene, frames, durations):
    width, height = SIZES[scene]
    sheet = Image.new("RGB", (720, round(height * 360 / width + 28) * 3), "#F7F4EE")
    for index, target in enumerate([0, 1600, 3200, 5200, 7040, 7960]):
        elapsed, frame = 0, frames[-1]
        for candidate, duration in zip(frames, durations):
            if elapsed + duration > target:
                frame = candidate
                break
            elapsed += duration
        thumb = frame.resize((360, round(height * 360 / width)), Image.Resampling.LANCZOS)
        x, y = (index % 2) * 360, (index // 2) * (thumb.height + 28)
        sheet.paste(thumb, (x, y + 28))
        ImageDraw.Draw(sheet).text((x + 10, y + 6), f"{scene} / {target / 1000:.2f}s", fill="#1E2030")
    sheet.save(QA / f"{scene}-timeline.png")
    raster(scene, 5.2).resize((343, round(height * 343 / width)), Image.Resampling.LANCZOS).save(QA / f"{scene}-mobile.png")


def check_links():
    for path in [ROOT / "README.md", *Path(__file__).parent.glob("*.md"), *Path(__file__).parent.glob("*.html")]:
        content = path.read_text()
        links = re.findall(r'\]\(([^)]+)\)|(?:href|src|srcset)="([^"]+)"', content)
        for pair in links:
            link = next(value for value in pair if value)
            if link.startswith(("https:", "http:")):
                continue
            target, _, fragment = link.partition("#")
            destination = path.parent / target if target else path
            assert destination.exists(), (path, link)
            if fragment:
                headings = re.findall(r"^#{1,6} (.+)$", destination.read_text(), re.M)
                slugs = [re.sub(r"[^\w -]", "", title.lower()).replace(" ", "-") for title in headings]
                assert fragment in slugs, (path, fragment)


def check_sources():
    folder = Path(__file__).parent
    for path in [ROOT / "README.md", *folder.glob("*.*")]:
        content = path.read_text()
        assert len(content.splitlines()) < 150, path
        if path.suffix == ".py":
            assert not any(token.type == tokenize.COMMENT for token in tokenize.generate_tokens(io.StringIO(content).readline)), path
            for node in ast.walk(ast.parse(content)):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    assert node.end_lineno - node.lineno + 1 < 30, (path, node.name)
    readme = (ROOT / "README.md").read_text()
    rows = re.findall(r"^\| ([^|]+) \| UG/SOET/30/24/(\d+) \|$", readme, re.M)
    assert rows == TEAM
    assert "Outline Studio. Every format. One flow." in readme
    assert not re.search(r"OutlineStudio|Outline studio|outline_studio|sk-[A-Za-z0-9]{20,}", readme)


def main():
    QA.mkdir(parents=True, exist_ok=True)
    check_links()
    check_sources()
    for scene in SCENES:
        frames, durations = decode(scene)
        jump = check_pixels(scene, frames)
        contact_sheet(scene, frames, durations)
        size = (ASSETS / f"{scene}.gif").stat().st_size
        print(f"{scene}: {len(frames)} encoded frames, {sum(durations)} ms, {size:,} bytes, seam identical, max luminance step {jump:.3f}/255")
    print("Links, team order, naming, line limits, function limits and zero Python comments: passed")
    print(f"Visual QA sheets: {QA}")


if __name__ == "__main__":
    main()
