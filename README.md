# Danwoo Lab

직접 만든 웹 프로젝트들을 한 저장소에서 만들고 배포하는 모노레포다. 전체 목록은 [lab.danwoo.dev](https://lab.danwoo.dev)에서 볼 수 있다.

---

## 대표 작업

| [![Danwoo Island](apps/hub/public/projects/danwoo-island-card.webp)](https://world.danwoo.dev)                                                                                                                                           | [![Unicorn Rush](apps/hub/public/projects/unicorn-rush-card.webp)](https://prairie.danwoo.dev)                                                                                        |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[Danwoo Island](https://world.danwoo.dev)** · [`apps/danwoo-island`](apps/danwoo-island)                                                                                                                                               | **[Unicorn Rush](https://prairie.danwoo.dev)** · [`apps/prairie`](apps/prairie)                                                                                                       |
| 차를 몰고 열대 섬을 돌아다니는 3D 포트폴리오. Bruno Simon의 `folio-2025` 엔진을 Next.js 16 앱으로 이식하고 엔진 전체를 TypeScript로 옮겼다. 메뉴·모달 등 HTML UI는 React로 렌더하고, 월드 에셋은 고정 커밋에서 받아 Draco 모델로 줄인다. | three.js로 만든 초원을 유니콘을 타고 달리고 나는 3D 플레이그라운드. 잔디는 절차적으로 만든 blade와 GLSL 바람 셰이더로 그리고, 질주·이륙·공중 회전을 직접 만든 비행 역학으로 처리한다. |
| Next.js · three.js · TypeScript                                                                                                                                                                                                          | Next.js · React Three Fiber · GLSL                                                                                                                                                    |
| [![코모레비](apps/hub/public/projects/komorebi-card.webp)](https://komorebi.danwoo.dev)                                                                                                                                                  | [![soundlab](apps/hub/public/projects/soundlab.webp)](https://sound.danwoo.dev)                                                                                                       |
| **[코모레비](https://komorebi.danwoo.dev)** · [`apps/komorebi`](apps/komorebi)                                                                                                                                                           | **[soundlab](https://sound.danwoo.dev)** · [`apps/soundlab`](apps/soundlab)                                                                                                           |
| 여름 시골길을 픽셀 아트로 산책하는 작은 탐험 게임. 2D 배경화 위에 three.js로 선화 캐릭터를 합성하고 장소마다 고정 카메라를 둔다. 바람·물·매미 소리는 Web Audio로 합성한다.                                                               | 직접 만든 노래를 픽셀 파티클 비주얼라이저로 듣는 음악 사이트. 곡마다 주파수 대역·비트 신호를 미리 분석해 WebGL 파티클을 움직이고, 곡 목록은 예약 작업으로 동기화한다.                 |
| Next.js · three.js · Web Audio                                                                                                                                                                                                           | Next.js · WebGL · Jotai                                                                                                                                                               |

## 그 밖의 앱

| 앱                                      | 설명                                    | 주요 스택             | 라이브                                           |
| --------------------------------------- | --------------------------------------- | --------------------- | ------------------------------------------------ |
| Dansoon (별도 비공개 레포)              | 프론트엔드 개발 기록 블로그             | Astro                 | [danwoo.dev](https://danwoo.dev)                 |
| [`fe-deep`](apps/fe-deep)               | 프론트엔드 개념을 깊게 파고든 학습 기록 | Next.js, Markdown     | [fe-deep.danwoo.dev](https://fe-deep.danwoo.dev) |
| [`awesome-sudoku`](apps/awesome-sudoku) | 난이도를 고르는 온라인 스도쿠           | Next.js, Web Worker   | [sudoku.danwoo.dev](https://sudoku.danwoo.dev)   |
| [`hub`](apps/hub)                       | 프로젝트 갤러리                         | Next.js, Tailwind CSS | [lab.danwoo.dev](https://lab.danwoo.dev)         |

---

## 이 저장소를 운영하는 방식

- **의존성 버전은 한 곳에서 관리한다.** 모든 버전은 `pnpm-workspace.yaml`의 `catalog:`에 두고, 앱이 버전을 직접 적으면 `pnpm lint`가 막는다. 의존성 업데이트는 Dependabot이 올린다.
- **앱 내부 구조는 FSD 규칙을 lint로 강제한다.** `app → views → features → entities → shared` 방향만 허용하고, 위반은 `@repo/eslint-config`가 에러로 처리한다.
- **디자인 토큰 밖의 값을 막는다.** 공유 토큰을 쓰는 앱에서 임의 색 값이나 서체에 없는 굵기를 쓰면 `scripts/check-architecture.mjs`가 실패시킨다.
- **배포하는 앱은 모두 CSP와 보안 헤더를 붙인다.** 대부분은 공통 패키지 `@repo/security-headers`를 쓰고, komorebi는 `vercel.json`에 직접 둔다.
- **CI를 통과해야 운영에 반영된다.** `main`은 PR로만 바뀌고, Vercel이 빌드한 배포는 CI가 통과한 뒤에 운영 도메인에 연결된다. 빌드 결과는 Turborepo 원격 캐시로 재사용한다.
- **AI 에이전트와 같은 규칙으로 일한다.** 구조·검증·커밋 규칙을 [AGENTS.md](AGENTS.md)에 두고, 사람과 에이전트 모두 이 문서를 따른다.

## 공유 패키지

| 패키지                      | 이름                     | 역할                                                           |
| --------------------------- | ------------------------ | -------------------------------------------------------------- |
| `packages/tokens`           | `@tokens/css`            | 디자인 토큰(팔레트·시맨틱 컬러·타이포·간격) → `theme.css` 생성 |
| `packages/config`           | `@config/tsconfig`       | 공유 TypeScript 설정 (base / next)                             |
| `packages/eslint-config`    | `@repo/eslint-config`    | 공유 ESLint flat config — Next.js + FSD 경계 강제              |
| `packages/prettier-config`  | `@repo/prettier-config`  | 공유 Prettier 설정                                             |
| `packages/security-headers` | `@repo/security-headers` | 앱 공통 CSP·보안 헤더                                          |

---

## 라이선스

소스 코드는 [MIT 라이선스](LICENSE)를 따른다.

다음은 MIT 적용 대상이 아니다.

- **글과 직접 만든 미디어**: 저장소의 이미지·음원 등 직접 만든 미디어 파일은 별도 표기가 없는 한 저작권자가 모든 권리를 갖는다(All rights reserved).
- **외부에서 가져온 코드·에셋**: 해당 폴더의 라이선스 파일을 따른다.
