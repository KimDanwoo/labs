---
title: "디자인 토큰 규칙을 문서 대신 도구가 지키게 만들기: Tailwind v4와 lint"
description: "앱 여러 개가 공유하는 디자인 토큰과 Tailwind v4를 점검했더니, 규칙이 문서와 주석에만 있는 곳에서 화면이 새고 있었어요. max-w-md가 16px로 풀리는 이름 충돌, 서체에 없는 굵기, 대비가 모자란 상태색을 고치고 토큰 생성 단계와 lint가 규칙을 지키게 만든 과정을 정리해요."
publishedAt: "2026-11-08T15:30:00+09:00"
category: "dev"
tags: ["css", "architecture"]
thumbnail: "./thumbnail.jpg"
cover: "./cover.jpg"
draft: false
---

`max-w-sm`을 준 안내문이 폭 8px로 줄어들어 글자가 한 줄에 한두 자씩 세로로 쌓여 있었다. 원인은 Tailwind의 이름 충돌이었고, 이 함정은 토큰 파일 주석에 "이 이름을 `max-w`에 쓰지 말라"고 이미 경고해 둔 것이었다. 주석은 아무것도 막지 못했다.

개인 모노레포에는 앱이 여덟 개 있고, 그중 여섯 개가 디자인 토큰(`theme.css`) 하나를 같이 쓴다. 나머지 둘도 같은 패키지에서 서체만 가져온다. 토큰을 만든 처음 이유는 앱마다 색과 간격이 제각각이어서였지만, 정말 원한 건 사람이 만들든 AI가 만들든 어느 앱의 버튼도 튀지 않는 상태였다. 몇 달 쓰고 점검해 보니 그 규칙은 대부분 문서와 주석에만 있었다. 이 글은 그 규칙을 토큰 생성 단계와 lint로 옮긴 기록이다. [FSD 규칙을 문서 대신 ESLint로 강제한 글](/posts/fsd-eslint-boundaries/)의 디자인 편이라고 봐도 된다.

## 1. 토큰을 어떻게 묶었나

토큰의 원본은 TypeScript다. `palette.ts`, `colors.ts`, `typography.ts`, `spacing.ts`, `shadow.ts`에 색, 간격(`xs` 4px ~ `3xl` 64px), 글자 크기와 굵기, 모서리, 그림자, 컨테이너 폭을 적으면, 빌드 스크립트가 Tailwind v4가 읽는 `theme.css` 하나를 만든다. 원본은 한 곳이고 CSS는 생성물이다. 회사에서 디자이너가 배포하는 토큰 코드와 맞추려고 쓰던 구조를 가져온 것이다.

색 이름은 `primary`, `muted-foreground`, `card`, `border`처럼 평소 익숙하던 역할 이름 규칙을 그대로 썼다. 처음 보는 사람도, 코드를 짜는 AI도 이름만 보고 쓰임새를 짐작할 수 있어서다.

생성된 CSS의 뼈대는 세 덩어리다(뒤에 기본 테두리 색을 정하는 `@layer base`가 하나 더 붙는다).

```css
@custom-variant dark (&:where(.dark, .dark *));

:root {
  color-scheme: light;
  --brand-hue: 240;
  --brand-chroma: 0.8;
  --color-primary: oklch(0.48 calc(0.20 * var(--brand-chroma)) var(--brand-hue));
  --spacing-md: 16px;
  --container-md: 28rem;
  /* … */
}

.dark {
  color-scheme: dark;
  --color-primary: oklch(0.66 calc(0.16 * var(--brand-chroma)) var(--brand-hue));
  /* 다크에서 달라지는 색만 */
}

@theme inline {
  --color-primary: var(--color-primary);
  --spacing-md: var(--spacing-md);
  /* … */
}
```

`@theme inline`의 `--color-primary: var(--color-primary)`는 자기 자신을 가리키는 순환처럼 보인다. 하지만 `inline`이 붙으면 Tailwind는 이 줄로 변수를 선언하지 않고, 유틸리티를 만들 때 오른쪽 값을 그대로 옮겨 적는 데만 쓴다. 그래서 `bg-primary`는 `background-color: var(--color-primary)`가 되고, 그 변수의 실제 값은 위의 `:root`와 `.dark`가 정한다. 값이 런타임 변수에 있으니 다크 모드로 바꾸거나 앱이 `--brand-hue`를 덮어써도 다시 빌드하지 않고 바로 반영된다.

## 2. 점검: 규칙이 새는 곳

점검은 토큰 우회, 다크 모드, Tailwind 이름 충돌, 앱별 이탈, 공유 UI, 토큰 자체, 문서의 일곱 관점으로 나눠 했다. 관점마다 AI 에이전트 하나가 문제를 찾고 다른 에이전트가 반박하게 했고, 글에 쓴 것은 다시 직접 확인했다. 여기서는 그중 "규칙은 있는데 지켜지지 않는" 네 가지만 다룬다.

### `max-w-md`가 16px이 된다

Tailwind v4는 `max-w-md`의 `md`를 테마 변수 세 곳에서 순서대로 찾는다. `--max-width-md`, `--spacing-md`, `--container-md` 순이고, 처음 찾은 곳에서 멈춘다. 우리는 `--max-width-*`를 정의하지 않았고 간격 토큰에 `md`가 있으니, 세 번째인 컨테이너 폭(28rem)까지 가지 못하고 간격 16px에서 멈춘다.

```css
/* 고치기 전 생성 결과 */
.max-w-md {
  max-width: var(--spacing-md); /* 16px */
}
```

토큰 파일에는 처음부터 "겹치는 이름을 `max-w`에 쓰지 말라"는 주석이 있었다. 그런데도 2026년 7월에는 간격에 `none` 키를 뒀다가 `max-w-none`이 0이 되어 폭이 통째로 무너졌고, 그때는 `none` 키를 지우고 "`none` 키 금지" 주석을 하나 더 달았다. 이번 점검에서 무너진 곳이 세 군데 더 나왔다.

- 3D 장면을 불러오지 못할 때 뜨는 안내문이 `max-w-sm` = 8px이 되어 글자가 세로로 쌓였다.
- 계정 설정의 음성 선택 상자가 `max-w-xs` = 4px이 되어 빈 박스가 됐다.
- 새 앱을 만드는 스캐폴드 템플릿의 첫 화면이 `max-w-3xl` = 64px이었다. 새 앱마다 깨진 화면으로 시작한 셈이다.

![접힌 나무 자 옆에서 놋쇠 집게 사이에 좁은 종이 띠가 끼어 있고, 그 옆에 넓은 종이가 비어 있다](./ruler.jpg)

### 서체에 없는 굵기

공통 서체 마루부리는 400, 600, 700 세 굵기만 있다. 그런데 토큰에는 `medium`(500)이 있었고, 코드에는 `font-medium`이 110곳 있었다. 그중 108곳이 마루부리 위였다. 브라우저는 없는 500을 400으로 그린다. `font-medium`을 쓴 사람은 "조금 굵게"를 원했겠지만, 화면에서는 108곳 모두 보통 굵기와 똑같았다. 800인 `font-extrabold`도 두 곳 있었는데, 역시 700으로 그려지고 있었다.

### 문서에만 있는 색 규칙

AGENTS.md에는 "스타일은 토큰 기반 Tailwind 유틸로만", "임의 hex/px 매직값 금지"라고 적혀 있었다. AI도 읽는 규칙이다. 그런데 이걸 검사하는 장치가 없었다.

문서와 코드가 어긋난 곳도 있었다. 토큰 이름을 역할 기반으로 정리하면서 `muted`는 표면색이 됐고, 흐린 글자는 `muted-foreground`로 옮겨 갔다. 하지만 `muted`가 글자색이던 시절에 만든 스캐폴드 템플릿은 여전히 설명문에 `text-muted`를 쓰고 있었다. 배경 대비가 1.12:1로, 거의 보이지 않았다. AGENTS.md의 예시도 `text-muted`를 글자색처럼 적어 두고 있었다.

학습 앱은 난이도 배지에 상태 토큰 대신 Tailwind 기본 팔레트(`text-yellow-500` 등)를 쓰고 있었다. 라이트 모드에서 초록·노랑 배지 글자 대비는 1.8~2.2:1, 빨강 배지도 3.2:1이었다. 공유 상태색도 넉넉하지 않았다. 상태색 글자를 같은 계열의 연한 배경 위에 올리면 3.7~3.9:1로, WCAG AA 기준인 4.5:1에 못 미쳤다.

### 앱 전용 색이 공유 토큰에 섞였다

3D 초원 앱의 장면 색 세 개가 공유 `colors.ts`에 들어 있었다. 그래서 이 색이 다른 모든 앱의 CSS에도 실렸다. 블로그는 반대로, 카테고리 색으로 공유 상태색(info, warning, success)을 빌려 쓰고 있었다. 이 결합은 뒤에서 실제로 문제를 일으켰다.

## 3. 고친 것

문서에 적힌 규칙 중 기계가 확인할 수 있는 건 기계에 맡겼다.

### 이름 충돌은 생성 단계에서 막는다

`max-w-*`가 가장 먼저 보는 `--max-width`를 토큰 빌드가 직접 채우게 했다. 간격과 이름이 겹치는 컨테이너 키에만 `--max-width-*`를 만들고 컨테이너 값을 연결한다.

```ts
// packages/tokens/scripts/buildTokens.ts
function buildMaxWidthGuard() {
  return Object.keys(container)
    .filter((name) => name in spacing)
    .map((name) => `--max-width-${name}: var(--container-${name});`);
}
```

이제 `max-w-md`는 28rem이다. 무너져 있던 세 곳은 화면 코드를 한 줄도 바꾸지 않고 고쳐졌다. 겹치는 키는 빌드할 때마다 다시 계산하니, 나중에 간격과 컨테이너에 같은 이름이 새로 생겨도 주석 없이 막힌다.

대신 일관성 하나는 포기했다. `w-md`와 `min-w-md`는 간격 값(16px)으로 쓰는 곳이 있어서 그대로 뒀다. 그래서 같은 `md`가 `max-w`에서는 28rem, `w`와 `min-w`에서는 16px이다.

### 굵기는 서체가 가진 것만

토큰에서 `medium`을 빼고 굵기를 400, 600, 700 세 개로 맞췄다. 코드의 `font-medium` 108곳은 지우지 않고 `font-normal`로 바꿨다. 그냥 지우면 굵은 부모 안에 있던 글자가 부모 굵기를 물려받아 화면이 바뀌기 때문이다. `font-normal`로 바꾸면 지금 화면과 정확히 같다. 고정폭 서체(Geist Mono, IBM Plex Mono)는 500을 실제로 갖고 있어서, 거기에 붙은 두 곳만 남겼다. `font-extrabold`도 `font-bold`로 바꿨다.

### 상태색은 대비 기준으로

success, warning, info의 라이트 값을 팔레트에서 한 단계씩 진하게 옮겼다. error는 이미 기준을 넘고 있어서 그대로 뒀다.

| 상태 | 연한 배경 위 대비(전) | 연한 배경 위 대비(후) |
| --- | --- | --- |
| success | 3.90:1 | 5.51:1 |
| warning | 3.75:1 | 5.69:1 |
| info | 3.74:1 | 5.31:1 |

학습 앱의 배지는 공유 Badge의 상태 변형으로 옮겼다. 연한 배경의 `error` 변형이 없어서 하나 추가했다. AGENTS.md와 스캐폴드 템플릿의 `text-muted`는 `text-muted-foreground`로 고쳤다. 다만 `text-muted`를 글자색으로 잘못 쓰는 실수는 지금 검사로는 잡지 못해서, 이 부분은 아직 문서에 기대고 있다.

### 앱 전용 색은 그 앱이 갖는다

규칙을 하나 정했다. 상태나 역할이 아닌 색, 즉 장식색이나 카테고리색은 공유 토큰에 넣지 않고 그 앱의 전역 CSS에 토큰으로 둔다. 3D 초원 앱의 장면 색은 그 앱의 `@theme`으로 옮겼다. 학습 앱의 트로피·불꽃·히트맵 색도 `streak`, `highlight`, `heat-1~4` 같은 앱 토큰이 됐다. 값은 모두 그대로라 화면은 바뀌지 않았다.

### lint가 지킨다

모노레포에는 원래 구조 검사 스크립트가 있다. catalog 버전, TypeScript 엄격 옵션, `any`, 순환 참조를 보는 스크립트다. 여기에 같은 모양의 함수 하나를 더했다.

```js
// scripts/check-architecture.mjs (발췌)
export function validateDesignTokens(text) {
  const problems = [];
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    if (TOKEN_EXCEPTION.test(line) || TOKEN_EXCEPTION.test(lines[index - 1] ?? '')) return;
    const at = `${index + 1}행`;
    for (const [match] of line.matchAll(PALETTE_CLASS))
      problems.push(`${at}: 기본 팔레트 ${match} 대신 시맨틱 색 토큰을 쓴다.`);
    for (const [match] of line.matchAll(ARBITRARY_COLOR))
      problems.push(`${at}: 임의 색 값 ${match}… 대신 색 토큰을 쓴다.`);
    const weight = line.match(UNSUPPORTED_WEIGHT)?.[0];
    if (weight && !/\bfont-mono\b/.test(line))
      problems.push(`${at}: 마루부리에 없는 굵기 ${weight} 대신 font-normal·font-semibold·font-bold를 쓴다.`);
  });
  return problems;
}
```

공유 토큰을 가져오는 앱과 공유 UI 패키지에서 세 가지를 막는다. Tailwind 기본 팔레트 색 클래스, `bg-[#f7f8fc]` 같은 임의 색 값, 서체에 없는 굵기다. `pnpm lint`가 이 검사를 먼저 돌리기 때문에 위반하면 lint가 실패한다.

예외가 필요하면 그 줄이나 바로 윗줄에 `token-exception: 이유` 주석을 남긴다. 고정폭 서체만은 스크립트 안에 규칙으로 들어 있어서, 같은 줄에 `font-mono`가 있으면 굵기 검사를 건너뛴다. 그 밖의 예외는 지금 한 줄뿐이다. `font-mono` 클래스를 쓰지 않는 IBM Plex Mono 위의 `font-medium`이다.

![놋쇠 체에 튀는 빨강·파랑 칩 두 개만 걸려 있고, 차분한 톤의 칩들은 쟁반 위에 한 줄로 놓여 있다](./sieve.jpg)

## 4. 다 맞추면 깨지는 것

정리하다 보면 전부 맞추고 싶어진다. 하지만 일부 앱은 일부러 다르다. 픽셀 아트 산책 앱과 3D 초원 앱은 화면 자체가 작품인 독립 디자인 프로젝트라, 공유 팔레트에 맞추면 오히려 망가진다. 스도쿠 앱은 공유 토큰 이전에 만든 자체 팔레트를 쓴다. 세 앱은 문서에 예외로 적고, 색을 공유 팔레트에 맞추지는 않았다. 굵기처럼 모든 앱에 걸리는 규칙만 고쳤다. Tailwind 기본 팔레트를 아예 끄는 방법(`--color-*: initial`)도 이번에는 쓰지 않았다. 예외 앱까지 한꺼번에 깨질 수 있어서, 검사부터 두고 나중에 판단하기로 했다.

그래도 깨진 게 있었다. 작업 단계마다 앱별 CSS를 컴파일해 의도한 줄만 바뀌는지 봤고, 여기서는 문제가 없었다. 마지막에 main과 이 브랜치를 각각 빌드하고 같은 화면을 라이트·다크로 찍어 픽셀 단위로 비교하자 두 가지가 나왔다.

첫째, 포트폴리오 홈의 히어로 글로우와 카드 번호 서체가 달라졌다. 작업하는 사이에 main에 홈 리디자인이 머지됐는데, 그 코드가 내가 쓰는 곳이 없다며 지운 `glow` 토큰과 Geist Mono 서체를 다시 쓰고 있었다. 지울 때는 정말로 쓰는 곳이 없었다. 둘을 되살린 뒤 홈은 main과 픽셀이 똑같아졌다.

둘째, 블로그의 카테고리 색이 진해졌다. 상태색을 대비 기준에 맞게 진하게 바꿨더니, 그 색을 빌려 쓰던 카테고리 점과 배지까지 함께 바뀌었다. 링크 미리보기 이미지를 그리는 코드에는 예전 색이 hex로 복사되어 있어서, 화면과 미리보기 색까지 서로 어긋날 뻔했다. 점검에서 이 결합을 찾아 놓고도, 상태색을 바꾸면 블로그까지 따라 바뀐다는 데까지는 생각이 미치지 못했다. 카테고리는 상태와 쓰임이 다르다. 그래서 앞에서 정한 "앱 전용 색은 그 앱이 갖는다"는 규칙을 블로그에도 적용해, 카테고리 색을 블로그가 직접 갖게 했다.

두 사고 모두 lint와 CSS 비교로는 잡히지 않았다. CSS는 유효했고 규칙도 지켰기 때문이다. 화면을 직접 비교해서야 보였다.

## 5. 남은 것

- **원칙과 실제의 충돌**: 디자인 시스템 문서에는 "그라데이션·큰 글로우 지양"이 있는데, 새 홈은 흐르는 그라데이션 글자와 글로우를 쓴다. 문서를 바꿀지 화면을 바꿀지 아직 정하지 않았다.
- **모션 토큰**: `cubic-bezier(0.16, 1, 0.3, 1)`이 두 앱에 네 번씩 반복된다. 색과 간격처럼 이것도 토큰이 될 수 있다.
- **간격 스케일 두 개**: 앱 레이아웃은 이름 토큰(`px-lg`)을 쓰고, 공유 UI와 학습 앱 내부는 Tailwind 숫자 스케일(`p-4`)을 쓴다. 지금은 둘 다 공식으로 문서에 적어 두었다. `min-w-md`처럼 간격 값으로 풀리는 폭 유틸도 여기에 걸려 있다.
- **화면 비교**: 학습 앱은 로컬에서 DB 연결 없이 빌드할 수 없었고, 3D 앱은 장면이 계속 움직여 스크린샷 비교를 할 수 없었다. 둘은 컴파일된 CSS로만 확인했다. 화면 비교 자체도 아직 손으로 돌린다.

토큰을 처음 만들 때 목표는 튀지 않는 화면이었다. 이번에 규칙을 세 곳에 나눠 맡겼다. 이름 충돌은 토큰 생성 단계가, 색과 굵기는 lint가 막는다. 그래도 규칙을 다 지킨 코드가 화면을 바꾼 일이 두 번 있었고, 그건 화면을 직접 비교해서야 보였다. 기계가 확인할 수 있는 규칙은 기계에 맡기고, 남는 부분은 화면 비교로 메우는 게 지금의 방식이다.

앱 구조 규칙을 lint로 막은 과정은 [FSD 규칙을 문서 대신 ESLint로 강제하기](/posts/fsd-eslint-boundaries/)에 정리했다.
