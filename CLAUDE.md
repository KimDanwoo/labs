# Danwoo Lab

> 내가 만든 프로젝트들을 모아 소개하는 포트폴리오 허브 + 작은 실험 앱들을 담는 **모노레포**.

> **Next.js 16 주의**: 학습 데이터와 다른 breaking change가 있을 수 있음. 코드 작성 전 `node_modules/next/dist/docs/` 확인.

## 스택 & 런타임

- **TurboRepo + pnpm workspace(catalog)** 모노레포
- Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4
- **Node 24 고정**: `engine-strict=true`(`.npmrc`), `.nvmrc`=24, pnpm 9.12.1

## 모노레포 구조

```
apps/
  hub/                # 포트폴리오 허브 (Next 앱). 내부는 FSD(src/).
packages/             # 공유 디자인 시스템 + 공유 설정
  tokens/  @tokens/css            # 디자인 토큰(TS) → theme.css 생성
  ui/      @ui/react              # 앱 공용 표시 컴포넌트(Button/Card/ThemeToggle)
  config/  @danwoo/config         # 공유 tsconfig(base / next)
  eslint-config/  @repo/eslint-config    # 공유 ESLint(flat): next + FSD 경계 강제
  prettier-config/ @repo/prettier-config # 공유 Prettier
templates/app/        # 새 앱 스캐폴드 원본
scripts/new-app.mjs   # 새 앱 생성기
```

## 모노레포 핵심 규칙

1. **의존성 버전은 catalog 단일 관리**: 모든 버전은 `pnpm-workspace.yaml`의 `catalog:`에 두고 각 `package.json`은 `"catalog:"`로 참조. 워크스페이스 간 참조는 `"workspace:*"`. **package.json에 raw 버전을 박지 않는다.** 버전 변경은 catalog 한 곳만 수정 후 `pnpm install`.

2. **디자인 토큰 워크플로**: `packages/tokens/src/*.ts`(palette / colors / typography / spacing / shadow)가 **source of truth**. 수정 후 `pnpm tokens`로 `packages/tokens/generated/theme.css`를 생성한다.
   - **`generated/theme.css`는 AUTO-GENERATED — 직접 수정 금지.**
   - **색은 2-tier**: atomic 팔레트(`palette.ts`의 `themeColors`/`commonColors`, 스케일 50–900) → semantic alias(`colors.ts`, primary/secondary/success/error/warning/info × base·foreground·subtle, light/dark). semantic은 atomic 스텝을 참조한다.
   - 스타일은 토큰 기반 Tailwind 유틸로만: 색 `bg-primary`/`text-muted`, 간격 `px-lg`/`gap-3xl`, 반경 `rounded-md`, 그림자 `shadow-md`/`shadow-glow` 등. **임의 hex/px 매직값 금지.**

3. **새 앱은 스캐폴드로**: 손으로 만들지 말고 `pnpm new-app <name>`(소문자/숫자/하이픈). `templates/app`을 복제하고 `@danwoo/<name>`으로 채운다.

4. **TS 엄격 옵션 준수**(`@danwoo/config`): `verbatimModuleSyntax` → 타입은 `import type`로. `noUncheckedIndexedAccess` → 인덱스 접근 결과는 `undefined` 가능성을 좁힌 뒤 사용. `any` 금지(`unknown`에서 좁히기).

## FSD 아키텍처 (앱 내부)

각 앱은 `apps/<app>/src/` 아래에 FSD로 구성한다. **공유 디자인 시스템(`packages/ui`·`packages/tokens`)이 FSD의 `shared` UI 레이어 역할**을 하므로, 앱의 표시 프리미티브는 `@ui/react`에서 가져오고 앱 `src/shared`에는 그 앱 전용 공용 코드만 둔다.

**레이어 의존성** (단방향, `@repo/eslint-config`의 `fsd.config.mjs` → `eslint-plugin-boundaries`로 **lint 강제**): `app → views → widgets → features → entities → shared`

- 하위 레이어는 상위를 import 불가. cross-import 금지. `packages/ui`·`@tokens/css`는 모든 레이어에서 사용 가능.
- 위반 시 `pnpm lint`가 에러로 막는다(규칙 위반은 빌드 전에 걸린다).

**경로 별칭** (앱 `tsconfig.json`의 `paths`): `@app/` `@views/` `@widgets/` `@features/` `@entities/` `@shared/` → `./src/<layer>/`

**slice 구조**: 메인 뷰 파일은 slice 루트에, 나머지는 `ui/` / `model/{hooks,types,constants,store,services}`로 분리.

```
src/
  app/                       # Next 라우팅(layout/page/globals.css)
  views/home/HomeView.tsx    # 메인 뷰: 위젯 합성
  widgets/project-grid/ui/   # 위젯: 화면 블록
  entities/project/
    model/types/             # 도메인 타입
    model/constants/         # 도메인 데이터/상수
    ui/                      # 도메인 표시 컴포넌트(ProjectCard)
```

**컴포넌트 인라인 선언 금지**: 뷰/위젯 파일에 컴포넌트를 인라인 정의하지 않는다. 모든 컴포넌트는 해당 slice의 `ui/` 하위 파일로 분리 후 `ui/index.ts`에서 export.

**Import 세그먼트 규칙**: import 경로에 `ui`인지 `model`인지가 항상 드러나야 한다. **slice 루트(`@widgets/x`, `@entities/x`) 직접 import 금지.**

- ui 컴포넌트: `from '@widgets/project-grid/ui'`, `from '@entities/project/ui'`, `from '@ui/react'`
- 메인 뷰(폴더 루트 파일): 파일명까지 — `from '@views/home/HomeView'`
- model 하위: `model/types`, `model/constants`, `model/store`, `model/hooks`까지 명시
- slice 루트 통합 `index.ts`는 만들지 않는다(통합 barrel이 없어야 슬라이스 루트 import가 컴파일 에러로 막힌다).

**Import 순서**: `prettier-plugin-organize-imports`가 저장/포맷 시 자동 정렬한다(수동 정렬 불필요, alphabetical). 큰 흐름은 내장 모듈 → 외부 패키지 → 절대경로(`@ui`/`@tokens`/`@app`…`@shared`) → 상대경로 → type import.

## 컴포넌트 분리 원칙

- **부모는 분기·합성, 자식은 구독·실행**: 뷰는 위젯 조합만, 위젯/엔티티 컴포넌트가 필요한 데이터를 직접 가져온다.
- **표시-only 컴포넌트는 표시용 데이터만 props로** 받는다(도메인 상태를 알지 않는다). 예: `Card`/`Button`(`@ui/react`), `ProjectCard`(`project`만 받음).
- **재사용 판단으로 위치 결정**: 여러 앱 공용 → `packages/ui`, 특정 앱 전용 → 그 앱의 적절한 FSD 레이어. 무리한 추상화는 피한다.

## 상태 관리 (도입 시)

현재 hub는 정적이라 전역 상태가 없다. **상태가 필요해지면**: 비동기=React Query · 로컬=useState/useReducer · 전역=꼭 필요할 때만 Jotai. 전역 atom은 `entities/<domain>/model/store/`에 두고 컴포넌트가 직접 구독한다. dispatch/setState 콜백을 prop으로 내려보내지 않는다(prop drilling 금지).

## 코드 컨벤션

- Lint/포맷은 **공유 설정 패키지**로 통일한다. 앱 `eslint.config.mjs`는 `@repo/eslint-config`의 `next.eslint.config.mjs` + `fsd.config.mjs`를 spread하고, 루트 `package.json`의 `"prettier": "@repo/prettier-config"`로 포맷을 맞춘다. Prettier: singleQuote, trailingComma: all, **printWidth 120**, `prettier-plugin-organize-imports`(import 정렬 자동). 앱별로 규칙을 따로 두지 않는다.
- 함수 컴포넌트만(`React.FC` 지양). `type` 우선(확장 필요 시만 `interface`).
- **Enum-like 매직 스트링 금지**: status/variant/step 같은 literal union은 `as const` 객체로 빼고 타입을 거기서 파생. 사용처는 상수 참조만(비교·세팅 둘 다 매직 리터럴 금지).
  ```ts
  const VARIANT = { primary: '...', outline: '...' } as const;
  export type ButtonVariant = keyof typeof VARIANT;
  ```
- 네이밍: 변수/함수 camelCase · 컴포넌트/타입 PascalCase · 상수 SCREAMING_SNAKE_CASE · boolean `is/has/should` · 핸들러 `handleXxx`/`onXxx` · 파일 kebab-case(컴포넌트는 PascalCase) · 훅 `useXxx`.
- 함수 1개=책임 1개. early return 적극. 중첩 3단계 초과 금지.
- URL 라우팅: 화면 전환은 App Router URL 기반으로. atom으로 화면을 전환하지 않는다.
- 금지: 미사용 코드(YAGNI) · 조급한 추상화 · 흐름 설명 주석(자명한 코드로) · 남은 `console.log` · `any`.

## 스크립트 (루트에서)

| 명령                  | 동작                             |
| --------------------- | -------------------------------- |
| `pnpm dev`            | `turbo run dev` — 모든 앱 dev    |
| `pnpm build`          | `turbo run build`                |
| `pnpm lint`           | `turbo run lint`                 |
| `pnpm tokens`         | 디자인 토큰 → `theme.css` 재생성 |
| `pnpm new-app <name>` | 새 앱 스캐폴드                   |
| `pnpm format`         | Prettier 전체 포맷               |

- 특정 앱만: `pnpm --filter @danwoo/hub dev`.

## 응답 스타일 (사용자 선호)

- 응답은 **한국어**. 코드 변경 전 what·why 설명, 후 리뷰 포인트. 더 나은 대안이 있으면 항상 제시.
- **추측 금지**(모르면 "모름"). 보안·성능 이슈는 명시 경고.
