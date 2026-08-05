"""곰 마스코트 스프라이트 생성기 → public/character_6..10.webp (4x4 워크시트, 1024px).

플코의 다섯 캐릭터(yeko/ako/bamko/hako/eunko)에서 파생한 오리지널 마스코트.
지오메트리: 논리 64 그리드를 4배 확대. 외곽선 상단 lp8(=y32), 하단 lp60(=y243).

실행: python3 apps/plco/scripts/gen_bears.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

PUBLIC_DIR = Path(__file__).resolve().parent.parent / 'public'

OUT = (170, 170, 184, 255)
BLUSH = (255, 178, 192, 255)
DARK = (92, 90, 100, 255)
GLINT = (255, 255, 255, 255)

WHITE_BODY = dict(body=(253, 252, 251, 255), far=(238, 238, 244, 255), shade=(228, 227, 235, 255),
                  muzzle=(236, 234, 243, 255))
TAN_BODY = dict(body=(242, 208, 168, 255), far=(228, 192, 150, 255), shade=(220, 182, 138, 255),
                muzzle=(252, 234, 210, 255))

VARIANTS = {
    1: dict(**TAN_BODY, ear=(108, 72, 52, 255), eye=(112, 72, 44, 255),
            mouth="smile", brow=None, mark=None),                                    # hako bear
    2: dict(**WHITE_BODY, ear=(248, 198, 88, 255), eye=(40, 88, 192, 255),
            mouth="open", brow=None, mark=("star", (240, 184, 70, 255))),            # ako bear
    3: dict(**WHITE_BODY, ear=(174, 178, 188, 255), eye=(202, 52, 62, 255),
            mouth="caret", brow=(120, 118, 128, 255), mark=("heart", (206, 74, 74, 255))),  # eunko bear
    4: dict(**WHITE_BODY, ear=(58, 68, 138, 255), eye=(84, 108, 188, 255),
            mouth="caret", brow=None, mark=None),                                    # yeko bear
    5: dict(**WHITE_BODY, ear=(248, 166, 194, 255), eye=(148, 82, 208, 255),
            mouth="caret", brow=None, mark=("diamond", (206, 74, 74, 255))),         # bamko bear
}

# variant → public 파일 번호 (기존 public/character_6..10 배치를 따른다)
OUT_ID = {1: 9, 2: 7, 3: 10, 4: 6, 5: 8}

DY = 1

MARKS = {
    "heart": ["01010", "11111", "11111", "01110", "00100"],
    "star": ["00100", "01110", "11111", "01110", "01010"],
    "diamond": ["00100", "01110", "11111", "01110", "00100"],
}


def outline_pass(img):
    px = img.load()
    line = []
    for y in range(64):
        for x in range(64):
            if px[x, y][3] != 0:
                continue
            if any(
                0 <= x + dx < 64 and 0 <= y + dy < 64
                and px[x + dx, y + dy][3] != 0 and px[x + dx, y + dy] != OUT
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            ):
                line.append((x, y))
    for x, y in line:
        px[x, y] = OUT


def put(px, pts, color):
    for (x, y) in pts:
        px[x, y + DY] = color


def tint(c, t=0.5):
    return tuple(round(ch + (255 - ch) * t) for ch in c[:3]) + (255,)


def darken(c, t=0.12):
    return tuple(round(ch * (1 - t)) for ch in c[:3]) + (255,)


def open_eye(d, px, cx, color):
    d.ellipse((cx - 3, 23 + DY, cx + 3, 29 + DY), fill=color)
    put(px, [(cx - 1, 24), (cx, 24), (cx - 1, 25)], GLINT)


def draw_mouth(px, style):
    if style == "open":
        put(px, [(30 + dx, 35 + dy) for dx in range(3) for dy in range(2)], DARK)
        put(px, [(31, 36)], (238, 130, 150, 255))
    elif style == "smile":
        put(px, [(29, 35), (30, 36), (31, 36), (32, 36), (33, 36), (34, 35)], DARK)
    else:  # caret ^
        put(px, [(30, 36), (31, 35), (32, 35), (33, 36)], DARK)


def face_front(d, px, v):
    ell(d, (25, 30, 39, 39), v["muzzle"])
    if v["brow"]:
        put(px, [(x, 20) for x in range(19, 26)], v["brow"])
        put(px, [(x, 20) for x in range(38, 45)], v["brow"])
    open_eye(d, px, 22, v["eye"])
    open_eye(d, px, 42, v["eye"])
    put(px, [(30, 32), (31, 32), (32, 32), (33, 32), (31, 33), (32, 33)], DARK)  # nose
    draw_mouth(px, v["mouth"])
    put(px, [(16 + dx, 31 + dy) for dx in range(4) for dy in range(2)], BLUSH)
    put(px, [(44 + dx, 31 + dy) for dx in range(4) for dy in range(2)], BLUSH)
    if v["mark"]:
        shape, color = v["mark"]
        for sy, row in enumerate(MARKS[shape]):
            for sx, ch in enumerate(row):
                if ch == "1":
                    px[30 + sx, 44 + sy + DY] = color


def face_side(d, px, v):
    ell(d, (14, 28, 25, 37), v["muzzle"])
    if v["brow"]:
        put(px, [(x, 20) for x in range(17, 24)], v["brow"])
    open_eye(d, px, 21, v["eye"])
    put(px, [(15, 32), (16, 32), (17, 32), (16, 33)], DARK)  # nose
    put(px, [(19, 35), (20, 35), (21, 36)], DARK)
    put(px, [(27 + dx, 31 + dy) for dx in range(4) for dy in range(2)], BLUSH)


def ell(d, box, fill):
    x0, y0, x1, y1 = box
    d.ellipse((x0, y0 + DY, x1, y1 + DY), fill=fill)


def rrect(d, box, radius, fill):
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0, y0 + DY, x1, y1 + DY), radius=radius, fill=fill)


def limb(d, box, fill):
    """윤곽선을 두른 팔 — 몸통과 같은 색이라도 실루엣이 읽히게 한다."""
    x0, y0, x1, y1 = box
    ell(d, (x0 - 1, y0 - 1, x1 + 1, y1 + 1), OUT)
    ell(d, box, fill)


def foot(d, box, fill):
    x0, y0, x1, y1 = box
    rrect(d, (x0 - 1, y0 - 1, x1 + 1, y1 + 1), 4, OUT)
    rrect(d, box, 3, fill)


def ear(d, v, box, inner=True):
    x0, y0, x1, y1 = box
    ell(d, box, v["ear"])
    if inner:
        ell(d, (x0 + 3, y0 + 3, x1 - 3, y1 - 3), tint(v["ear"]))


def bear(v, view, frame):
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    px = img.load()
    body = v["body"]
    lift_l = 2 if frame == 1 else 0
    lift_r = 2 if frame == 3 else 0
    front = view == "front"

    if view in ("front", "back"):
        ell(d, (24, 41, 40, 57), body)
        arm_l = 44 - (1 if frame == 3 else 0)
        arm_r = 44 - (1 if frame == 1 else 0)
        limb(d, (20, arm_l, 25, arm_l + 8), v["shade"])
        limb(d, (39, arm_r, 44, arm_r + 8), v["shade"])
        ell(d, (28, 45, 36, 54), v["muzzle"] if front else v["far"])  # 배 / 꼬리
        foot(d, (24, 52, 31, 58 - lift_l), v["shade"])
        foot(d, (33, 52, 40, 58 - lift_r), v["shade"])
        ear(d, v, (12, 8, 23, 19), inner=front)
        ear(d, v, (41, 8, 52, 19), inner=front)
        ell(d, (13, 10, 51, 43), body)
        if front:
            face_front(d, px, v)
    else:  # left profile; right row is mirrored by caller
        swing = -2 if frame == 1 else (2 if frame == 3 else 0)
        ell(d, (24, 41, 40, 57), body)
        foot(d, (32 - swing, 52, 40 - swing, 58 - lift_r), darken(v["shade"]))
        foot(d, (23 + swing, 52, 31 + swing, 58 - lift_l), v["shade"])
        limb(d, (22 + swing, 44, 28 + swing, 52), v["shade"])
        ear(d, v, (36, 8, 47, 19))
        ell(d, (15, 11, 49, 43), body)
        face_side(d, px, v)
    outline_pass(img)
    return img


def sheet_for(cid):
    """캐릭터 1명의 4x4 워크시트(1024px)를 만든다."""
    v = VARIANTS[cid]
    sheet = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    for row, view in enumerate(("back", "front", "left", "right")):
        for f in range(4):
            b = bear(v, "left" if view == "right" else view, f)
            if view == "right":
                b = b.transpose(Image.FLIP_LEFT_RIGHT)
            t = b.resize((256, 256), Image.NEAREST)
            sheet.paste(t, (f * 256, row * 256), t)
    return sheet


def build(out_dir=PUBLIC_DIR):
    out_dir = Path(out_dir)
    for cid in VARIANTS:
        path = out_dir / f"character_{OUT_ID[cid]}.webp"
        sheet_for(cid).save(path, lossless=True, method=6)
        print(f"saved {path}")


def verify(out_dir=PUBLIC_DIR):
    """모든 시트가 인간 캐릭터 시트와 같은 규격(상단 y=32, 하단 y≈243)인지 16프레임 전부 확인."""
    for cid in sorted(OUT_ID.values()):
        img = Image.open(Path(out_dir) / f"character_{cid}.webp").convert("RGBA")
        assert img.size == (1024, 1024), f"char_{cid} size={img.size}"
        boxes = [
            img.crop((f * 256, r * 256, (f + 1) * 256, (r + 1) * 256)).split()[3].getbbox()
            for r in range(4)
            for f in range(4)
        ]
        assert all(b[1] == 32 for b in boxes), f"char_{cid} top misaligned: {[b[1] for b in boxes]}"
        assert all(240 <= b[3] <= 244 for b in boxes), f"char_{cid} bottom misaligned: {[b[3] for b in boxes]}"
        alpha = {a for _, _, _, a in img.getdata()}
        assert alpha <= {0, 255}, f"char_{cid} semi-alpha pixels: {sorted(alpha - {0, 255})[:5]}"
        print(f"char_{cid}: 16 frames y=[32..{max(b[3] for b in boxes)}] colors={len(set(img.getdata()))} OK")


if __name__ == "__main__":
    build()
    verify()
