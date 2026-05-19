# 청연사주 프로젝트

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
├── hooks/index.ts
├── types/index.ts
└── constants/index.ts
```

**컴포넌트 분리**: View 파일에 컴포넌트를 인라인 선언 금지. 재사용 여부와 무관하게 모든 컴포넌트는 `ui/` 하위 파일로 분리 후 `ui/index.ts`에서 export.

**Barrel**: `ui/index`, `hooks/index`, `types/index`, `constants/index` 단위. 외부 미사용 index.ts 생성 금지.

**Import 순서**: react/next → 외부 패키지 → @app…@shared → 상대경로

## 코드 컨벤션

- ESLint + Prettier (singleQuote, trailingComma: all, printWidth: 80)
- 스크립트: `pnpm lint` / `pnpm format`

## Tailwind 색상

`[var(--xxx)]` 임의값 금지 → `@theme inline` 토큰 사용:

| CSS 변수 | Tailwind 클래스 |
|---|---|
| `--color-background/foreground` | `bg-background` / `text-foreground` |
| `--color-gold` / `--color-gold-bright` | `text-gold` / `bg-gold` / `border-gold` |
| `--color-card-bg` / `--color-card-border` | `bg-card-bg` / `border-card-border` |
| `--color-input-bg` / `--color-muted` / `--color-red` | `bg-input-bg` / `text-muted` / `text-red` |

inline style에서 필요 시: `var(--color-gold)` (Tailwind 테마 변수)
