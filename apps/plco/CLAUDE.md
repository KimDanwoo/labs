# PLCO 프로젝트

> **Next.js 주의**: 학습 데이터와 다른 breaking changes가 있을 수 있음. 코드 작성 전 `node_modules/next/dist/docs/` 확인.

**스택**: Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4 + pnpm

## FSD 2.1 아키텍처

**레이어 의존성** (단방향, ESLint 강제): `app → views → widgets → features → entities → shared`

- cross-import 금지, `shared`는 상위 레이어 import 불가

**경로 별칭**: `@app/` `@views/` `@widgets/` `@features/` `@entities/` `@shared/`

**Views 구조**: 메인 뷰 1개 최상위, 나머지는 `ui/` / `hooks/` / `types/` / `constants/` 분리

```
views/destiny-input/
├── DestinyStepInput.tsx  # 메인 뷰만 index.ts로 export
├── ui/index.ts           # 서브 컴포넌트
├── model/hooks/index.ts
├── model/types/index.ts
├── model/constants/index.ts
├── model/store/index.ts
└── model/services/index.ts
```

**컴포넌트 분리**: View 파일에 컴포넌트를 인라인 선언 금지. 재사용 여부와 무관하게 모든 컴포넌트는 `ui/` 하위 파일로 분리 후 `ui/index.ts`에서 export.

**Barrel**: `ui/index`, `hooks/index`, `types/index`, `constants/index` 단위. 외부 미사용 index.ts 생성 금지.

**Import 순서**: react/next → 외부 패키지 → @app…@shared → 상대경로

**Import 세그먼트**: 세그먼트 하위에 `ui`인지 `model`인지가 import 경로에서 항상 드러나야 한다. **slice 루트(`@widgets/X`, `@views/X`, `@features/X`, `@entities/X`) 직접 import는 금지**.
- ui 안의 컴포넌트: `from '@widgets/status-bar/ui'`, `from '@features/feed/ui'`, `from '@shared/ui'`
- views의 메인 뷰(폴더 루트 파일): 파일명까지 명시 — `from '@views/death/DeathScreen'`, `from '@views/game/GameView'`
- model 하위: `model/hooks`, `model/store`, `model/constants`, `model/types` 까지 명시
- `shared/constants`, `shared/types`처럼 leaf 폴더인 경우는 그대로 한 단만 명시한다.
- slice 루트 `index.ts`(예: `src/widgets/status-bar/index.ts`)와 통합 `model/index.ts`는 만들지 않는다. 통합 barrel이 없어야 슬라이스 루트 import가 컴파일 에러로 막힌다.

**Enum-like 매직 스트링 금지**: status, step, phase, modalType 같은 literal union은 `as const` 객체 상수로 빼고 타입을 거기서 파생한다.
```ts
export const GAME_STATUS = { SELECTING: 'selecting', PLAYING: 'playing', DEAD: 'dead' } as const;
export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];
```
사용처는 `status === GAME_STATUS.DEAD` 처럼 상수 참조만. 비교/세팅 둘 다 매직 리터럴 금지.

## 컴포넌트 분리 원칙

- **부모는 분기·합성, 자식은 구독·실행**: 부모 컴포넌트는 화면 분기와 자식 조합만 담당. 자식은 필요한 atom/액션을 직접 구독/호출한다.
- **표시-only 컴포넌트는 props만 받음**: 토스트, 카드, 아이콘 등 순수 표시 컴포넌트는 `message`/`icon`/`variant` 같은 표시용 데이터만 props로 받는다. 도메인 atom/액션을 알지 않는다.
- **Container vs Presentational 분리**: atom 구독·dismiss timer·navigate 같은 부수효과는 컨테이너 컴포넌트, 시각 표현은 presentational 컴포넌트로 나눈다.
- **재사용 판단으로 레이어 결정**: 여러 view에서 쓸 만하면 `shared/ui/`, 특정 view 전용이면 `views/<view>/ui/`. 무리한 추상화는 피한다.

## 코드 컨벤션

- ESLint + Prettier (singleQuote, trailingComma: all, printWidth: 80)
- 스크립트: `pnpm lint` / `pnpm format`

## 상태 관리 (구독 우선)

**원칙**: 부모가 자식에게 같은 데이터를 prop으로 흘려보내는 패턴(prop drilling)은 금지. 컴포넌트는 필요한 상태/액션을 **직접 구독**한다.

- **라이브러리**: Jotai (`atomWithReducer` + selector atom 패턴)
- **위치**: 도메인 atom은 `entities/<domain>/atoms/`, 외부 노출은 entity barrel(`index.ts`)
- **구독 규칙**:
  - 게이지/카운터처럼 자주 변하는 값은 **개별 selector atom**으로 분리해서 필요한 컴포넌트만 리렌더되도록 한다.
  - 액션은 `useGameActions()` 같은 도메인 훅에서 묶어 노출하고, 컴포넌트는 필요한 액션만 구조분해해서 사용한다.
  - dispatch / setState 콜백을 prop으로 넘기지 않는다. 이벤트 핸들러 안에서 직접 action을 호출한다.
- **prop 허용 케이스**: 진짜 부모-자식 간 표시용 데이터(예: 리스트 item의 `item` 자체, 모달의 `onClose` 등 UI-only state)만 prop으로 전달한다.
- **로컬 상태**: 한 컴포넌트 내에서만 사용되는 UI 상태(애니메이션 phase 등)는 `useState`/`useReducer` 유지.
- **View flow state도 atom으로**: 현재 step, pendingSelection 같은 화면 흐름 상태는 view 전용 `model/store/`에 jotai atom으로 두고, 그 view의 모든 자식이 직접 구독해서 변경한다. 부모-자식 사이에 setter 콜백을 prop으로 넘기지 않는다.

## 서버 상태 / 데이터 패칭 (React Query)

**원칙**: 서버(DB/API)에서 오는 비동기 데이터는 **TanStack Query(React Query)**로 다룬다. 컴포넌트에서 `fetch` + `useEffect` + `useState`로 직접 패칭/로딩/에러를 굴리지 않는다.

- **쿼리/뮤테이션은 도메인별 훅으로 묶는다**: 예) `app/admin/_lib/hooks.ts`의 `useMeetingScenes()`(목록), `useSaveMeetingScene()`/`useDeleteMeetingScene()`(뮤테이션). 컴포넌트는 이 훅만 쓴다.
- **query key는 상수로**: `ADMIN_QUERY_KEYS`처럼 도메인별 키 상수를 두고 문자열 배열을 하드코딩하지 않는다.
- **뮤테이션 성공 시 `invalidateQueries`**로 관련 쿼리를 무효화해 캐시를 갱신한다(수동 refetch·로컬 setState 동기화 금지).
- **로딩/에러 UI는 `isLoading`/`isPending`/`error`**를 그대로 쓴다. 별도 status useState를 만들지 않는다.
- **Provider**는 해당 영역 최상위에 둔다(예: 관리자는 `app/admin/_lib/AdminQueryProvider`).
- **API·라우트 경로는 도메인별 상수로 묶는다**(하드코딩 금지): 예) `ADMIN_API`(서버 API), `ADMIN_ROUTE`(페이지 경로). 매직 스트링 경로 금지.
- **서버 쓰기 보안**: 콘텐츠 쓰기는 서버 라우트(`/api/admin/*`)에서 세션 토큰을 검증(`requireAdmin`)하고 `service_role`로만 수행한다. service_role 키는 절대 클라이언트(`NEXT_PUBLIC_`)에 노출하지 않는다.

## 데이터 동기화

- **충돌 시 자동 머지 우선**: 로컬과 원격(localStorage/supabase) 데이터가 충돌하면 사용자 확인 다이얼로그보다 자연스러운 자동 머지를 우선한다. 예: 슬롯별로 `lastUpdated`가 더 큰 것만 유지, 합집합으로 통합. 자동 머지로 해결 불가능한 진짜 모호한 케이스에만 confirm.

## URL 라우팅

- 페이지/스크린 전환은 URL 기반(App Router)으로. atom으로 화면을 전환하지 않는다.
- 진입 시 URL param(예: `/play/[characterId]`)이 atom을 동기화하는 source of truth.
- localStorage/supabase sync는 도메인 데이터에만 책임진다. "현재 활성 캐릭터" 같은 화면 컨텍스트는 URL에 위임.

## Tailwind 색상

`[var(--xxx)]` 임의값 금지 → `@theme inline` 토큰 사용:

| CSS 변수                                             | Tailwind 클래스                           |
| ---------------------------------------------------- | ----------------------------------------- |
| `--color-background/foreground`                      | `bg-background` / `text-foreground`       |
| `--color-gold` / `--color-gold-bright`               | `text-gold` / `bg-gold` / `border-gold`   |
| `--color-card-bg` / `--color-card-border`            | `bg-card-bg` / `border-card-border`       |
| `--color-input-bg` / `--color-muted` / `--color-red` | `bg-input-bg` / `text-muted` / `text-red` |

inline style에서 필요 시: `var(--color-gold)` (Tailwind 테마 변수)
