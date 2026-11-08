# @tokens/css

모노레포 전체에서 사용하는 디자인 토큰의 **단일 진실 공급원(source of truth)**. TypeScript로 토큰을 정의하고 `generated/theme.css`를 생성한다.

## 사용법

앱 전역 CSS에서 `tailwindcss` 다음에 `theme.css`를 불러온다.

```css
@import 'tailwindcss';
@import '@tokens/css/theme.css';
```

서체는 앱 루트(레이아웃)에서 따로 불러온다. `--font-sans`가 참조하는 `--font-maruburi`와 `@font-face`가 여기 있다.

```ts
import '@tokens/css/fonts.css';
```

이후 Tailwind 시맨틱 유틸로 쓴다. 예: `bg-primary`, `text-muted-foreground`, `px-lg`, `rounded-md`, `shadow-md`, `max-w-content`.

| export                  | 파일                            |
| ----------------------- | ------------------------------- |
| `@tokens/css`           | `src/index.ts` (토큰 객체)      |
| `@tokens/css/theme.css` | `generated/theme.css` (생성물)  |
| `@tokens/css/fonts.css` | `fonts/maruburi.css` (마루부리) |

## src/ 구조

| 파일            | 역할                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `palette.ts`    | Atomic 팔레트(OKLCH) — gray / brand / green / red / amber / sky 스케일(50–900), `commonColors`(white·black), `rootScalars`       |
| `colors.ts`     | Semantic 색 — 역할 이름별 light/dark 값. 대부분 palette를 참조하고 일부(다크 subtle, glass, glow, toggle-\*)는 oklch를 직접 쓴다 |
| `typography.ts` | 폰트 패밀리·크기·굵기                                                                                                            |
| `spacing.ts`    | 간격(spacing)·반경(radius)·컨테이너(container) 스케일                                                                            |
| `shadow.ts`     | 그림자 스케일(sm·md·lg·glow)                                                                                                     |
| `index.ts`      | 전체 re-export + 통합 `tokens` 객체                                                                                              |

`scripts/buildTokens.ts`가 이 소스를 읽어 `generated/theme.css`를 만든다.

## 색상 2-tier 구조

```text
atomic (palette.ts)                                    → semantic (colors.ts)
brand[600]  oklch(0.48 calc(0.20 * var(--brand-chroma)) var(--brand-hue))
                                                       → primary (light)
brand[400]                                             → primary (dark)
gray[900]   oklch(0.145 0.018 264)                     → foreground (light), background (dark)
green[700]  oklch(0.48 0.13 152)                       → success (light)
```

- `brand` 램프는 hue·채도를 `--brand-hue`(기본 240)·`--brand-chroma`(기본 0.8) 변수로 둔다. 앱이 `:root`에서 이 값만 바꾸면 primary·accent·ring 등이 함께 바뀐다(fe-deep는 `--brand-chroma: 0.6`).
- 시맨틱 이름은 역할 기반이다: `primary`, `secondary`, `muted`, `accent`, `card`, `popover`, `border`, `input`, `ring`, `success`/`error`/`warning`/`info`(각각 `-foreground`·`-subtle`), `glass`, `glass-border`, `glow`, `toggle-*`.
- 라이트 상태색(success·warning·info·error)은 각자의 `-subtle` 배경 위 글자 대비가 4.5:1 이상이 되도록 스텝을 골랐다(`colors.ts` 주석).
- 색 값은 `palette.ts`만이 아니라 `colors.ts`(oklch 직접 값)와 `shadow.ts`(glow의 oklch, rgba 그림자)에도 있다. 값을 바꿀 때는 세 파일을 모두 확인한다.

## 생성되는 theme.css

```css
@custom-variant dark (&:where(.dark, .dark *));

:root {
  color-scheme: light;
  --brand-hue: 240;
  --brand-chroma: 0.8;
  --color-*: /* light 값 */;
  --font-* / --text-* / --font-weight-* / --spacing-* / --radius-* / --shadow-* / --container-*: /* 단일 값 */;
}

.dark {
  color-scheme: dark;
  --color-*: /* dark 값 */;
}

@theme inline {
  --color-primary: var(--color-primary); /* 모든 토큰을 같은 이름의 런타임 변수로 매핑 */
  --max-width-md: var(--container-md); /* max-w 가드, 아래 참고 */
}

@layer base {
  * {
    border-color: var(--color-border);
  }
}
```

- `@theme inline`은 자기 자신을 참조하는 맵이라, 유틸이 런타임 변수를 가리킨다. `.dark`나 앱 `:root` 오버라이드가 그대로 반영된다.
- 색을 지정하지 않은 `border`는 `currentColor` 대신 `--color-border`를 쓴다.

### max-w 가드

Tailwind v4는 `max-w-*`를 `--max-width` → `--spacing` → `--container` 순서로 찾는다. spacing과 이름이 겹치는 키(xs~3xl)는 그대로 두면 `max-w-md`가 `--spacing-md`(16px)로 풀린다. 그래서 buildTokens가 겹치는 키마다 `--max-width-*: var(--container-*)`를 만든다. 결과적으로 `max-w-md`는 28rem이다. `w-*`·`min-w-*`는 spacing 값 그대로다(`w-md` = 16px).

## 간격 스케일 두 가지

- **이름 토큰** — `xs` 4px · `sm` 8px · `md` 16px · `lg` 24px · `xl` 32px · `2xl` 48px · `3xl` 64px. `px-lg`, `gap-3xl`처럼 쓴다. dansoon·hub·design·soundlab·prairie 등 앱 레이아웃 간격에 쓴다.
- **Tailwind 숫자 스케일** — `p-4` = 1rem. shadcn 기반인 `packages/ui`와 fe-deep에서 쓴다.

임의 px 값(`p-[13px]` 등)은 쓰지 않는다. `spacing`에 `none` 키를 두지 않는다(`max-w-none`이 0으로 덮인다, `spacing.ts` 주석).

## 서체와 굵기

- `font-sans` = 마루부리(`var(--font-maruburi)`), `font-mono` = Geist Mono(`var(--font-geist-mono)`, 앱이 로드).
- 굵기 토큰은 `normal` 400 · `semibold` 600 · `bold` 700만 있다. 마루부리가 이 세 굵기만 제공한다.
- `font-medium` 등 마루부리에 없는 굵기(thin·extralight·light·medium·extrabold·black)는 `font-mono`와 함께 쓸 때만 허용된다. `pnpm lint`의 디자인 토큰 검사(`scripts/check-architecture.mjs`)가 막는다.

## 토큰 추가·수정

1. `src/`의 해당 파일을 고친다(색은 `palette.ts` 스케일 → `colors.ts` 역할 이름, light/dark 두 값).
2. `pnpm tokens`로 `generated/theme.css`를 다시 만든다. `build`/`dev`는 turbo가 먼저 생성한다.
3. 새 이름은 Tailwind 유틸로 바로 쓸 수 있다(예: `--color-foo` → `bg-foo`).

앱에서만 쓰는 비시맨틱 색은 공유 토큰에 넣지 않고 그 앱 전역 CSS에 둔다(예: prairie `@theme`의 `prairie-*`, dansoon의 `--category-*` 변수).

## 주의

- `generated/theme.css`는 자동 생성 파일(gitignore)이다 — **직접 수정 금지**.
- `fonts/`의 조각 파일과 `maruburi.css`는 `pnpm --filter @tokens/css fonts`(`scripts/subsetFonts.py`, fonttools·brotli 필요)로 생성한다 — **직접 수정 금지**. 원본은 `fonts/source/`, 라이선스는 `fonts/LICENSE.md`.
- 색은 Tailwind 시맨틱 유틸로만 쓴다. Tailwind 기본 팔레트 색(`bg-blue-500` 등)과 임의 색 값(`bg-[#...]`)은 `pnpm lint`가 막는다. 예외는 그 줄이나 바로 윗줄에 `token-exception: <이유>` 주석을 단다.
