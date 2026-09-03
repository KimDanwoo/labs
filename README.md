# lab

프로젝트들을 모아놓은 허브

---

## 모노레포 특징

| 항목                | 내용                                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| 빌드 오케스트레이션 | TurboRepo — 태스크 병렬 실행·캐시                                       |
| 패키지 매니저       | pnpm workspace, 버전은 `pnpm-workspace.yaml`의 `catalog:`에서 단일 관리 |
| 공유 디자인 시스템  | `@ui/react` (컴포넌트), `@tokens/css` (디자인 토큰 → CSS 변수)          |
| 아키텍처            | 각 앱은 FSD(Feature-Sliced Design)로 구성                               |
| 코드 품질           | `@repo/eslint-config` + `@repo/prettier-config`로 전 앱 통일            |

---

## 앱 카탈로그

| 앱                  | 설명                                                     | 주요 스택                            | 라이브                                           |
| ------------------- | -------------------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| **hub**             | 프로젝트 갤러리 허브                                     | Next.js, Tailwind CSS                | [danwoo.dev](https://danwoo.dev)                 |
| **cheongyeon-saju** | 사주팔자 계산·해석                                       | Next.js                              | [saju.danwoo.dev](https://saju.danwoo.dev)       |
| **soundlab**        | 내 노래를 듣는 플레이어 + WebGL 픽셀 파티클 비주얼라이저 | Next.js, WebGL, Jotai                | [sound.danwoo.dev](https://sound.danwoo.dev)     |
| **fe-deep**         | 프론트엔드 학습 플랫폼                                   | Next.js, Supabase                    | [fe-deep.danwoo.dev](https://fe-deep.danwoo.dev) |
| **awesome-sudoku**  | 온라인 스도쿠 게임                                       | Next.js, Firebase                    | [sudoku.danwoo.dev](https://sudoku.danwoo.dev)   |
| **dansoon**         | AI 기술 뉴스·베스트셀러 리포트 블로그                    | Astro                                | [log.danwoo.dev](https://log.danwoo.dev)         |
| **prairie**         | 인터랙티브 3D 초원 달리기 씬                             | Next.js, React Three Fiber, three.js | [prairie.danwoo.dev](https://prairie.danwoo.dev) |

`apps/plco`·`apps/gymlog`는 리포에 남아 있지만 완성도가 낮아 카탈로그·허브에서 노출하지 않는다. 고도화 후 재등록한다.

---

## 공유 패키지

| 패키지                     | 이름                    | 역할                                                           |
| -------------------------- | ----------------------- | -------------------------------------------------------------- |
| `packages/tokens`          | `@tokens/css`           | 디자인 토큰(팔레트·시맨틱 컬러·타이포·간격) → `theme.css` 생성 |
| `packages/ui`              | `@ui/react`             | 앱 공용 표시 컴포넌트 (Button, Card, ThemeToggle 등)           |
| `packages/config`          | `@config/tsconfig`      | 공유 TypeScript 설정 (base / next)                             |
| `packages/eslint-config`   | `@repo/eslint-config`   | 공유 ESLint flat config — Next.js + FSD 경계 강제              |
| `packages/prettier-config` | `@repo/prettier-config` | 공유 Prettier 설정                                             |

---

## 시작하기

**요구 사항**

- Node.js 24 (`.nvmrc` 고정, `engine-strict=true`)
- pnpm 9.12.1

```bash
# nvm 사용 시
nvm use

pnpm install
pnpm dev        # 모든 앱 개발 서버 동시 실행
```

---

## 스크립트

| 명령                  | 동작                                                       |
| --------------------- | ---------------------------------------------------------- |
| `pnpm dev`            | 모든 앱 개발 서버 실행 (`turbo run dev`)                   |
| `pnpm build`          | 전체 빌드                                                  |
| `pnpm lint`           | 전체 lint                                                  |
| `pnpm tokens`         | 디자인 토큰 → `packages/tokens/generated/theme.css` 재생성 |
| `pnpm new-app <name>` | `templates/app`을 복제해 새 앱 스캐폴드 생성               |
| `pnpm format`         | Prettier 전체 포맷                                         |

특정 앱만 실행하려면 `--filter`를 쓴다.

```bash
pnpm --filter hub dev
pnpm --filter prairie dev
```
