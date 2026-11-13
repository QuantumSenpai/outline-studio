from drawing import INDIGO, INK, MUTED, PAPER, RULE, SAFFRON, TEAL, WHITE
from drawing import box, canvas, icon, line, page, reveal, rule, text, tick, trace

FORMATS = ("PPTX", "DOCX", "PDF", "Diagrams")
SIZES = {"banner": (1080, 650), "workflow": (800, 700), "formats": (1080, 224)}


def hero_header(image):
    text(image, (48, 30), "THE ASSIGNMENT, CONNECTED.", 18, MUTED, 2)
    text(image, (43, 65), "Outline Studio", 96, INK, 2)
    text(image, (48, 190), "Every format. One flow.", 46, INDIGO, 5)
    line(image, [(48, 283), (1032, 283)], RULE)
    line(image, [(48, 283), (116, 283)], SAFFRON, 4)
    text(image, (48, 603), "ONE BRIEF", 18, MUTED, 2)
    text(image, (689, 603), "A SHARED CONTENT MODEL", 18, MUTED, 2)
    page(image, 947, 55, 80, 100, INDIGO)
    line(image, [(964, 92), (993, 92)], INDIGO, 4)
    line(image, [(964, 107), (1009, 107)], TEAL, 4)
    line(image, [(964, 122), (988, 122)], INDIGO, 4)


def brief(image, time):
    page(image, 48, 337, 220, 225, TEAL)
    text(image, (68, 356), "Your brief", 32, INK, 2)
    for index, width in enumerate([158, 139, 152, 92]):
        rule(image, 70, 420 + 24 * index, width, reveal(time, 0.3 + index * 0.14), TEAL, 5)


def hero_outputs(image, time):
    for index, kind in enumerate(FORMATS):
        x = 332 + index * 178
        points = [(268, 548), (x + 72, 548), (x + 72, 530)]
        line(image, points, RULE)
        trace(image, points, reveal(time, 1 + index * 0.18), TEAL, 2)
        icon(image, kind, x + 24, 350, 96, 120, time, 1.4 + index * 0.18)
        text(image, (x + (0 if kind == "Diagrams" else 22), 486), kind, 32, INK, 2)


def banner(time):
    image = canvas(SIZES["banner"])
    hero_header(image)
    brief(image, time)
    hero_outputs(image, time)
    return image


def workflow_card(image, x, y, number, title, color):
    box(image, (x, y, x + 352, y + 222), WHITE, RULE, 8)
    text(image, (x + 22, y + 16), number, 22, color, 2)
    text(image, (x + 70, y + 12), title, 36, INK, 2)
    line(image, [(x + 24, y + 70), (x + 328, y + 70)], RULE)


def plan_details(image, time):
    for index, label in enumerate(["Purpose", "Sections", "Length"]):
        y = 247 + index * 35
        box(image, (56, y, 72, y + 16), PAPER, RULE, 2)
        tick(image, 57, y + 1, reveal(time, 0.3 + index * 0.18), TEAL, 13)
        text(image, (88, y - 6), label, 26, MUTED)
        rule(image, 222, y + 9, 132 - index * 18, reveal(time, 0.4 + index * 0.18), TEAL)


def structure_details(image, time):
    text(image, (440, 235), "Document IR", 26, INDIGO, 2)
    for index, label in enumerate(["heading", "paragraph", "table"]):
        y = 278 + index * 27
        line(image, [(450, y), (450, y + 14), (465, y + 14)], RULE)
        rule(image, 477, y + 9, 62 + index * 12, reveal(time, 1.3 + index * 0.13), INDIGO)
        text(image, (588, y - 7), label, 26, MUTED)


def validation_details(image, time):
    for index, label in enumerate(["Schema", "Block types", "Required fields"]):
        y = 505 + index * 35
        text(image, (56, y - 6), label, 26, MUTED)
        rule(image, 252, y + 10, 64, reveal(time, 2.5 + index * 0.18), TEAL)
        tick(image, 339, y, reveal(time, 2.8 + index * 0.18), TEAL, 16)


def export_details(image, time):
    for index, kind in enumerate(["DOCX", "PDF"]):
        x = 440 + index * 164
        icon(image, kind, x, 505, 65, 87, time, 3.6 + index * 0.2)
        text(image, (x + 75, 532), kind, 26, INK, 2)
    rule(image, 440, 611, 302, reveal(time, 4.2), INDIGO, 3)


def workflow_connections(image, time):
    paths = [[(384, 280), (416, 280)], [(592, 392), (592, 409), (208, 409), (208, 426)], [(384, 538), (416, 538)]]
    for index, points in enumerate(paths):
        line(image, points, RULE, 2)
        trace(image, points, reveal(time, 0.95 + index * 1.25), TEAL, 3)


def workflow(time):
    image = canvas(SIZES["workflow"])
    text(image, (32, 28), "A considered path to export.", 48, INK, 2)
    text(image, (32, 101), "Plan the work. Build on one foundation.", 26, MUTED)
    workflow_connections(image, time)
    for x, y, number, title, color in [(32, 170, "01", "Plan", TEAL), (416, 170, "02", "Structure", INDIGO), (32, 426, "03", "Validate", TEAL), (416, 426, "04", "Export", INDIGO)]:
        workflow_card(image, x, y, number, title, color)
    plan_details(image, time)
    structure_details(image, time)
    validation_details(image, time)
    export_details(image, time)
    return image


def formats(time):
    image = canvas(SIZES["formats"])
    line(image, [(24, 1), (1056, 1)], RULE)
    line(image, [(24, 222), (1056, 222)], RULE)
    for index, kind in enumerate(FORMATS):
        x = 24 + index * 264
        if index:
            line(image, [(x - 12, 30), (x - 12, 192)], RULE)
        icon(image, kind, x + 77, 24, 90, 104, time, 0.35 + index * 0.35)
        offset = 38 if kind == "Diagrams" else 72
        text(image, (x + offset, 151), kind, 36, INK, 2)
    return image


SCENES = {"banner": banner, "workflow": workflow, "formats": formats}
