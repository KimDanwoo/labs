# Danwoo 디자인 시스템 — 통합 스펙

> **한 줄**: OKLCH **단일 베이스**(`@tokens/css`)를 모든 앱이 공유하고, 앱은 브랜드 hue·채도 정도만 덮어쓴다. 서체는 마루부리 하나로 통일한다.

## 1. 목표 & 원칙

- **하나의 시스템을 돌려쓴다.** 소스 오브 트루스는 `packages/tokens`(→ `@tokens/css`).
- **베이스(공유)**: 중립 스케일·상태색·시맨틱 토큰 _이름 계약_·서체·간격·반경·그림자·`@ui/react` 컴포넌트.
- **스킨(앱별, 최소)**: `--brand-hue`·`--brand-chroma`. 그 밖의 오버라이드는 7절 예외만 허용한다.
- **절제된 모던 유지**: 그라데이션·큰 글로우·grain·shimmer 지양. 강조는 단색 브랜드 1곳.

## 2. 색공간 — OKLCH

- hex 대비 **지각적 균일성**이 높아 스케일이 매끈하고 대비 계산이 안정적.
- L(밝기)·C(채도)를 고정하고 **hue만 회전**하면 같은 시스템 안에서 앱별 브랜드색이 나온다.

## 3. 아키텍처 (2-tier + 스킨)

```text
palette(원자)          →  semantic(역할 alias)    →  skin(앱 오버라이드)
oklch(L C H) 스케일        --color-primary 등           --brand-hue / --brand-chroma
```

- **palette**(`palette.ts`): gray(쿨톤 hue 264 고정)·brand(hue/채도 변수)·green·red·amber·sky, 스텝 50–900 + white/black.
- **semantic**(`colors.ts`): palette 스텝을 역할로 alias(light/dark 2값). codegen 입력.
- **skin**: 앱 전역 CSS가 `@tokens/css/theme.css`를 import한 뒤 `:root`에서 스킨 변수만 덮어씀.

## 4. 브랜드 hue 회전 seam

브랜드 램프는 L만 고정하고 hue·채도를 변수로 둔다:

```text
/* palette.ts 의 brand-600 = primary(light) */
oklch(0.48 calc(0.20 * var(--brand-chroma)) var(--brand-hue))
```

```css
/* 생성물 :root 기본값 */
--brand-hue: 240;
--brand-chroma: 0.8;
```

- primary·accent·ring·glow·shadow-glow가 brand를 참조하므로 hue 회전에 함께 반응한다.
- 중립(gray)은 고정 쿨톤이며 brand hue를 섞지 않는다.

## 5. 시맨틱 토큰 계약 (통일 이름)

이름은 고정, 값은 palette 참조. 이름은 널리 쓰이는 역할 기반 규칙(`primary`·`muted-foreground` 등)을 따른다 — 사람도 AI도 이름만 보고 쓰임새를 짐작할 수 있게.

| 그룹        | 토큰                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| Surface     | `background` `foreground` `card` `card-foreground` `card-border` `popover` `popover-foreground` `muted` `muted-foreground` |
| Brand       | `primary` `primary-foreground` `primary-subtle` `primary-accent`                                                           |
| Accent 표면 | `accent` `accent-foreground` (= 브랜드 연한 틴트 표면)                                                                     |
| Secondary   | `secondary` `secondary-foreground` `secondary-subtle`                                                                      |
| Form/Line   | `border` `input` `ring`                                                                                                    |
| Status      | `success` `error`(=destructive) `warning` `info` + 각 `-foreground` `-subtle`                                              |
| Effect      | `glass` `glass-border` `glow`                                                                                              |
| Toggle      | `toggle-*` (테마 토글 장식색, light=dark 동일값)                                                                           |

- `muted`·`secondary`는 **연한 표면**, 그 위 텍스트는 `-foreground`(`text-muted-foreground`).
- `destructive`는 CSS에서 `error`로 매핑한다(variant API 이름 `destructive`는 유지).
- **상태색 대비**: 라이트의 `success`·`warning`·`info`·`error`는 각자의 `-subtle` 배경 위 글자 대비 4.5:1 이상이다(success green700, warning amber800, info sky700, error red600).
- 공유 토큰은 상태·역할 색만 담는다. 차트·사이드바·읽기 타이포 같은 opt-in은 필요한 앱(fe-deep)이 자기 CSS에 둔다.

## 6. 다크 모드 & 생성물

- `@custom-variant dark (&:where(.dark, .dark *))`.
- `:root`는 `color-scheme: light` + 라이트 색, `.dark`는 `color-scheme: dark` + 다크 색으로 semantic만 재매핑한다(브랜드는 밝은 스텝으로 올리고 foreground 반전). palette는 공유.
- `@theme inline`이 자기참조 맵(`--color-x: var(--color-x)`)이라 유틸이 런타임 변수를 가리킨다 → 앱의 `:root`/`.dark` 오버라이드가 유틸에 그대로 반영된다.
- **max-w 가드**: Tailwind는 `max-w-*`를 `--max-width` → `--spacing` → `--container` 순으로 찾는다. spacing과 이름이 겹치는 키(xs~3xl)는 `--max-width-*: var(--container-*)`를 생성해 막는다 → `max-w-md` = 28rem. `w-*`·`min-w-*`는 spacing 값 그대로(`w-md` = 16px).
- **보더 기본색**: `@layer base { * { border-color: var(--color-border) } }` — 색을 안 준 `border`가 currentColor 대신 border 토큰을 쓴다.

## 7. 스킨 계약 & 예외

| 변수             | 의미                                        | 기본값 |
| ---------------- | ------------------------------------------- | ------ |
| `--brand-hue`    | 브랜드 램프 hue 회전                        | `240`  |
| `--brand-chroma` | 브랜드 램프 채도 배율(낮추면 톤이 가라앉음) | `0.8`  |

- 그 외 공유 토큰 오버라이드는 하지 않는다. 새 시맨틱 색이 필요하면 베이스에 추가한다.
- **앱 전용 색은 그 앱 전역 CSS에**: 상태·역할이 아닌 색(장식색·카테고리색 등)은 공유 토큰에 넣지 않는다. 상태색을 다른 의미로 빌려 쓰지 않는다. 예) soundlab 팔레트(`void`·`paper`·`brass` 등), fe-deep `streak`·`highlight`·`study`·`heat-1..4`, prairie `prairie-*`, dansoon `--category-*`.

### 예외

| 대상           | 내용                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| fe-deep        | `--brand-chroma: 0.6`, 표면색(`background`·`card`·`popover`) 오버라이드, `--radius` 기반 반경 스케일 |
| soundlab       | 단일 다크 테마. 화면 색은 앱 전용 팔레트(`@theme`)로 표현                                            |
| komorebi       | 독립 디자인 프로젝트(아트 주도). `theme.css` 미사용, `fonts.css`만 사용                              |
| prairie        | 독립 디자인 프로젝트(아트 주도). `theme.css`를 import하되 색은 자체 `@theme` 팔레트                  |
| awesome-sudoku | 자체 팔레트. `theme.css`를 import하지 않는다(공유 색 토큰 미적용)                                    |

## 8. 서체 · 간격

- **서체**: `font-sans` = `var(--font-maruburi)`(마루부리), `font-mono` = Geist Mono. `--font-maruburi`·`@font-face`는 `@tokens/css/fonts.css`가 정의하므로 앱은 함께 import한다.
- **굵기**: `font-normal`(400)·`font-semibold`(600)·`font-bold`(700)만 토큰으로 둔다(마루부리가 400·600·700만 제공). `font-medium` 등은 `font-mono`와 함께일 때만 쓴다.
- **간격은 두 스케일**: 앱 레이아웃은 이름 토큰(`xs` 4px ~ `3xl` 64px, `px-lg`·`gap-3xl`), `packages/ui`(shadcn 계열)와 fe-deep 내부는 Tailwind 숫자 스케일(`p-4` = 1rem). 임의 px 매직값은 쓰지 않는다.

## 9. 파이프라인 & 검사

- `packages/tokens/src/{palette,colors,typography,spacing,shadow}.ts`가 유일 소스 → `scripts/buildTokens.ts` → `generated/theme.css`. 로컬은 `pnpm tokens`, 빌드는 turbo가 생성한다.
- **`generated/theme.css`는 AUTO-GENERATED — 직접 수정 금지**(gitignore 대상).
- **`pnpm lint`가 강제한다**(`scripts/check-architecture.mjs`의 `validateDesignTokens`): CSS에서 `@tokens/css/theme.css`를 import하는 워크스페이스와 `packages/ui`의 `.ts`·`.tsx`·`.astro`에서
  - Tailwind 기본 팔레트 색 클래스
  - 임의 색 값(`bg-[#...]`, `[rgb(...)]`, `[oklch(...)]` 등)
  - 마루부리에 없는 굵기(`thin`·`extralight`·`light`·`medium`·`extrabold`·`black`, `font-mono`와 같은 줄이면 허용)
- 불가피하면 그 줄이나 윗줄에 `token-exception: 이유` 주석을 남긴다.
