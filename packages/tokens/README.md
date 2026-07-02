# @tokens/css

모노레포 전체에서 사용하는 디자인 토큰의 **단일 진실 공급원(source of truth)**. TypeScript로 토큰을 정의하고 `theme.css`를 생성한다.

## 사용법

```bash
# theme.css 재생성 (소스 수정 후 반드시 실행)
pnpm tokens
```

```ts
// CSS 변수 사용 예시 (Tailwind 유틸로)
// bg-primary, text-muted, px-lg, rounded-md, shadow-md
import '@tokens/css';
```

## src/ 구조

| 파일 | 역할 |
| --- | --- |
| `palette.ts` | Atomic 팔레트 — gray / indigo / slate / green / red / amber / sky 스케일(50–900) |
| `colors.ts` | Semantic alias — primary / secondary / success / error / warning / info × base·foreground·subtle, light/dark 분리 |
| `typography.ts` | 폰트 크기·행간·폰트 패밀리 |
| `spacing.ts` | 간격 스케일 |
| `shadow.ts` | 그림자 스케일 |
| `index.ts` | 전체 re-export |

## 색상 2-tier 구조

```
atomic (palette.ts)        → semantic (colors.ts)
indigo.800 (#10069f) ─────→ primary.base (light)
gray.100              ─────→ background.subtle (light)
```

Semantic 토큰은 atomic 스텝을 참조하므로 **palette.ts만 수정**하면 테마 전체에 반영된다.

## 주의

- `generated/theme.css`는 자동 생성 파일 — **직접 수정 금지**.
- 색은 반드시 Tailwind 시맨틱 유틸로만 사용하고, 임의 hex 값을 인라인으로 쓰지 않는다.
