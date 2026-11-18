# @tokens/css

모든 앱이 함께 쓰는 **서체·크기·간격·반경·그림자·컨테이너 폭** 토큰. 색은 담지 않는다. 색과 컴포넌트는 앱마다 따로 둔다([DESIGN_RULES.md](./DESIGN_RULES.md)).

## 사용법

앱 전역 CSS에서 `tailwindcss` 다음에 `theme.css`를 불러오고, 이어서 앱의 색 파일을 불러온다.

```css
@import 'tailwindcss';
@import '@tokens/css/theme.css';
@import './styles/colors.css';
```

서체는 앱 루트(레이아웃)에서 따로 불러온다. `--font-sans`가 참조하는 `--font-maruburi`와 `@font-face`가 여기 있다.

```ts
import '@tokens/css/fonts.css';
```

이후 Tailwind 유틸로 쓴다. 예: `px-lg`, `rounded-md`, `shadow-md`, `max-w-content`, `font-semibold`.

| export                  | 파일                            |
| ----------------------- | ------------------------------- |
| `@tokens/css`           | `src/index.ts` (토큰 객체)      |
| `@tokens/css/theme.css` | `generated/theme.css` (생성물)  |
| `@tokens/css/fonts.css` | `fonts/maruburi.css` (마루부리) |

## src/ 구조

| 파일            | 역할                                                  |
| --------------- | ----------------------------------------------------- |
| `typography.ts` | 폰트 패밀리·크기·굵기                                 |
| `spacing.ts`    | 간격(spacing)·반경(radius)·컨테이너(container) 스케일 |
| `shadow.ts`     | 그림자 스케일(sm·md·lg)                               |
| `index.ts`      | 전체 re-export + 통합 `tokens` 객체                   |

`scripts/buildTokens.ts`가 이 소스를 읽어 `generated/theme.css`를 만든다.

## 생성되는 theme.css

```css
:root {
  --font-* / --text-* / --font-weight-* / --spacing-* / --radius-* / --shadow-* / --container-*: /* 단일 값 */;
}

@theme inline {
  --spacing-md: var(--spacing-md); /* 모든 토큰을 같은 이름의 런타임 변수로 매핑 */
  --max-width-md: var(--container-md); /* max-w 가드, 아래 참고 */
}
```

`@theme inline`은 자기 자신을 참조하는 맵이라, 유틸이 런타임 변수를 가리킨다. 앱 `:root`에서 값을 덮어쓰면 유틸에 그대로 반영된다.

### max-w 가드

Tailwind v4는 `max-w-*`를 `--max-width` → `--spacing` → `--container` 순서로 찾는다. spacing과 이름이 겹치는 키(xs~3xl)는 그대로 두면 `max-w-md`가 `--spacing-md`(16px)로 풀린다. 그래서 buildTokens가 겹치는 키마다 `--max-width-*: var(--container-*)`를 만든다. 결과적으로 `max-w-md`는 28rem이다. `w-*`·`min-w-*`는 spacing 값 그대로다(`w-md` = 16px).

## 간격 스케일 두 가지

- **이름 토큰** — `xs` 4px · `sm` 8px · `md` 16px · `lg` 24px · `xl` 32px · `2xl` 48px · `3xl` 64px. `px-lg`, `gap-3xl`처럼 쓴다. hub·soundlab·prairie 등 앱 레이아웃 간격에 쓴다.
- **Tailwind 숫자 스케일** — `p-4` = 1rem. 앱 `src/shared/ui`의 shadcn 계열 컴포넌트와 fe-deep에서 쓴다.

임의 px 값(`p-[13px]` 등)은 쓰지 않는다. `spacing`에 `none` 키를 두지 않는다(`max-w-none`이 0으로 덮인다, `spacing.ts` 주석).

## 서체와 굵기

- `font-sans` = 마루부리(`var(--font-maruburi)`), `font-mono` = Geist Mono(`var(--font-geist-mono)`, 앱이 로드).
- 굵기 토큰은 `normal` 400 · `semibold` 600 · `bold` 700만 있다. 마루부리가 이 세 굵기만 제공한다.
- `font-medium` 등 마루부리에 없는 굵기(thin·extralight·light·medium·extrabold·black)는 `font-mono`와 함께 쓸 때만 허용된다. `pnpm lint`의 디자인 토큰 검사(`scripts/check-architecture.mjs`)가 막는다.

## 토큰 추가·수정

1. `src/`의 해당 파일을 고친다.
2. `pnpm tokens`로 `generated/theme.css`를 다시 만든다. `build`/`dev`는 turbo가 먼저 생성한다.
3. 새 이름은 Tailwind 유틸로 바로 쓸 수 있다(예: `--radius-2xl` → `rounded-2xl`).

모든 앱이 바뀌므로, 앱마다 달라질 수 있는 값은 여기 넣지 않고 그 앱 전역 CSS에 둔다.

## 주의

- `generated/theme.css`는 자동 생성 파일(gitignore)이다 — **직접 수정 금지**.
- `fonts/`의 조각 파일과 `maruburi.css`는 `pnpm --filter @tokens/css fonts`(`scripts/subsetFonts.py`, fonttools·brotli 필요)로 생성한다 — **직접 수정 금지**. 원본은 `fonts/source/`, 라이선스는 `fonts/LICENSE.md`.
