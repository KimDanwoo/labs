# @repo/fonts

랩스 앱이 함께 쓰는 마루부리 서체. 크기·간격·색 같은 디자인 값은 담지 않는다. 그건 앱마다 따로 둔다([DESIGN_RULES.md](../../DESIGN_RULES.md)).

## 쓰는 법

앱 루트 레이아웃에서 한 번 import한다.

```ts
import '@repo/fonts/fonts.css';
```

`--font-maruburi` 변수와 `@font-face`가 생긴다. 앱의 `theme.css`나 전역 CSS에서 `--font-sans: var(--font-maruburi);`처럼 연결한다. 굵기는 400·600·700만 있다.

## 구성

| 경로                     | 내용                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `fonts/maruburi.css`     | `@font-face`와 `--font-maruburi` (생성물)                  |
| `fonts/*.woff2`          | 글자 범위(latin·symbols·ko-common·ko-rest)별 조각 (생성물) |
| `fonts/source/`          | 원본 서체                                                  |
| `fonts/LICENSE.md`       | 서체 라이선스                                              |
| `scripts/subsetFonts.py` | 원본을 조각으로 나누고 `maruburi.css`를 만든다             |

## 주의

- `fonts/`의 조각 파일과 `maruburi.css`는 `pnpm --filter @repo/fonts fonts`(fonttools·brotli 필요)로 생성한다 — **직접 수정 금지**. 원본을 바꿀 때만 다시 실행한다.
- danwoo-island는 빌드 때 `fonts/`의 파일을 직접 읽는다(`apps/danwoo-island/scripts/portfolioContent.mjs`). 파일 이름을 바꾸면 그쪽도 함께 고친다.
