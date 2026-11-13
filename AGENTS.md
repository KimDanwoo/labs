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
  danwoo-island/      # 포트폴리오 섬 드라이브(folio-2025 포크)
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
   - **예외 앱**: komorebi·prairie·danwoo-island는 독립 디자인 프로젝트, awesome-sudoku는 자체 팔레트다(공유 색 토큰 미적용).
   - **`pnpm lint`가 강제한다**(`check-architecture.mjs`의 `validateDesignTokens`): 공유 토큰을 쓰는 앱과 `packages/ui`에서 기본 팔레트 색 클래스, 임의 색 값(`bg-[#...]`), 서체에 없는 굵기를 막는다. 불가피하면 그 줄이나 윗줄에 `token-exception: 이유` 주석을 남긴다.

3. **새 앱은 스캐폴드로**: 손으로 만들지 말고 `pnpm new-app <name>`(소문자/숫자/하이픈). `templates/app`을 복제하고 `<name>`으로 채운다.

4. **TS 엄격 옵션 준수**(`@config/tsconfig`): `verbatimModuleSyntax` → 타입은 `import type`로. `noUncheckedIndexedAccess` → 인덱스 접근 결과는 `undefined` 가능성을 좁힌 뒤 사용. `any` 금지(`unknown`에서 좁히기).

## FSD 아키텍처 (앱 내부)

각 앱은 `apps/<app>/src/` 아래에 FSD로 구성한다. 기준은 공식 FSD 2.1이다. **공유 디자인 시스템(`packages/ui`·`packages/tokens`)이 FSD의 `shared` UI 레이어 역할**을 하므로, 앱의 표시 프리미티브는 `@ui/react`에서 가져오고 앱 `src/shared`에는 그 앱 전용 공용 코드만 둔다.

**Next 라우팅과 FSD `app` 레이어는 분리한다 (합치기 금지).**

- **`apps/<app>/app/`** (= `src/` **밖**): Next 라우팅 진입점. `layout.tsx`/`page.tsx`/`route.ts` + 파일 기반 메타데이터(`icon.*`/`opengraph-image.*` 등)만 둔다. **얇게** — 화면은 `views`, 전역 setup은 `src/app`에 위임한다.
- **`apps/<app>/src/app/`** (= FSD `app` 레이어, **라우팅 아님**): `providers/`(전역 프로바이더 합성 루트), `globals.css`(전역 스타일), 앱 전체 레이아웃 등 앱 전역 setup. 라우팅 파일(page/layout)을 여기에 두지 않는다.
- FSD `pages` 레이어는 Next와 이름이 겹쳐 `views`로 부른다(공식 권장 `_pages`·`_app` 대신 이 저장소는 `views`·`src/app`으로 통일).

**레이어 의존성** (단방향, `@repo/eslint-config`의 `fsd.config.mjs`로 **lint 강제**): `app → views → features → entities → shared`

- 하위 레이어는 상위를 import 불가. 같은 레이어의 다른 슬라이스 참조 금지. `packages/ui`·`@tokens/css`는 모든 레이어에서 사용 가능.
- **`widgets` 레이어는 쓰지 않는다.** 한 화면 전용 블록은 그 view에, 여러 화면에서 쓰는 동작은 `features`에, 앱 전체 레이아웃은 `src/app`에 둔다.
- 위반 시 `pnpm lint`가 에러로 막는다. 구조 규칙을 `eslint-disable`로 우회하지 않는다.

**어디에 둘지 (pages-first)**: 먼저 쓰는 화면의 `views/<화면>`에 둔다. `features`·`entities`로 내리는 건 **지금 실제로 여러 화면에서 쓸 때만** 한다. 쓰는 곳이 하나뿐인 feature·entity는 그 view로 되돌린다. 화면이 하나뿐인 앱은 `src/app` + `views/<화면>` + (필요하면) `shared`만 가진다.

**경로 별칭** (앱 `tsconfig.json`의 `paths`): `@app/` `@views/` `@features/` `@entities/` `@shared/` → `./src/<layer>/`. `@app/`은 **FSD app 레이어(`src/app/`)**를 가리킨다 — 루트 라우팅 `app/`은 Next 진입점이라 별칭이 없다.

**슬라이스 구조와 공개 API**

```
apps/<app>/
  app/                         # Next 라우팅 진입점(src 밖). 얇게.
  src/
    app/                       # FSD app 레이어: providers/, globals.css, 앱 레이아웃
    views/home/
      index.ts                 # 공개 API — 슬라이스의 유일한 출입구
      index.server.ts          # 서버 전용 코드가 있을 때만
      ui/                      # 컴포넌트 (HomeView.tsx 포함)
      model/                   # 상태·비즈니스 로직·타입 (model/hooks, model/store, model/types …)
      api/                     # 백엔드 통신
      lib/                     # 슬라이스 내부 보조 코드(알고리즘·그래픽)
      config/                  # 설정·상수
    shared/
      ui/ lib/ api/ config/    # 세그먼트만. 도메인 폴더 금지
```

- 세그먼트 이름은 `ui`·`model`·`api`·`lib`·`config`만 쓴다(목적 기준). 필요한 것만 만든다. `hooks`·`types`·`constants`·`services` 같은 종류 기준 이름은 세그먼트 **안**의 하위 폴더로만 쓴다. 슬라이스가 커지면 세그먼트 아래에 도메인 하위 폴더를 둔다(`ui/scene/`, `model/runner/`).
- **밖에서는 슬라이스 루트로만 import한다**: `from '@entities/game'`, 서버 전용은 `from '@views/study/index.server'`. `@entities/game/model/types`처럼 안쪽 경로로 가져오지 않는다.
- **슬라이스 안에서는 상대경로**로 파일을 직접 import한다(`./Card`, `../model/types/game`). 자기 `index.ts`를 거치지 않는다(순환 참조).
- `index.ts`는 **밖에서 실제로 쓰는 것만**, 이름을 하나씩 적어 내보낸다. `export *` 금지. 타입은 `export type` 또는 `type` 한정자.
- **세그먼트 안에 `index.ts`(배럴)를 두지 않는다.** 출입구는 슬라이스 루트 하나다.
- `shared`는 `@shared/<세그먼트>/<항목>`으로 import한다(`@shared/lib/cn`, `@shared/ui/BottomSheet`). `shared/ui`·`shared/lib` 전체를 묶는 `index.ts`는 만들지 않는다(공식 권장 — 하나만 써도 전부 딸려 온다). `shared/api`·`shared/config`는 세그먼트 `index.ts` 하나로 묶어도 된다. shared 안에서도 다른 항목은 진입점으로만 가져온다.
- **테스트는 대상 코드 옆 `__tests__/<대상>.test.ts`(컴포넌트는 `.test.tsx`)에 둔다**(`.mjs` 스크립트·설정 패키지의 테스트는 `.test.mjs`). `scripts/`에 모으지 않는다. 테스트는 대상 파일을 직접 import해도 되고, 같은 슬라이스 안은 상대경로로 가져온다. 여러 테스트가 함께 쓰는 테스트 전용 헬퍼도 `__tests__/` 안에 `.test.` 없는 이름으로 둔다. 브라우저 테스트는 앱 루트 `e2e/*.spec.ts`다.

**서버 경계**: 서버 전용 코드(파일시스템, `next/headers`, `server-only`)와 그것을 쓰는 서버 컴포넌트는 `index.server.ts`로만 내보낸다. 클라이언트가 쓰는 `index.ts`에 섞지 않는다. Server Action은 `'use server'` 모듈(`model/actions/`)에 두고 `index.ts`에서 내보내도 된다. 서버 전용 데이터 로딩은 `model/server/` 또는 `api/`에 둔다.

**컴포넌트 인라인 선언 금지**: `views`·`features`·`entities`의 컴포넌트는 파일 하나에 하나씩, 이름과 파일명을 일치시켜 슬라이스의 `ui/` 세그먼트에 둔다.

**Import 순서**: `prettier-plugin-organize-imports`가 저장/포맷 시 자동 정렬한다(수동 정렬 불필요, alphabetical). 큰 흐름은 내장 모듈 → 외부 패키지 → 절대경로(`@ui`/`@tokens`/`@app`…`@shared`) → 상대경로 → type import.

## 컴포넌트 분리 원칙

- **부모는 분기·합성, 자식은 구독·실행**: 메인 뷰는 블록 조합만, 각 블록 컴포넌트가 필요한 데이터를 직접 가져온다.
- **표시-only 컴포넌트는 표시용 데이터만 props로** 받는다(도메인 상태를 알지 않는다). 예: `Card`/`Button`(`@ui/react`), `ProjectCard`(`project`만 받음).
- **재사용 판단으로 위치 결정**: 여러 앱 공용 → `packages/ui`, 특정 앱 전용 → 그 앱의 적절한 FSD 레이어. 무리한 추상화는 피한다.

## 상태 관리 (도입 시)

**상태가 필요해지면**: 비동기=React Query · 로컬=useState/useReducer · 전역=꼭 필요할 때만 Jotai. 전역 atom은 **쓰는 슬라이스의 `model/`**에 두고(여러 화면이 쓰게 되면 `entities`로 내린다) 컴포넌트가 직접 구독한다. dispatch/setState 콜백을 prop으로 내려보내지 않는다(prop drilling 금지).

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
- 공유 ESLint는 레이어 역참조, 슬라이스 교차 참조, 공개 API 우회, 세그먼트 구조, 컴포넌트 파일, 라우팅 위치, 전역 atom 위치를 검사한다. 공유 규칙 자체에도 회귀 테스트가 있다.
- Server Action의 권한 검사는 화면·미들웨어와 독립적으로 수행한다. 관리자 DB 클라이언트 생성 전에 인증과 관리자 권한을 확인한다.
- `'use client'`·`'use server'`는 모듈 맨 앞의 지시문이어야 한다. import를 그 앞에 추가하지 않는다.
- 파일 이동 후 상대 경로·공개 export·Web Worker URL·라우트 타입·테스트 경로를 함께 확인한다.
- 기본 검증은 `pnpm lint`, `pnpm typecheck`, `pnpm test`다. 동작을 바꿨다면 해당 사용자 흐름의 브라우저 검증도 수행한다. 외부 DB에 쓰는 시드·마이그레이션은 검증 명령으로 실행하지 않는다.
- 자동 검사가 통과한 범위와 실제 브라우저·외부 서비스에서 확인한 범위를 구분해 보고한다. 검증하지 않은 동작을 완벽하다고 표현하지 않는다.
