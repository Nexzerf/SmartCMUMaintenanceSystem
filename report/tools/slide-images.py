# Prepares images for the slides, into out/diagrams/slide/.
# 1. Tall PlantUML diagrams are laid out in columns: a diagram 830 px wide and 2130 px tall shrinks
#    to nothing on a 16:9 slide, but cut in two it fills it. Cuts land only on rows that are
#    completely blank, so no box or arrow is ever sliced.
# 2. One phone from the reporter screens is cropped for the cover.
# Run: python tools/slide-images.py   (used by build-slides.js)
import os
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "out", "diagrams")
OUT = os.path.join(SRC, "slide")
GAP = 70          # white space between columns
PAD = 24          # breathing room around the whole image
PLAN = {          # diagram: number of columns
    "activity-submit": 2,
    "activity-confirm": 1,
    "activity-admin": 2,
    "activity-technician": 2,
    "activity-dashboard": 2,
    "ia": 1,
    "userflow": 1,
}


def row_ink(im):
    """Dark pixels per row. Box fills and labels score high; swimlane lines score 2–8."""
    g = im.convert("L")
    w, h = g.size
    px = g.load()
    return [sum(1 for x in range(w) if px[x, y] < 250) for y in range(h)]


def cut_points(im, cols):
    """Cut where the diagram is emptiest, so no box, label or arrow is ever sliced."""
    h = im.size[1]
    ink = row_ink(im)
    points = []
    for i in range(1, cols):
        ideal = h * i // cols
        span = h // (cols * 2)
        lo, hi = max(1, ideal - span), min(h - 1, ideal + span)
        points.append(min(range(lo, hi), key=lambda y: (ink[y], abs(y - ideal))))
    return points


def trim(im):
    """Drop fully white margins so columns sit tight."""
    from PIL import ImageChops
    bg = Image.new("RGB", im.size, (255, 255, 255))
    box = ImageChops.difference(im.convert("RGB"), bg).getbbox()
    return im.crop(box) if box else im


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, cols in PLAN.items():
        src = os.path.join(SRC, name + ".png")
        if not os.path.exists(src):
            print("skip", name)
            continue
        im = trim(Image.open(src).convert("RGB"))
        if cols == 1:
            im = Image.open(src).convert("RGB")
            im.save(os.path.join(OUT, name + ".png"))
            print(name, "copied", im.size)
            continue
        bounds = [0] + cut_points(im, cols) + [im.size[1]]
        parts = [trim(im.crop((0, bounds[i], im.size[0], bounds[i + 1]))) for i in range(cols)]
        w = sum(p.size[0] for p in parts) + GAP * (cols - 1) + PAD * 2
        h = max(p.size[1] for p in parts) + PAD * 2
        out = Image.new("RGB", (w, h), (255, 255, 255))
        x = PAD
        for p in parts:
            out.paste(p, (x, PAD))
            x += p.size[0] + GAP
        out.save(os.path.join(OUT, name + ".png"))
        print(name, im.size, "->", out.size, "ratio", round(out.size[0] / out.size[1], 2))


def cover_phone():
    """First phone of the reporter screens, trimmed, for the cover slide."""
    src = os.path.join(HERE, "screens", "ui-reporter.png")
    if not os.path.exists(src):
        return
    im = Image.open(src).convert("RGB")
    w, h = im.size
    phone = trim(im.crop((0, 0, w // 4, h)))
    phone.save(os.path.join(OUT, "cover-phone.png"))
    print("cover-phone", phone.size, "ratio", round(phone.size[0] / phone.size[1], 2))


if __name__ == "__main__":
    main()
    cover_phone()
