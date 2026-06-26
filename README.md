# Danwoo Lab

내가 만든 프로젝트들을 모아 소개하는 포트폴리오 허브 + 작은 실험 앱들을 담는 모노레포입니다.

## 스택

Turborepo · pnpm workspace(catalog) · Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Node 24

## 구조

```
apps/
  hub/                 # 포트폴리오 허브 (Next 앱)
packages/
  tokens/  @tokens/css     # 디자인 토큰 → theme.css 생성
  ui/      @ui/react       # 앱 공용 React 컴포넌트
  config/  @config/tsconfig  # 공유 tsconfig
templates/app/         # 새 앱 스캐폴드 원본
scripts/new-app.mjs    # 새 앱 생성기
```

## 시작하기

Node 24, pnpm 9 필요(`engine-strict`).

```bash
pnpm install
pnpm dev                          # 모든 앱 dev
pnpm --filter hub dev     # hub만 dev
```

http://localhost:3000 에서 확인.

## 자주 쓰는 명령

| 명령                  | 동작                             |
| --------------------- | -------------------------------- |
| `pnpm dev`            | 전체 dev 서버                    |
| `pnpm build`          | 전체 빌드                        |
| `pnpm lint`           | 전체 lint                        |
| `pnpm tokens`         | 디자인 토큰 → `theme.css` 재생성 |
| `pnpm new-app <name>` | 새 앱 스캐폴드 (`apps/<name>`)   |
| `pnpm format`         | Prettier 전체 포맷               |

## 디자인 토큰

색·타이포·간격 토큰은 `packages/tokens/src/*.ts`가 source of truth입니다.
값을 바꾼 뒤 `pnpm tokens`를 실행해 `packages/tokens/generated/theme.css`를 다시 생성하세요.
생성된 CSS는 직접 수정하지 마세요.

## 새 앱 추가

```bash
pnpm new-app my-site      # apps/my-site 생성 (templates/app 복제)
pnpm install
pnpm --filter my-site dev
```
