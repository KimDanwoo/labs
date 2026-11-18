# 디자인 기본 룰

> **한 줄**: 공유 디자인 시스템도 공유 토큰도 없다. 앱마다 느낌이 달라서 크기·간격·색·컴포넌트를 모두 앱이 갖는다. 공유하는 건 마루부리 서체와 아래 기본 룰뿐이다.

## 1. 공유하는 것과 앱이 갖는 것

| 구분 | 위치                        | 내용                                                                  |
| ---- | --------------------------- | --------------------------------------------------------------------- |
| 공유 | `@repo/fonts/fonts.css`     | 마루부리 서체(`@font-face`, `--font-maruburi`)                        |
| 앱   | `src/app/styles/theme.css`  | 서체 연결·글자 크기·굵기·간격·반경·그림자·컨테이너 폭(쓰는 앱만)      |
| 앱   | `src/app/styles/colors.css` | 색(라이트·다크 값), 다크 모드 variant, `shadow-glow`처럼 색이 섞인 값 |
| 앱   | `src/shared/ui`             | Button·Card 같은 표시 컴포넌트                                        |

- 다른 앱과 같은 값이나 컴포넌트가 필요하면 복사해서 그 앱에 맞게 고친다. 공유 패키지로 올리지 않는다.
- hub·fe-deep·soundlab·prairie의 `theme.css`와 `colors.css`는 예전 공유 토큰을 복사한 것에서 출발했다. 이제 각 앱이 자유롭게 바꾼다.

### 앱별 현황

| 앱             | 서체                           | 크기·간격       | 색                                            |
| -------------- | ------------------------------ | --------------- | --------------------------------------------- |
| hub            | `fonts.css`                    | 앱 `theme.css`  | `colors.css`                                  |
| fe-deep        | `fonts.css`                    | 앱 `theme.css`  | `colors.css` + `design-system.css` 오버라이드 |
| soundlab       | `fonts.css`                    | 앱 `theme.css`  | `colors.css` + 앱 팔레트(`@theme`)            |
| prairie        | `fonts.css`                    | 앱 `theme.css`  | `colors.css`의 `prairie-*` 팔레트             |
| komorebi       | `fonts.css`                    | 독립(아트 주도) | 독립(아트 주도)                               |
| awesome-sudoku | `fonts.css`                    | Tailwind 기본   | `colors.css` 자체 팔레트                      |
| danwoo-island  | 빌드 때 `fonts/`를 직접 읽는다 | 독립(3D)        | 독립(3D)                                      |

## 2. 기본 룰

### `pnpm lint`가 막는 것

`src/app/styles/theme.css`를 가진 앱(hub·fe-deep·soundlab·prairie)의 `.ts`·`.tsx`에서 `scripts/check-architecture.mjs`의 `validateDesignTokens`가 검사한다.

- **색은 앱 토큰으로만**: Tailwind 기본 팔레트 색 클래스(`bg-blue-500`)와 임의 색 값(`bg-[#...]`, `[oklch(...)]`)을 쓰지 않는다. 새 색은 그 앱의 `colors.css`나 `@theme`에 이름을 붙여 정의한다.
- **굵기는 400·600·700만**: 마루부리가 `font-normal`·`font-semibold`·`font-bold`만 제공한다. 다른 굵기는 `font-mono`와 같은 줄일 때만 허용한다.
- 불가피하면 그 줄이나 윗줄에 `token-exception: 이유` 주석을 남긴다.

### PR 전에 직접 확인하는 것

- **글자 대비**: 본문 글자 4.5:1, 큰 글자(24px 이상, 굵게 19px 이상)·아이콘·입력 테두리 3:1 이상(WCAG 2.2 AA).
- **키보드 포커스**: 포커스된 요소가 눈에 보인다. `outline-none`을 쓰면 `focus-visible` 표시를 따로 준다.
- **누르는 영역**: 버튼·링크는 44×44px을 목표로 하고, 24×24px보다 작게 만들지 않는다(WCAG 2.2 2.5.8).
- **움직임 줄이기**: `prefers-reduced-motion: reduce`에서는 큰 이동·반복 애니메이션을 끈다.
- **다크 모드**: 다크 모드를 지원하는 앱은 라이트·다크를 둘 다 본다.
- **화면 세 개**: 세로 폰·가로 폰·데스크톱에서 가로 스크롤과 잘림이 없는지 본다.
- **간격**: 그 앱의 간격 토큰(`theme.css`가 있으면 `px-lg` 같은 이름)이나 Tailwind 숫자 스케일(`p-4`)을 쓰고, 임의 px(`p-[13px]`)은 쓰지 않는다.
- **화면 문구**: 해요체로 쓴다.

## 3. 서체 수정

- 서체는 [`packages/fonts`](packages/fonts/README.md)에 있다. 바꾸면 모든 앱이 바뀐다.
