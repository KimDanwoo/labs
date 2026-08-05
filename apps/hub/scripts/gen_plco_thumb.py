"""hub 프로젝트 카드용 플코 썸네일 생성 → public/projects/plco.webp (1408x768).

직접 그리지 않는다 — 게임의 실제 에셋만 조합한다.
배경: apps/plco/public/room_4.png(outdoor 룸) 의 가로 밴드
캐릭터: apps/plco/public/character_6..10.webp 앞모습 프레임

픽셀아트가 뭉개지지 않게 캐릭터는 논리 픽셀의 정수배로만 확대한다(BEAR_SCALE).
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

W, H = 1408, 768
PLCO_PUBLIC = Path(__file__).resolve().parents[2] / 'plco' / 'public'
OUT_PATH = Path(__file__).resolve().parent.parent / 'public' / 'projects' / 'plco.webp'

ROOM = 'room_4.png'          # outdoor — 하늘·풀이 있어 가로 밴드로 잘라도 자연스럽다
BEARS = (6, 7, 8, 9, 10)

# 논리 픽셀 1 → 5px. 정수배라 픽셀이 뭉개지지 않고, 룸 아트 자체의 픽셀 크기와도 비슷해 결이 맞는다.
# 4배는 머리가 배경 꽃 높이에 걸려 꽃을 얹은 것처럼 보였다.
BEAR_SCALE = 5
# 카드 커버는 object-cover로 세로가 잘린다(sm 2단에서 위아래 각 78px). 지평선을 올려 풀을 넓게 두고
# 캐릭터를 그 안전 구간(y 156~612)에 넣어야 어느 브레이크포인트에서도 몸이 잘리지 않는다.
SKY_ABOVE = 0.40
FEET_Y = 600
GAP = 14                     # 캐릭터 간격
SHADOW = (108, 156, 120)


def find_horizon(im):
    """풀(초록) 비율이 처음 절반을 넘는 행 — 크림색 구름을 초록으로 오인하지 않게 엄격히 판정."""
    px = im.load()
    w, h = im.size
    for y in range(0, h, 8):
        hit = n = 0
        for x in range(0, w, 16):
            r, g, b = px[x, y]
            n += 1
            if g > r + 12 and g > b + 12:
                hit += 1
        if hit / n > 0.5:
            return y
    raise RuntimeError('지평선을 찾지 못했다 — room 에셋이 바뀌었는지 확인')


def room_band():
    """원본 해상도에서 1408x768을 그대로 잘라낸다 — 리샘플링이 없으니 룸 아트의 픽셀 경계가 캐릭터처럼 또렷하게 남는다."""
    im = Image.open(PLCO_PUBLIC / ROOM).convert('RGB')
    w, h = im.size
    if w < W or h < H:
        raise RuntimeError(f'룸 에셋이 {W}x{H}보다 작다: {im.size}')
    left = (w - W) // 2
    top = max(0, min(h - H, round(find_horizon(im) - SKY_ABOVE * H)))
    return im.crop((left, top, left + W, top + H))


def bear_figures():
    """앞모습(row 1) 프레임 0을 잘라 정수배로 확대한다."""
    figs = []
    for cid in BEARS:
        sheet = Image.open(PLCO_PUBLIC / f'character_{cid}.webp').convert('RGBA')
        cell = sheet.crop((0, 256, 256, 512))
        logical = cell.resize((64, 64), Image.NEAREST)          # 시트는 논리 64의 4배
        fig = logical.crop(logical.split()[3].getbbox())
        figs.append(fig.resize((fig.width * BEAR_SCALE, fig.height * BEAR_SCALE), Image.NEAREST))
    return figs


def paste_bears(canvas, figs):
    total = sum(f.width for f in figs) + GAP * (len(figs) - 1)
    x = (W - total) // 2

    # 발밑 그림자를 한 레이어에 모아 한 번만 블러 → 룸 아트의 부드러운 그림자와 결을 맞춘다
    shadow_mask = Image.new('L', (W, H), 0)
    sd = ImageDraw.Draw(shadow_mask)
    for f in figs:
        cx = x + f.width // 2
        rx, ry = int(f.width * 0.34), 9
        sd.ellipse((cx - rx, FEET_Y - ry, cx + rx, FEET_Y + ry), fill=70)
        x += f.width + GAP
    canvas.paste(SHADOW, (0, 0), shadow_mask.filter(ImageFilter.GaussianBlur(7)))

    x = (W - total) // 2
    for f in figs:
        canvas.paste(f, (x, FEET_Y - f.height), f)
        x += f.width + GAP


def main():
    canvas = room_band()
    figs = bear_figures()
    paste_bears(canvas, figs)
    # 룸 아트에 그라데이션이 많아 무손실은 774K까지 커진다. q90은 43K인데
    # 200% 확대에서도 캐릭터 픽셀 경계가 그대로라 손실을 쓴다.
    canvas.save(OUT_PATH, 'WEBP', quality=90, method=6)
    print(f'saved {OUT_PATH} {canvas.size} | 캐릭터 {figs[0].height}px 높이')


if __name__ == '__main__':
    main()
