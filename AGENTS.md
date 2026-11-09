# Danwoo Lab

> 내가 만든 프로젝트들을 모아 소개하는 포트폴리오 허브 + 작은 실험 앱들을 담는 **모노레포**.

> **Next.js 16 주의**: 학습 데이터와 다른 breaking change가 있을 수 있음. 코드 작성 전 `apps/<app>/node_modules/next/dist/docs/` 확인.

## 스택 & 런타임

- **TurboRepo + pnpm workspace(catalog)** 모노레포
- Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4
- **Node 24 고정**: `engine-strict=true`(`.npmrc`), `.nvmrc`=24, pnpm 9.12.1

## 모노레포 구조

```
apps/
  hub/                # 포트폴리오 허브
  design/             # 공유 디자인 시스템 미리보기
  fe-deep/            # 프론트엔드 학습 플랫폼
  awesome-sudoku/     # 스도쿠
  soundlab/           # 음악 플레이어
  komorebi/           # 픽셀 아트 산책
  prairie/            # 3D 초원
  dansoon/            # Astro 블로그
packages/             # 공유 디자인 시스템 + 공유 설정
  tokens/  @tokens/css            # 디자인 토큰(TS) → theme.css 생성
  ui/      @ui/react              # 앱 공용 표시 컴포넌트(Button/Card/ThemeToggle)
  config/  @config/tsconfig         # 공유 tsconfig(base / next)
  eslint-config/  @repo/eslint-config    # 공유 ESLint(flat): next + FSD 경계 강제
  prettier-config/ @repo/prettier-config # 공유 Prettier
templates/app/        # 새 앱 스캐폴드 원본
scripts/new-app.mjs   # 새 앱 생성기
```

## 모노레포 핵심 규칙

1. **의존성 버전은 catalog 단일 관리**: 모든 버전은 `pnpm-workspace.yaml`의 `catalog:`에 두고 각 `package.json`은 `"catalog:"`로 참조. 워크스페이스 간 참조는 `"workspace:*"`. **package.json에 raw 버전을 박지 않는다.** 버전 변경은 catalog 한 곳만 수정 후 `pnpm install`.

2. **디자인 토큰 워크플로**: `packages/tokens/src/*.ts`(palette / colors / typography / spacing / shadow)가 **source of truth**. 수정 후 `pnpm tokens`로 `packages/tokens/generated/theme.css`를 생성한다.
   - **`generated/theme.css`는 AUTO-GENERATED — 직접 수정 금지.**
   - **색은 2-tier**: atomic 팔레트(`palette.ts`의 `themeColors`/`commonColors`, 스케일 50–900) → semantic alias(`colors.ts`, primary/secondary/muted/accent/card + success/error/warning/info × base·foreground·subtle, light/dark). semantic은 atomic 스텝을 참조한다. `muted`는 표면색이고 흐린 글자는 `muted-foreground`다.
   - 스타일은 토큰 기반 Tailwind 유틸로만: 색 `bg-primary`/`text-muted-foreground`, 간격 `px-lg`/`gap-3xl`, 반경 `rounded-md`, 그림자 `shadow-md`/`shadow-glow` 등. **임의 hex/px 매직값 금지.**
   - **간격은 두 스케일**: 앱 레이아웃은 이름 토큰(`xs` 4px ~ `3xl` 64px, `px-lg`), 공유 UI(`packages/ui`)와 fe-deep 내부는 Tailwind 숫자 스케일(`p-4` = 1rem)을 쓴다. `max-w-md` 같은 폭 유틸은 컨테이너 값(28rem)으로 생성된다.
   - **굵기는 `font-normal`·`font-semibold`·`font-bold`만**: 공통 서체 마루부리가 400·600·700만 제공한다. `font-medium` 등은 500을 가진 고정폭 서체(`font-mono`)에만 쓴다.
   - **앱 전용 색은 그 앱의 `@theme`에**: 상태·역할이 아닌 색(장식색, 카테고리색 등)은 공유 토큰에 넣지 않고 앱 전역 CSS에 토큰으로 정의해 쓴다. 상태색을 다른 의미로 빌려 쓰지 않는다.
   - **예외 앱**: komorebi·prairie는 독립 디자인 프로젝트, awesome-sudoku는 자체 팔레트다(공유 색 토큰 미적용).
   - **`pnpm lint`가 강제한다**(`check-architecture.mjs`의 `validateDesignTokens`): 공유 토큰을 쓰는 앱과 `packages/ui`에서 기본 팔레트 색 클래스, 임의 색 값(`bg-[#...]`), 서체에 없는 굵기를 막는다. 불가피하면 그 줄이나 윗줄에 `token-exception: 이유` 주석을 남긴다.

3. **새 앱은 스캐폴드로**: 손으로 만들지 말고 `pnpm new-app <name>`(소문자/숫자/하이픈). `templates/app`을 복제하고 `<name>`으로 채운다.

4. **TS 엄격 옵션 준수**(`@config/tsconfig`): `verbatimModuleSyntax` → 타입은 `import type`로. `noUncheckedIndexedAccess` → 인덱스 접근 결과는 `undefined` 가능성을 좁힌 뒤 사용. `any` 금지(`unknown`에서 좁히기).

## FSD 아키텍처 (앱 내부)

각 앱은 `apps/<app>/src/` 아래에 FSD로 구성한다. **공유 디자인 시스템(`packages/ui`·`packages/tokens`)이 FSD의 `shared` UI 레이어 역할**을 하므로, 앱의 표시 프리미티브는 `@ui/react`에서 가져오고 앱 `src/shared`에는 그 앱 전용 공용 코드만 둔다.

**Next 라우팅과 FSD `app` 레이어는 분리한다 (합치기 금지).**

- **`apps/<app>/app/`** (= `src/` **밖**): Next 라우팅 진입점. `layout.tsx`/`page.tsx`/`route.ts` + 파일 기반 메타데이터(`icon.*`/`opengraph-image.*` 등)만 둔다. **얇게** — 화면은 `_pages`, 전역 setup은 `src/_app`에 위임한다.
- **`apps/<app>/src/_app/`** (= FSD `app` 레이어, **라우팅 아님**): `providers/`(전역 프로바이더 합성 루트), `globals.css`(전역 스타일) 등 앱 전역 setup. 라우팅 파일(page/layout)을 여기에 두지 않는다.
- 루트 `app/layout.tsx`는 전역 스타일·프로바이더를 `@app`에서 가져온다: `import '@app/globals.css'` + `import { AppProviders } from '@app/providers'`. Next가 라우팅 위치를 강제해도 `src/_app`을 라우팅으로 쓰지 않는다.

**레이어 의존성** (단방향, `@repo/eslint-config`의 `fsd.config.mjs` → `eslint-plugin-boundaries`로 **lint 강제**): `app → pages → widgets → features → entities → shared`

- 하위 레이어는 상위를 import 불가. cross-import 금지. `packages/ui`·`@tokens/css`는 모든 레이어에서 사용 가능.
- 위반 시 `pnpm lint`가 에러로 막는다. 구조 규칙을 `eslint-disable`로 우회하지 않는다. 같은 슬라이스 내부 참조는 허용하고, 같은 레이어의 다른 슬라이스 참조는 금지한다.

**경로 별칭** (앱 `tsconfig.json`의 `paths`): `@app/` `@pages/` `@widgets/` `@features/` `@entities/` `@shared/` → `./src/<layer>/`(`@app`·`@pages`만 `./src/_app`·`./src/_pages`). `@app/`은 **FSD app 레이어(`src/_app/`)**를 가리킨다 — 루트 라우팅 `app/`은 Next 진입점이라 별칭이 없다.

**순수 계산·그래픽 코드**: `lib/`는 알고리즘·그래픽 구현을 둔다. React 컴포넌트·훅·전역 atom 정의를 lib에 숨기지 않는다.

**서버 경계**: 파일시스템·서버 전용 데이터 로딩은 `model/server/`, Server Action은 `model/actions/`에 둔다. 서버 전용 모듈은 슬라이스의 `index.server.ts`로만 공개하고 `index.ts`에서 재수출하지 않는다. 클라이언트가 호출하는 Server Action(`'use server'`)은 `index.ts`로 공개해도 된다.

**slice 구조**: 슬라이스 루트에는 공개 API(`index.ts`, 필요하면 `index.server.ts`)만 둔다. 코드는 `ui/` / `model/{hooks,types,constants,store,services,server,actions}` / `lib/`에 둔다(공식 세그먼트 `api/`·`config/`도 허용). 메인 뷰도 `ui/`에 둔다.

```
apps/<app>/
  app/                       # Next 라우팅 진입점(src 밖): layout/page/route + 메타데이터 파일. 얇게.
  src/
    _app/                    # FSD app 레이어(라우팅 아님): providers/, globals.css 등 전역 setup
    _pages/home/
      index.ts               # 공개 API: 밖에서 쓰는 것만 명시적으로 재수출
      ui/HomeView.tsx        # 메인 뷰: 위젯 합성
    widgets/project-grid/    # 위젯: 화면 블록(index.ts + ui/)
    entities/project/
      index.ts
      model/types/project.ts       # 도메인 타입
      model/constants/projects.ts  # 도메인 데이터/상수
      ui/ProjectCard.tsx           # 도메인 표시 컴포넌트
```

**컴포넌트 인라인 선언 금지**: 모든 앱의 뷰·위젯·기능·엔티티 파일은 컴포넌트당 파일 하나를 사용한다. 컴포넌트 이름과 파일명을 일치시킨다. 모든 컴포넌트는 해당 slice의 `ui/` 하위 파일로 분리한다. 슬라이스 밖에서 쓰는 컴포넌트만 슬라이스 루트 `index.ts`에서 재수출한다.

**공개 API 규칙** (`fsd.config.mjs`의 `fsd/public-api`로 **lint 강제**, 루트 `app/`의 라우팅 파일도 대상): 공식 FSD의 Public API 방식을 따른다.

- 슬라이스 **밖**에서는 공개 API만 import한다: `from '@entities/project'`, 서버 전용은 `from '@pages/study/index.server'`. 내부 파일(`@entities/project/ui/...`)을 직접 가져오지 않는다.
- 슬라이스 **안**에서는 구현 파일을 상대경로로 가져온다(`../model/types/project`). 자기 슬라이스의 공개 API를 import하지 않는다(순환 참조 방지).
- `index.ts`는 밖에서 실제로 쓰는 것만 명시적으로 재수출한다. `export *` 금지, 타입은 `export type { ... }`.
- 세그먼트 안에는 `index.ts`(배럴)를 두지 않는다. `shared`는 슬라이스가 없으므로 기존 세그먼트 배럴을 유지한다.
- 테스트(`__tests__`, `*.test.*`, `*.spec.*`)는 대상 내부 파일을 직접 import할 수 있다.

**Import 순서**: `prettier-plugin-organize-imports`가 저장/포맷 시 자동 정렬한다(수동 정렬 불필요, alphabetical). 큰 흐름은 내장 모듈 → 외부 패키지 → 절대경로(`@ui`/`@tokens`/`@app`…`@shared`) → 상대경로 → type import.

## 컴포넌트 분리 원칙

- **부모는 분기·합성, 자식은 구독·실행**: 뷰는 위젯 조합만, 위젯/엔티티 컴포넌트가 필요한 데이터를 직접 가져온다.
- **표시-only 컴포넌트는 표시용 데이터만 props로** 받는다(도메인 상태를 알지 않는다). 예: `Card`/`Button`(`@ui/react`), `ProjectCard`(`project`만 받음).
- **재사용 판단으로 위치 결정**: 여러 앱 공용 → `packages/ui`, 특정 앱 전용 → 그 앱의 적절한 FSD 레이어. 무리한 추상화는 피한다.

## 상태 관리 (도입 시)

**상태가 필요해지면**: 비동기=React Query · 로컬=useState/useReducer · 전역=꼭 필요할 때만 Jotai. 전역 atom은 쓰는 슬라이스의 `model/store/`에 두고, 여러 슬라이스가 쓰게 되면 `entities/<domain>/model/store/`로 내린다. 컴포넌트가 직접 구독한다. dispatch/setState 콜백을 prop으로 내려보내지 않는다(prop drilling 금지).

## 코드 컨벤션

- Lint/포맷은 **공유 설정 패키지**로 통일한다. 앱 `eslint.config.mjs`는 `@repo/eslint-config`의 `next.eslint.config.mjs` + `fsd.config.mjs`를 spread하고, 루트 `package.json`의 `"prettier": "@repo/prettier-config"`로 포맷을 맞춘다. Prettier: singleQuote, trailingComma: all, **printWidth 120**, `prettier-plugin-organize-imports`(import 정렬 자동). 앱별로 규칙을 따로 두지 않는다.
  - **예외 — `dansoon`(Astro 앱)**: next 기반 공유 eslint·FSD는 프레임워크가 달라 적용하지 않는다. lint는 `astro check`에 맡기고, **포맷만 공유 규칙을 따른다** — 로컬 `prettier.config.cjs`가 `@repo/prettier-config`를 확장하고 `.astro` 파싱용 `prettier-plugin-astro`만 추가한다. Astro 앱이 dansoon 하나뿐이라 공유 eslint 프리셋은 만들지 않는다(YAGNI).
- 함수 컴포넌트만(`React.FC` 지양). `type` 우선(확장 필요 시만 `interface`).
- **Enum-like 매직 스트링 금지**: status/variant/step 같은 literal union은 `as const` 객체로 빼고 타입을 거기서 파생. 사용처는 상수 참조만(비교·세팅 둘 다 매직 리터럴 금지).
  ```ts
  const VARIANT = { primary: '...', outline: '...' } as const;
  export type ButtonVariant = keyof typeof VARIANT;
  ```
- 네이밍: 변수/함수 camelCase · 컴포넌트/타입 PascalCase · 상수 SCREAMING_SNAKE_CASE · boolean `is/has/should` · 핸들러 `handleXxx`/`onXxx` · 파일: 비컴포넌트 camelCase·컴포넌트 PascalCase · 디렉토리 kebab-case · 훅 `useXxx`.
- 함수 1개=책임 1개. early return 적극. 중첩 3단계 초과 금지.
- URL 라우팅: 화면 전환은 App Router URL 기반으로. atom으로 화면을 전환하지 않는다.
- 금지: 미사용 코드(YAGNI) · 조급한 추상화 · 흐름 설명 주석(자명한 코드로) · 남은 `console.log` · `any`.

## 커밋 컨벤션

Conventional Commits + 한국어. 형식: `type(scope): 설명`. (`/commit` 슬래시 커맨드가 이 규칙대로 커밋한다.)

- **type**: `feat`(기능) · `fix`(버그) · `refactor`(동작 불변 구조 개선) · `chore`(빌드·설정·의존성) · `docs`(문서) · `style`(포맷 등 비로직) · `test`(테스트).
- **scope**: 앱/패키지 이름(`soundlab`·`komorebi`·`hub`·`dansoon`·`tokens`·`ui` 등). repo 전역이면 생략.
- **설명**: 한국어·명령형·간결. 무엇을 왜 했는지. 부연이 필요하면 `— 이유/절충`으로 덧붙인다(예: `feat(soundlab): 곡 공유 링크에 재생 위치 포함`).
- **원자적 커밋**: 한 커밋 = 한 논리적 변경. 서로 다른 앱/관심사가 섞이면 나눠서 커밋한다.
- **`main` 직접 커밋 금지**: main에서 작업했더라도 커밋 전 `<type>/<kebab-요약>` 브랜치를 파고(`git switch -c`) 거기에 커밋한다. push는 요청 시에만.
- 제목 끝 마침표 금지. 본문은 필요할 때만. AI 서명 푸터(`Co-Authored-By` 등)는 붙이지 않는다(기존 히스토리와 통일).

## 스크립트 (루트에서)

| 명령                      | 동작                             |
| ------------------------- | -------------------------------- |
| `pnpm dev`                | `turbo run dev` — 모든 앱 dev    |
| `pnpm build`              | `turbo run build`                |
| `pnpm lint`               | 구조 검사 + `turbo run lint`     |
| `pnpm check:architecture` | 워크스페이스·템플릿 구조 검사    |
| `pnpm typecheck`          | 전체 타입 검사                   |
| `pnpm test`               | 공유 규칙·앱별 회귀 테스트       |
| `pnpm tokens`             | 디자인 토큰 → `theme.css` 재생성 |
| `pnpm new-app <name>`     | 새 앱 스캐폴드                   |
| `pnpm format`             | Prettier 전체 포맷               |

- 특정 앱만: `pnpm --filter hub dev`.
- 앱 전용 검증은 앱별 워크플로가 그 앱(또는 `packages/`)이 바뀐 PR에서만 돌린다: prairie 빌드(`prairie.yml`), fe-deep e2e(`fe-deep.yml`). prairie e2e는 GPU 없는 러너에서 실제 화면을 검증하지 못해 자동화하지 않는다(로컬 GPU에서 `pnpm --filter prairie test:e2e`로 수동 실행).
- main은 GitHub ruleset으로 PR로만 반영한다. 로컬 git 훅은 쓰지 않는다.

## 응답 스타일 (사용자 선호)

- 응답은 **한국어**. 코드 변경 전 what·why 설명, 후 리뷰 포인트. 더 나은 대안이 있으면 항상 제시.
- **추측 금지**(모르면 "모름"). 보안·성능 이슈는 명시 경고.

## AI 작업 완료 조건

- 이 파일이 Codex·Claude 등 모든 코딩 에이전트의 공통 규칙이다. 도구별 문서에 다른 아키텍처를 중복 정의하지 않는다.
- `pnpm check:architecture`는 전체 워크스페이스와 새 앱 템플릿의 catalog·경로 별칭·공유 설정·TypeScript 엄격 옵션·`any`·구조 규칙 우회·동적 import를 포함한 순환 참조·서버/클라이언트 경계를 검사한다. `pnpm lint`에서 자동 실행된다.
- 공유 ESLint는 레이어 역참조, 슬라이스 교차 참조, 공개 API 경유, 슬라이스 구조, 컴포넌트 파일, 라우팅 위치, 전역 atom 위치를 검사한다. 공유 규칙 자체에도 회귀 테스트가 있다.
- Server Action의 권한 검사는 화면·미들웨어와 독립적으로 수행한다. 관리자 DB 클라이언트 생성 전에 인증과 관리자 권한을 확인한다.
- `'use client'`·`'use server'`는 모듈 맨 앞의 지시문이어야 한다. import를 그 앞에 추가하지 않는다.
- 파일 이동 후 상대 경로·공개 export·Web Worker URL·라우트 타입·테스트 경로를 함께 확인한다.
- 기본 검증은 `pnpm lint`, `pnpm typecheck`, `pnpm test`다. 동작을 바꿨다면 해당 사용자 흐름의 브라우저 검증도 수행한다. 외부 DB에 쓰는 시드·마이그레이션은 검증 명령으로 실행하지 않는다.
- 자동 검사가 통과한 범위와 실제 브라우저·외부 서비스에서 확인한 범위를 구분해 보고한다. 검증하지 않은 동작을 완벽하다고 표현하지 않는다.
