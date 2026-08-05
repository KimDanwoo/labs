"""hub 프로젝트 카드용 플코 썸네일 생성 → public/projects/plco.webp (1408x768).

직접 그리지 않는다 — 게임의 실제 에셋(outdoor 룸)에서 가로 밴드를 잘라낸다.
원본 해상도 그대로 크롭이라 리샘플링이 없고, 룸 아트의 픽셀 경계가 또렷하게 남는다.
"""

from pathlib import Path

from PIL import Image

W, H = 1408, 768
PLCO_PUBLIC = Path(__file__).resolve().parents[2] / 'plco' / 'public'
OUT_PATH = Path(__file__).resolve().parent.parent / 'public' / 'projects' / 'plco.webp'

ROOM = 'room_4.png'  # outdoor — 하늘·풀이 있어 가로 밴드로 잘라도 자연스럽다
# 카드 커버는 object-cover로 세로가 잘린다(sm 2단에서 위아래 각 78px).
# 하늘:풀 비율 — 0.55면 구름이 프레임에 들어오고 벤치·나무가 안전 구간(y 78~690)에 남는다.
SKY_ABOVE = 0.55


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
    im = Image.open(PLCO_PUBLIC / ROOM).convert('RGB')
    w, h = im.size
    if w < W or h < H:
        raise RuntimeError(f'룸 에셋이 {W}x{H}보다 작다: {im.size}')
    left = w - W  # 오른쪽 정렬 — 나무가 소스의 오른쪽 끝에 붙어 있어 가운데 크롭이면 잘린다
    top = max(0, min(h - H, round(find_horizon(im) - SKY_ABOVE * H)))
    return im.crop((left, top, left + W, top + H))


def main():
    canvas = room_band()
    # 룸 아트에 그라데이션이 많아 무손실은 700K를 넘는다. q90이면 픽셀 경계가 그대로라 손실을 쓴다.
    canvas.save(OUT_PATH, 'WEBP', quality=90, method=6)
    print(f'saved {OUT_PATH} {canvas.size}')


if __name__ == '__main__':
    main()
