"""hub 프로젝트 카드용 Dansoon 썸네일 생성 → public/projects/dansoon.webp (1408x768, 무손실).

dansoon 사이트의 실제 톤을 그대로 가져온다 — GitHub Dark 배경 + 그린 액센트 + 세리프 제목.
카드에서 360px 폭까지 축소돼 표시되므로 요소는 크고 적게 두고, 세 섹션은
글자가 흐려져도 '칩 3개'로 읽히게 구성한다.

색 출처: apps/dansoon/src/styles/global.css (다크 테마 토큰)
문구 출처: apps/dansoon/README.md 의 자동화 스크립트 3종
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1408, 768
OUT_PATH = Path(__file__).resolve().parent.parent / 'public' / 'projects' / 'dansoon.webp'

# dansoon 다크 테마 토큰
BG = (13, 17, 23)
BG_SUBTLE = (22, 27, 34)
BORDER = (48, 54, 61)
TEXT = (230, 237, 243)
TEXT_2 = (139, 148, 158)
TEXT_MUTED = (72, 79, 88)
GREEN = (63, 185, 80)

SERIF = '/System/Library/Fonts/Supplemental/Georgia Bold.ttf'
KO = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
MONO = '/System/Library/Fonts/Menlo.ttc'

SECTIONS = (
    ('TECH', '오늘의 기술 뉴스', 'HackerNews · 매일'),
    ('BESTSELLER', '주간 베스트셀러', '교보 · YES24 · 알라딘'),
    ('WEBNOVEL', '웹소설 순위', '카카오페이지 · 네이버 · 리디'),
)


def font(path, size, index=0):
    return ImageFont.truetype(path, size, index=index)


def fit_font(d, path, text, max_width, max_size, index=0):
    """주어진 폭을 넘지 않는 가장 큰 크기를 고른다 — 워드마크가 옆 칼럼을 침범하지 않게."""
    size = max_size
    while size > 8 and d.textlength(text, font=font(path, size, index)) > max_width:
        size -= 2
    return font(path, size, index)


def draw_tracked(d, xy, text, fnt, fill, tracking):
    """자간을 벌려 그린다 — 사이트의 eyebrow 레이블 느낌."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill)
        x += d.textlength(ch, font=fnt) + tracking
    return x - tracking


def tracked_width(d, text, fnt, tracking):
    return sum(d.textlength(c, font=fnt) for c in text) + tracking * (len(text) - 1)


def radial_glow(size, center, radius, color, strength):
    """배경에 은은한 그린 글로우 — 단조로운 어두운 면에 깊이를 준다."""
    w, h = size
    layer = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(layer)
    cx, cy = center
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=strength)
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.55))
    tint = Image.new('RGB', (w, h), color)
    return layer, tint


def main():
    canvas = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(canvas)

    # 배경 글로우 2개 (우상단 그린, 좌하단 아주 옅은 청)
    for center, radius, color, strength in (
        ((1180, 150), 420, (63, 185, 80), 46),
        ((180, 700), 380, (88, 120, 180), 26),
    ):
        mask, tint = radial_glow((W, H), center, radius, color, strength)
        canvas.paste(tint, (0, 0), mask)

    # ── 오른쪽 칼럼 기준을 먼저 잡고, 왼쪽 폭을 그 안에서 결정한다
    card_x, card_w = 764, 540
    left = 104
    left_max = card_x - 56 - left

    # ── 왼쪽: 워드마크 블록 ────────────────────────────────
    eyebrow_f = font(MONO, 26, index=1)
    draw_tracked(d, (left, 236), 'AUTOMATED  DAILY', eyebrow_f, GREEN, 6)

    title_f = fit_font(d, SERIF, 'Dansoon', left_max, 152)
    d.text((left - 6, 286), 'Dansoon', font=title_f, fill=TEXT)

    sub_f = font(KO, 38, index=1)
    d.text((left, 452), 'AI가 매일 쓰는 리포트', font=sub_f, fill=TEXT_2)

    d.rectangle((left, 520, left + 76, 524), fill=GREEN)          # 사이트의 짧은 룰

    meta_f = font(MONO, 24)
    d.text((left, 556), 'Python + Gemini 2.5 Flash', font=meta_f, fill=TEXT_MUTED)

    # ── 오른쪽: 섹션 칩 3개 ───────────────────────────────
    card_h, gap = 118, 26
    total = card_h * len(SECTIONS) + gap * (len(SECTIONS) - 1)
    y = (H - total) // 2

    chip_f = font(MONO, 25, index=1)
    ko_f = font(KO, 41, index=2)
    src_f = font(KO, 24, index=1)

    for label, ko_title, source in SECTIONS:
        d.rounded_rectangle((card_x, y, card_x + card_w, y + card_h), 16, fill=BG_SUBTLE, outline=BORDER, width=2)
        d.rectangle((card_x, y + 18, card_x + 4, y + card_h - 18), fill=GREEN)   # 왼쪽 그린 바

        cw = tracked_width(d, label, chip_f, 4)
        d.rounded_rectangle((card_x + 30, y + 22, card_x + 30 + cw + 26, y + 56), 8, fill=(29, 51, 36))
        draw_tracked(d, (card_x + 43, y + 27), label, chip_f, GREEN, 4)

        d.text((card_x + 30, y + 62), ko_title, font=ko_f, fill=TEXT)
        sw = d.textlength(source, font=src_f)
        d.text((card_x + card_w - 30 - sw, y + 30), source, font=src_f, fill=TEXT_MUTED)
        y += card_h + gap

    # 작은 글자가 많아 무손실 — 손실 q90보다 7K 크지만 텍스트가 뭉개지지 않는다
    canvas.save(OUT_PATH, 'WEBP', lossless=True, method=6)
    print(f'saved {OUT_PATH} {canvas.size}')


if __name__ == '__main__':
    main()
