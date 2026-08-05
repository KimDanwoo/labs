"""hub 프로젝트 카드용 스도쿠 썸네일 생성 → public/projects/sudoku.webp (1408x768, 무손실).

캡쳐 대신 격자 자체를 주인공으로 세운다. 색은 스도쿠 앱의 :root(라이트) 토큰을 그대로 쓴다.

색 출처: apps/awesome-sudoku/app/globals.css (:root)
문구 출처: entities/game/model/constants.ts(난이도 4단계), features/leaderboard(클래식·킬러)
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1408, 768
OUT_PATH = Path(__file__).resolve().parent.parent / 'public' / 'projects' / 'sudoku.webp'

# awesome-sudoku :root 토큰 (rgb 3값 → 튜플)
BG = (250, 250, 252)
SURFACE = (255, 255, 255)
TEXT_1 = (28, 28, 30)
TEXT_2 = (99, 99, 102)
TEXT_3 = (142, 142, 147)
ACCENT = (0, 122, 255)
CELL_SELECTED = (220, 235, 255)
CELL_RELATED = (245, 248, 255)
CELL_SAME = (200, 225, 255)
BORDER_LIGHT = (229, 229, 234)
BORDER_STRONG = (58, 58, 60)

KO = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
NUM = '/System/Library/Fonts/Helvetica.ttc'

# 유효한 완성 그리드 — 중복 없는 배치라 스도쿠를 아는 사람이 봐도 어색하지 않다
SOLUTION = [
    '534678912',
    '672195348',
    '198342567',
    '859761423',
    '426853791',
    '713924856',
    '961537284',
    '287419635',
    '345286179',
]
# 1 = 보여줄 칸(given), 0 = 빈 칸
GIVEN = [
    '101000100',
    '011010010',
    '000101001',
    '010001100',
    '100010001',
    '001100010',
    '100101000',
    '010010110',
    '001000101',
]

BOARD = 440
SEL = (4, 4)          # 선택 셀 (row, col) — 가운데 칸


def font(path, size, index=0):
    return ImageFont.truetype(path, size, index=index)


def fit_font(d, path, text, max_width, max_size, index=0):
    size = max_size
    while size > 8 and d.textlength(text, font=font(path, size, index)) > max_width:
        size -= 2
    return font(path, size, index)


def draw_tracked(d, xy, text, fnt, fill, tracking):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill)
        x += d.textlength(ch, font=fnt) + tracking


def center_text(d, box, text, fnt, fill):
    x0, y0, x1, y1 = box
    bb = d.textbbox((0, 0), text, font=fnt)
    d.text((
        (x0 + x1) / 2 - (bb[2] + bb[0]) / 2,
        (y0 + y1) / 2 - (bb[3] + bb[1]) / 2,
    ), text, font=fnt, fill=fill)


def drop_shadow(canvas, box, radius, blur, alpha):
    layer = Image.new('L', canvas.size, 0)
    ImageDraw.Draw(layer).rounded_rectangle(box, radius, fill=alpha)
    canvas.paste((190, 195, 205), (0, 0), layer.filter(ImageFilter.GaussianBlur(blur)))


def draw_board(canvas, ox, oy):
    d = ImageDraw.Draw(canvas)
    cell = BOARD / 9
    sr, sc = SEL
    sel_value = SOLUTION[sr][sc]

    drop_shadow(canvas, (ox + 4, oy + 12, ox + BOARD + 4, oy + BOARD + 16), 16, 18, 70)
    d.rounded_rectangle((ox, oy, ox + BOARD, oy + BOARD), 14, fill=SURFACE)

    # 셀 배경 — 선택 셀 / 같은 행·열 / 같은 숫자
    for r in range(9):
        for c in range(9):
            fill = None
            if (r, c) == (sr, sc):
                fill = CELL_SELECTED
            elif r == sr or c == sc:
                fill = CELL_RELATED
            elif GIVEN[r][c] == '1' and SOLUTION[r][c] == sel_value:
                fill = CELL_SAME
            if fill:
                d.rectangle((ox + c * cell, oy + r * cell, ox + (c + 1) * cell, oy + (r + 1) * cell), fill=fill)

    # 얇은 격자선
    for i in range(1, 9):
        p = i * cell
        d.line((ox + p, oy + 6, ox + p, oy + BOARD - 6), fill=BORDER_LIGHT, width=2)
        d.line((ox + 6, oy + p, ox + BOARD - 6, oy + p), fill=BORDER_LIGHT, width=2)
    # 3x3 굵은 구분선
    for i in (3, 6):
        p = i * cell
        d.line((ox + p, oy + 4, ox + p, oy + BOARD - 4), fill=BORDER_STRONG, width=3)
        d.line((ox + 4, oy + p, ox + BOARD - 4, oy + p), fill=BORDER_STRONG, width=3)
    d.rounded_rectangle((ox, oy, ox + BOARD, oy + BOARD), 14, outline=BORDER_STRONG, width=3)

    num_f = font(NUM, int(cell * 0.62))
    for r in range(9):
        for c in range(9):
            if GIVEN[r][c] != '1':
                continue
            box = (ox + c * cell, oy + r * cell, ox + (c + 1) * cell, oy + (r + 1) * cell)
            color = ACCENT if SOLUTION[r][c] == sel_value else TEXT_1
            center_text(d, box, SOLUTION[r][c], num_f, color)

    # 선택 셀에는 입력 중인 숫자를 액센트로
    box = (ox + sc * cell, oy + sr * cell, ox + (sc + 1) * cell, oy + (sr + 1) * cell)
    center_text(d, box, sel_value, num_f, ACCENT)


def main():
    canvas = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(canvas)

    board_x = 792
    board_y = (H - BOARD) // 2
    left, left_max = 104, board_x - 72 - 104

    draw_tracked(d, (left, 250), 'SUDOKU', font(NUM, 26, index=1), ACCENT, 8)

    title_f = fit_font(d, KO, '스도쿠', left_max, 132, index=2)
    d.text((left, 292), '스도쿠', font=title_f, fill=TEXT_1)

    d.text((left, 452), '쉽게 즐기는 스도쿠 게임', font=font(KO, 36, index=1), fill=TEXT_2)
    d.rectangle((left, 520, left + 76, 524), fill=ACCENT)
    d.text((left, 556), '클래식 · 킬러 · 난이도 4단계', font=font(KO, 24, index=1), fill=TEXT_3)

    draw_board(canvas, board_x, board_y)

    # 격자선·숫자가 선명해야 하므로 무손실 (플랫한 면이 많아 용량도 더 작다)
    canvas.save(OUT_PATH, 'WEBP', lossless=True, method=6)
    print(f'saved {OUT_PATH} {canvas.size}')


if __name__ == '__main__':
    main()
