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

## Tailwind 색상

`[var(--xxx)]` 임의값 금지 → `@theme inline` 토큰 사용:

| CSS 변수                                             | Tailwind 클래스                           |
| ---------------------------------------------------- | ----------------------------------------- |
| `--color-background/foreground`                      | `bg-background` / `text-foreground`       |
| `--color-gold` / `--color-gold-bright`               | `text-gold` / `bg-gold` / `border-gold`   |
| `--color-card-bg` / `--color-card-border`            | `bg-card-bg` / `border-card-border`       |
| `--color-input-bg` / `--color-muted` / `--color-red` | `bg-input-bg` / `text-muted` / `text-red` |

inline style에서 필요 시: `var(--color-gold)` (Tailwind 테마 변수)
