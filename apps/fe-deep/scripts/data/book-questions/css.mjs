export const CSS = [
  {
    id: 'q-179',
    question: 'CSS란 무엇인가요?',
    answer: `CSS(Cascading Style Sheets)는 HTML로 표현된 문서의 **표현(presentation)**을 기술하는 스타일 시트 언어입니다. 구조(HTML)와 표현(CSS)을 분리해 같은 마크업에 다른 디자인을 입힐 수 있게 합니다.

**이름의 "Cascading"이 핵심**
여러 출처에서 온 스타일 선언이 충돌할 때 **어떤 것을 적용할지 결정하는 폭포수 알고리즘**을 뜻합니다. 우선순위는 순서대로:

1. **출처와 중요도(Origin & Importance)** — 사용자 에이전트 < 사용자 < 작성자 스타일. \`!important\`가 붙으면 이 순서가 역전
2. **캐스케이드 레이어(\`@layer\`)** — 나중에 선언된 레이어가 우선
3. **명시도(Specificity)** — ID(1,0,0) > 클래스·속성·의사클래스(0,1,0) > 요소·의사요소(0,0,1)
4. **소스 순서** — 위 모두 같으면 **나중에 선언된 것**이 이김

**세 가지 기둥**

| 개념 | 내용 |
| --- | --- |
| **Cascade** | 충돌하는 선언 중 승자를 고름 |
| **Specificity** | 선택자의 구체성 점수 |
| **Inheritance** | \`color\`, \`font-*\` 등 일부 속성은 자식으로 전파. \`border\`, \`margin\` 등은 상속되지 않음 |

**적용 방법 3가지**
- 인라인 \`style=""\` — 명시도가 매우 높아(1,0,0,0) 재정의가 어려움. 지양
- \`<style>\` 내부 스타일
- \`<link rel="stylesheet">\` 외부 스타일 — 캐싱 가능. 실무 기본

**최신 CSS는 더 이상 "정적"이 아닙니다**
\`@supports\`(기능 질의), \`@container\`(컨테이너 질의), \`:has()\`(부모 선택), CSS 변수(\`--x\`), \`@layer\`, \`calc()\`, \`clamp()\` 등으로 과거 JS나 전처리기에 의존하던 상당 부분을 CSS 자체가 흡수했습니다.

> 면접 포인트: "CSS에서 우선순위는 어떻게 결정되나요?" → 명시도만 답하면 부족합니다. **출처/중요도 → 레이어 → 명시도 → 순서**의 4단계로 답하세요.`,
    sub_category: 'CSS 기초',
    difficulty: 'easy',
    tags: ['CSS', 'Cascade', '명시도', '상속'],
  },
  {
    id: 'q-180',
    question: '가상 클래스와 가상 요소의 차이점은 무엇인가요?',
    answer: `**한 줄 요약: 가상 클래스는 "존재하는 요소의 특정 상태"를 고르고, 가상 요소는 "존재하지 않는 가상의 요소"를 만들어냅니다.**

| | 가상 클래스 (Pseudo-class) | 가상 요소 (Pseudo-element) |
| --- | --- | --- |
| 표기 | 콜론 1개 \`:hover\` | 콜론 2개 \`::before\` |
| 대상 | **실제 DOM 요소**의 상태·위치 | DOM에 없는 **가상 박스** |
| 개수 | 선택자당 여러 개 가능 | 선택자당 원칙적으로 1개 |
| 접근성 | DOM 요소이므로 정상 인식 | 스크린리더 지원이 불균일 |

**가상 클래스 — 상태/위치 선택**

\`\`\`css
a:hover, a:focus-visible { }        /* 상호작용 상태 */
input:checked, input:disabled { }   /* 폼 상태 */
li:first-child, li:nth-child(2n) { }/* 구조적 위치 */
p:not(.excluded) { }                /* 부정 */
.card:has(> img) { }                /* 자식 조건 (부모 선택) */
\`\`\`

**가상 요소 — 콘텐츠 생성/부분 선택**

\`\`\`css
.badge::before { content: "★"; }    /* content 필수 */
.text::first-line { font-weight: 700; }
input::placeholder { color: #999; }
::selection { background: yellow; }
\`\`\`

**\`::before\`/\`::after\`의 필수 조건**
\`content\` 속성이 없으면 **아예 생성되지 않습니다**. 빈 장식이면 \`content: ""\`를 명시해야 합니다.

**콜론 개수**
CSS3부터 가상 요소는 \`::\`로 구분하도록 바뀌었습니다. \`:before\` 같은 단일 콜론은 하위 호환을 위해 여전히 파싱되지만, **새 코드는 \`::\`를 쓰세요**. \`::backdrop\`, \`::part()\` 같은 최신 가상 요소는 단일 콜론을 지원하지 않습니다.

**적용되지 않는 요소**
\`::before\`/\`::after\`는 **교체 요소(replaced element)**에 동작하지 않습니다 — \`<img>\`, \`<input>\`, \`<br>\`, \`<iframe>\` 등. 내용을 브라우저가 외부에서 가져와 대체하기 때문입니다. \`<img>::after\`가 안 먹는 이유가 이것입니다.

**접근성 주의**
\`content\`로 넣은 텍스트는 브라우저마다 스크린리더 노출이 다릅니다. **의미 있는 정보는 절대 \`::before\`로 넣지 마세요.** 장식은 \`content: ""\`로, 의미는 실제 DOM에.`,
    sub_category: 'CSS 기초',
    difficulty: 'medium',
    tags: ['가상클래스', '가상요소', 'before', 'after', '선택자'],
  },
  {
    id: 'q-181',
    question: '<img> 태그와 CSS background-image 속성은 각각 언제 사용해야 하나요?',
    answer: `**판단 기준은 하나입니다 — 그 이미지가 콘텐츠인가, 장식인가.**

## \`<img>\` — 콘텐츠 이미지

이미지가 사라지면 **정보가 손실되는** 경우.

- 상품 사진, 프로필 사진, 차트, 로고, 본문 삽화
- \`alt\`로 대체 텍스트 제공 → **접근성·SEO**
- 검색 엔진 이미지 색인 대상
- \`srcset\`/\`sizes\`로 반응형, \`loading="lazy"\`로 지연 로딩, \`fetchpriority="high"\`로 우선순위 조절
- \`width\`/\`height\` 명시로 **CLS 방지**
- 우클릭 저장, 이미지 전용 탭 열기 가능

## \`background-image\` — 장식 이미지

이미지가 사라져도 **정보가 온전한** 경우.

- 히어로 배경, 패턴, 그라디언트, 텍스처, 아이콘 스프라이트
- \`background-size: cover/contain\`, \`background-position\`으로 **크롭·정렬 제어가 자유로움**
- \`background-repeat\`로 타일링
- 미디어 쿼리로 브레이크포인트마다 다른 이미지 교체가 쉬움
- **접근성 트리에 노출되지 않음** → 장식용으로는 오히려 올바른 선택

## 비교표

| 항목 | \`<img>\` | \`background-image\` |
| --- | --- | --- |
| 의미 | 콘텐츠 | 장식 |
| 대체 텍스트 | \`alt\` 지원 | 불가 |
| SEO 색인 | ⭕ | ❌ |
| 인쇄 | 기본 출력 | 기본적으로 미출력(브라우저 설정) |
| 크롭·정렬 | \`object-fit\`/\`object-position\` 필요 | \`background-*\`로 내장 |
| 반응형 | \`srcset\`/\`sizes\` | 미디어 쿼리/\`image-set()\` |
| 로딩 우선순위 | 프리로드 스캐너가 조기 발견 → **빠름** | CSSOM 구축 후 발견 → **늦음** |
| 지연 로딩 | \`loading="lazy"\` 네이티브 | 수동 구현 필요 |

## 실무 판단 포인트

**LCP 요소라면 \`<img>\`를 쓰세요.** 브라우저의 프리로드 스캐너는 HTML을 훑으며 \`<img src>\`를 즉시 발견해 다운로드를 시작합니다. 반면 \`background-image\`는 CSS 파싱 → CSSOM 구축 → 해당 요소의 스타일 계산까지 끝나야 발견되므로 로딩이 눈에 띄게 늦습니다. 히어로 배경이 LCP인 사이트에서 흔한 병목입니다.

**두 방식의 장점을 합치려면** \`<img>\` + \`object-fit: cover\`를 쓰면 됩니다. 콘텐츠 이미지의 로딩·접근성 이점을 유지하면서 배경처럼 크롭할 수 있습니다.

\`\`\`css
.hero-img { width: 100%; height: 400px; object-fit: cover; object-position: center; }
\`\`\`

> 콘텐츠지만 alt가 불필요한 순수 장식 \`<img>\`는 \`alt=""\`(빈 문자열)을 주세요. \`alt\` 속성 자체를 생략하면 스크린리더가 파일명을 읽습니다.`,
    sub_category: 'CSS 기초',
    difficulty: 'medium',
    tags: ['img', 'background-image', '접근성', 'LCP', 'object-fit'],
  },
  {
    id: 'q-182',
    question: 'CSS 전처리기란 무엇인가요?',
    answer: `전처리기(Preprocessor)는 **CSS에 없던 문법으로 작성한 뒤 표준 CSS로 컴파일**하는 도구입니다. Sass/SCSS, Less, Stylus가 대표적이며 실무에서는 SCSS가 사실상 표준입니다.

**제공하는 기능**

\`\`\`scss
// 1. 변수
$primary: #3b82f6;

// 2. 중첩 (Nesting)
.card {
  padding: 16px;
  &__title { font-weight: 700; }   // BEM과 궁합
  &:hover { background: #f5f5f5; }
}

// 3. 믹스인 — 인자를 받는 스타일 묶음
@mixin flex-center($dir: row) {
  display: flex; align-items: center; justify-content: center; flex-direction: $dir;
}
.box { @include flex-center(column); }

// 4. 함수·연산
.col { width: math.div(100%, 3); }

// 5. 모듈 분리
@use "variables";
\`\`\`

**후처리기(PostCSS)와의 차이**
- **전처리기** — 비표준 문법 → CSS. *컴파일 전* 단계
- **후처리기(PostCSS)** — 표준 CSS를 입력받아 변환. Autoprefixer(벤더 프리픽스), cssnano(압축), Tailwind가 여기 속함

## 지금도 전처리기가 필요한가 — 실무 판단

**CSS가 흡수한 기능들:**

| 전처리기 기능 | 네이티브 대체 |
| --- | --- |
| 변수 | **CSS Custom Properties** (\`--x\`). 런타임 변경·상속 가능해 오히려 더 강력 |
| 중첩 | **CSS Nesting** (2023년 주요 브라우저 지원) |
| 연산 | \`calc()\`, \`clamp()\`, \`min()\`, \`max()\` |
| 조건 | \`@supports\`, \`@container\` |

**전처리기가 여전히 우위인 것:** 믹스인, 반복문(\`@each\`/\`@for\`), 컴파일 타임 함수, 파일 분할·모듈 시스템.

**결론 — 상황별 선택**
- 새 프로젝트에서 유틸리티 우선(Tailwind)이나 CSS-in-JS를 쓴다면 **전처리기는 불필요**합니다
- 디자인 토큰 기반 시스템이라면 CSS 변수 + PostCSS 조합이 더 적합합니다. 변수를 런타임에 바꿀 수 있어 다크 모드·테마 전환이 훨씬 간단합니다
- 레거시 SCSS 코드베이스거나 복잡한 컴파일 타임 생성(그리드 클래스 자동 생성 등)이 필요하면 SCSS가 유효합니다

> 이 저장소(Danwoo Lab)는 디자인 토큰(TS) → CSS 변수 생성 + Tailwind 방식이라 전처리기를 쓰지 않습니다. 토큰이 source of truth이고 런타임 테마 전환이 필요하기 때문입니다.`,
    sub_category: '방법론',
    difficulty: 'medium',
    tags: ['전처리기', 'Sass', 'SCSS', 'PostCSS', 'CSS 변수'],
  },
  {
    id: 'q-183',
    question: 'display: none, visibility: hidden, opacity: 0의 차이점은 무엇인가요?',
    answer: `셋 다 "안 보이게" 만들지만 **레이아웃·이벤트·접근성에서 전혀 다르게 동작**합니다.

| | \`display: none\` | \`visibility: hidden\` | \`opacity: 0\` |
| --- | --- | --- | --- |
| 공간 차지 | ❌ 레이아웃에서 제거 | ⭕ 공간 유지 | ⭕ 공간 유지 |
| 마우스 이벤트 | ❌ | ❌ | **⭕ 받음** |
| 키보드 포커스 | ❌ | ❌ | **⭕ 잡힘** |
| 스크린리더 | ❌ 읽지 않음 | ❌ 읽지 않음 | **⭕ 읽음** |
| 자식이 되살리기 | ❌ 불가 | ⭕ 자식에 \`visibility: visible\` 가능 | ❌ (누적됨) |
| transition | ❌ 불가(이산값) | ⭕ 가능 | ⭕ 가능 |
| 리렌더 비용 | **Reflow**(레이아웃 재계산) | **Reflow** | **Composite만**(가장 저렴) |

## 각각의 함정

**\`display: none\`**
- 완전히 제거되므로 애니메이션 불가. 페이드아웃 후 사라지게 하려면 \`transition-behavior: allow-discrete\` + \`@starting-style\`(최신) 또는 \`transitionend\` 이벤트에서 전환하는 전통적 방법을 씁니다
- 이미지가 \`display:none\`이어도 **다운로드는 됩니다**(브라우저 구현에 따라 다름). 성능 목적으로 쓸 수 없습니다
- 요소가 사라지므로 \`getBoundingClientRect()\`가 전부 0을 반환합니다

**\`opacity: 0\` — 가장 위험**
투명할 뿐 **여전히 거기 있습니다.** 클릭이 가로채지고, Tab으로 포커스가 들어가 "보이지 않는 곳에 포커스가 갇히는" 접근성 버그가 생깁니다. 숨김 목적이라면 \`pointer-events: none\`과 \`visibility: hidden\`을 함께 걸어야 합니다.

\`\`\`css
/* 페이드 인/아웃 + 접근성·이벤트까지 안전한 조합 */
.modal {
  opacity: 0;
  visibility: hidden;
  transition: opacity .2s ease, visibility 0s .2s;
}
.modal.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity .2s ease, visibility 0s;
}
\`\`\`

## 그 외 숨김 방법

**\`hidden\` 속성 / \`[hidden]\`** — HTML 네이티브. \`display: none\`과 동등하지만 의미가 명확합니다. 단 CSS \`display\`에 쉽게 덮어써집니다.

**시각적으로만 숨기기 (screen-reader only)** — 스크린리더에는 읽히되 화면에서만 감추는 패턴. 아이콘 버튼의 레이블에 필수입니다.

\`\`\`css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
\`\`\`

**\`aria-hidden="true"\`** — 반대 방향. 화면에는 보이되 스크린리더에서만 감춥니다. 장식 아이콘에 사용합니다. **포커스 가능한 요소에 걸면 안 됩니다**(보이는데 안 읽히는 상태가 되어 더 나쁨).

**\`content-visibility: hidden\`** — 렌더링을 건너뛰되 상태를 보존. 긴 목록의 오프스크린 영역 성능 최적화용.

> 면접 포인트: 성능을 물으면 **\`opacity\`/\`transform\`은 컴포지팅 단계만 거치므로 애니메이션에 적합**하고, \`display\`/\`visibility\` 변경은 레이아웃을 다시 계산한다고 답하세요.`,
    sub_category: 'CSS 기초',
    difficulty: 'medium',
    tags: ['display', 'visibility', 'opacity', '접근성', '성능'],
  },
  {
    id: 'q-184',
    question: '요소를 중앙 정렬하는 대표적인 방법은 무엇인가요? (인라인/블록 요소 포함)',
    answer: `대상이 **인라인인지 블록인지**, **수평만인지 수직까지인지**에 따라 방법이 갈립니다.

## 1. 인라인 요소 (텍스트, \`<span>\`, \`<img>\`)

부모에 \`text-align: center\`를 겁니다. 자식이 아니라 **부모에 거는 것**이 포인트입니다.

\`\`\`css
.parent { text-align: center; }   /* 자식 인라인 콘텐츠가 가운데로 */
\`\`\`

수직은 한 줄이면 \`line-height\`를 컨테이너 높이와 같게 주는 방법이 있습니다(단일 행 전용).

## 2. 블록 요소 — 수평만

**너비가 정해진** 블록에 좌우 마진 \`auto\`.

\`\`\`css
.child { width: 600px; margin-inline: auto; }
\`\`\`

너비가 없으면 블록은 부모 폭을 다 채우므로 \`margin: auto\`가 아무 효과가 없습니다. **가장 흔한 실수**입니다.

## 3. Flexbox — 실무 1순위

\`\`\`css
.parent { display: flex; justify-content: center; align-items: center; }
\`\`\`

- 자식 개수·크기 무관
- \`flex-direction\`을 바꿔도 \`justify-content\`(주축) / \`align-items\`(교차축) 관계만 이해하면 그대로 동작
- 자식 하나만 중앙에 두려면 그 자식에 \`margin: auto\` — flex 컨테이너 안에서는 수직으로도 동작합니다

## 4. Grid — 가장 짧음

\`\`\`css
.parent { display: grid; place-items: center; }   /* align-items + justify-items */
\`\`\`

자식이 여럿이면 \`place-content: center\`로 그룹 전체를 중앙에 둡니다.

## 5. absolute + transform — 부모 흐름에서 빼낼 때

\`\`\`css
.parent { position: relative; }
.child  { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
\`\`\`

자식 크기를 몰라도 되는 게 장점입니다(\`translate\` %는 **자기 자신 크기 기준**). 모달·오버레이처럼 문서 흐름에서 분리해야 할 때 씁니다.

## 선택 가이드

| 상황 | 방법 |
| --- | --- |
| 텍스트·인라인 수평 | \`text-align: center\` |
| 고정폭 블록 수평 | \`margin-inline: auto\` |
| 일반적인 수평+수직 | **Flexbox** |
| 한 줄로 끝내고 싶을 때 | \`display: grid; place-items: center\` |
| 흐름에서 뺀 오버레이 | \`absolute + translate(-50%,-50%)\` |
| 테이블 셀 내부 | \`vertical-align: middle\` |

> 논리적 속성을 쓰면 RTL 언어까지 대응됩니다: \`margin: 0 auto\` → \`margin-inline: auto\`.`,
    sub_category: '레이아웃',
    difficulty: 'easy',
    tags: ['중앙정렬', 'flexbox', 'grid', 'margin auto', 'transform'],
  },
  {
    id: 'q-185',
    question: 'vertical-align은 왜 수직 정렬이 잘 안 될까요?',
    answer: `**대부분의 사람이 기대하는 것과 실제 동작이 다르기 때문입니다.** \`vertical-align\`은 "블록 안에서 요소를 수직 중앙에 놓는" 속성이 **아닙니다**.

## 실제 적용 대상은 딱 두 가지

1. **인라인 레벨 요소** (\`inline\`, \`inline-block\`, \`inline-flex\`, 텍스트, 이미지) — **같은 줄 상자(line box) 안에서 형제들끼리의 상대적 정렬**
2. **테이블 셀** (\`display: table-cell\`, \`<td>\`) — 셀 박스 안에서 콘텐츠의 수직 정렬

블록 레벨 요소(\`display: block\`)에 걸면 **아무 일도 일어나지 않습니다.**

\`\`\`css
.box { height: 200px; }
.box > div { vertical-align: middle; }  /* ❌ 무시됨 — 자식이 블록 */
\`\`\`

## \`middle\`의 의미도 다릅니다

\`vertical-align: middle\`은 "줄의 정중앙"이 아니라 **"부모의 베이스라인 + 소문자 x 높이의 절반"** 위치에 요소의 수직 중앙을 맞춥니다. 폰트의 x-height에 의존하므로 폰트가 바뀌면 위치도 미묘하게 달라집니다. 딱 떨어지는 중앙이 나오지 않는 이유입니다.

## 이미지 아래 빈 공간 — 같은 원인의 고전 버그

\`\`\`html
<div style="border:1px solid red"><img src="a.png"></div>
<!-- 이미지 아래 4~5px 틈이 생김 -->
\`\`\`

\`<img>\`는 인라인 요소라 기본값 \`vertical-align: baseline\`으로 베이스라인에 앉습니다. 베이스라인 **아래에는 descender(g, y의 꼬리) 공간**이 예약되어 있어 그만큼 틈이 남습니다.

해결:
\`\`\`css
img { vertical-align: bottom; }  /* 또는 middle, top */
img { display: block; }          /* 인라인에서 빼버리기 */
\`\`\`

## 그래서 뭘 써야 하나

| 목적 | 올바른 방법 |
| --- | --- |
| 컨테이너 안 콘텐츠 수직 중앙 | \`display: flex; align-items: center\` |
| 한 줄로 | \`display: grid; place-items: center\` |
| 텍스트 한 줄만 | \`line-height\` = 컨테이너 높이 |
| 테이블 셀 | \`vertical-align: middle\` ← 여기서는 정상 동작 |
| 아이콘과 텍스트 나란히 정렬 | \`vertical-align: middle\` 또는 flex |

**\`vertical-align\`이 여전히 유용한 곳**은 인라인 컨텍스트입니다 — 텍스트 옆 아이콘 높이 맞추기, 위/아래 첨자(\`super\`/\`sub\`), 테이블 셀 정렬.

> 요약 답변: "\`vertical-align\`은 인라인 요소와 테이블 셀에만 적용되는 속성이고, 블록 요소의 수직 정렬용이 아닙니다. 블록 중앙 정렬은 Flexbox나 Grid를 씁니다."`,
    sub_category: 'CSS 기초',
    difficulty: 'medium',
    tags: ['vertical-align', '베이스라인', '인라인', '수직정렬'],
  },
  {
    id: 'q-186',
    question: 'BEM은 무엇이며, 사용하는 이유를 설명할 수 있나요?',
    answer: `BEM(**B**lock **E**lement **M**odifier)은 CSS 클래스 네이밍 방법론입니다. 전역 네임스페이스인 CSS에서 **이름 충돌과 명시도 전쟁을 규칙으로 해결**하려는 시도입니다.

## 구조

\`\`\`
.block {}                 /* 독립적으로 의미를 갖는 컴포넌트 */
.block__element {}        /* 블록에 종속된 구성 요소 (언더스코어 2개) */
.block--modifier {}       /* 블록/요소의 변형 상태 (하이픈 2개) */
\`\`\`

\`\`\`html
<div class="card card--featured">
  <img class="card__thumbnail" src="...">
  <h3 class="card__title">제목</h3>
  <button class="card__button card__button--disabled">담기</button>
</div>
\`\`\`

\`\`\`css
.card { }
.card--featured { }
.card__title { }
.card__button--disabled { }
\`\`\`

## 해결하는 문제

**1. 명시도 전쟁 종식**
모든 선택자가 **클래스 하나(0,1,0)**로 평평해집니다. \`.header .nav ul li a\` 같은 중첩 선택자가 사라지므로 \`!important\`가 필요 없어집니다.

**2. 이름 충돌 방지**
\`.title\`은 어디서나 충돌하지만 \`.card__title\`은 카드 안에서만 의미를 가집니다.

**3. 마크업만 봐도 구조가 읽힘**
클래스명만 보고 어느 컴포넌트 소속인지, 어떤 상태인지 알 수 있습니다.

**4. DOM 구조와 CSS의 결합 제거**
\`.card > div > p\`는 마크업을 바꾸면 깨지지만 \`.card__desc\`는 어디로 옮겨도 유지됩니다.

## 규칙과 주의점

- **Element의 Element는 만들지 않습니다.** \`.card__body__title\`(❌) → \`.card__title\`(⭕). 중첩 깊이를 클래스명에 반영하면 이름이 폭발합니다
- **Modifier는 단독으로 쓰지 않습니다.** \`class="card--featured"\`만 있으면 안 되고 \`class="card card--featured"\`처럼 기본 클래스와 함께 씁니다
- **Block은 다른 Block을 품을 수 있습니다.** 카드 안의 버튼이 독립 컴포넌트라면 \`.card__button\`이 아니라 \`.button\` Block으로 두고 위치만 \`.card__action\`이 잡습니다

## 단점

- 클래스명이 길고 HTML이 장황해집니다
- \`.block__element--modifier\` 조합이 늘면 관리 비용이 커집니다
- **컴파일 타임 보장이 없습니다** — 오타를 잡아주는 것은 사람뿐

## 오늘날의 대안

| 방식 | 격리 방법 |
| --- | --- |
| **BEM** | 사람이 지키는 네이밍 규칙 |
| **CSS Modules** | 빌드 시 해시 클래스명 자동 생성 → 충돌 원천 차단 |
| **CSS-in-JS** | 런타임/컴파일 타임 스코핑 |
| **Tailwind (Utility-first)** | 클래스 명명 자체를 없앰 |
| **Shadow DOM** | 브라우저 수준 스타일 격리 |

**결론:** 도구가 격리를 보장하는 환경(CSS Modules, Tailwind)에서는 BEM의 핵심 목적이 이미 달성됩니다. 다만 **BEM이 강제하는 "컴포넌트 단위 사고"와 "평평한 명시도"는 여전히 유효한 원칙**이며, SCSS의 \`&__\` 문법과 궁합이 좋아 레거시·디자인 시스템에서 자주 만납니다.

> 면접에서 "BEM을 쓰나요?"에 "안 씁니다"라고만 답하지 말고, **무엇으로 같은 문제를 해결하는지**(CSS Modules/Tailwind)를 함께 말하세요.`,
    sub_category: '방법론',
    difficulty: 'medium',
    tags: ['BEM', '네이밍', '명시도', 'CSS Modules'],
  },
  {
    id: 'q-187',
    question: '@supports 규칙은 언제 사용하나요?',
    answer: `\`@supports\`(Feature Query)는 **브라우저가 특정 CSS 속성·값을 지원하는지 CSS 안에서 직접 검사**하는 조건부 규칙입니다. JS 없이 점진적 향상(progressive enhancement)을 구현합니다.

\`\`\`css
/* 폴백을 먼저, 향상을 나중에 */
.layout { display: flex; flex-wrap: wrap; }

@supports (display: grid) {
  .layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
}
\`\`\`

## 문법

\`\`\`css
@supports (property: value) { }                       /* 지원하면 */
@supports not (property: value) { }                   /* 미지원이면 */
@supports (a: b) and (c: d) { }                       /* 둘 다 */
@supports (a: b) or (c: d) { }                        /* 하나라도 */
@supports selector(:has(a)) { }                       /* 선택자 지원 검사 */
@supports font-format(woff2) { }                      /* 폰트 포맷 */
@supports (backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px)) { }
\`\`\`

**괄호는 필수**입니다. \`@supports display: grid\`는 동작하지 않습니다.

## 언제 쓰는가

**1. 폴백과 향상이 서로 충돌할 때**
CSS는 원래 "모르는 선언은 무시"하므로 대부분의 폴백은 순서만으로 해결됩니다.

\`\`\`css
.box { background: #333; background: color-mix(in srgb, blue 50%, white); }
/* 미지원 브라우저는 두 번째 줄을 버리고 첫 줄 사용 — @supports 불필요 */
\`\`\`

**\`@supports\`가 필요한 경우는 "속성 하나가 아니라 레이아웃 전략 전체가 달라질 때"**입니다. Grid를 쓰면 자식 마진이 필요 없지만 Flex 폴백에서는 필요한 경우처럼, 여러 선언 묶음이 함께 바뀌어야 할 때입니다.

**2. 선택자 지원 검사**
\`:has()\`처럼 선택자 자체를 모르면 그 규칙 블록이 통째로 무시되는데, 이때 반대 스타일이 남아 깨지는 것을 막습니다.

\`\`\`css
.menu { padding-left: 0; }
@supports selector(:has(*)) {
  .menu:has(.submenu) { padding-left: 16px; }
}
\`\`\`

**3. 벤더 프리픽스 분기** — \`backdrop-filter\`처럼 Safari만 프리픽스가 필요한 경우.

## 주의점

- **\`@supports\`를 지원하지 않는 브라우저는 블록 전체를 무시합니다.** 그래서 **폴백을 밖에, 향상을 \`@supports\` 안에** 두는 순서가 중요합니다. 반대로 하면 구형 브라우저에 아무것도 남지 않습니다
- 문법 파싱만 검사하고 **실제 동작 품질은 보장하지 않습니다.** 속성을 인식하지만 버그가 있는 브라우저는 걸러내지 못합니다
- 오늘날 주요 브라우저의 CSS 지원 격차가 크게 줄어 사용 빈도는 낮아졌습니다. 대신 **신규 기능(\`@container\`, \`:has()\`, \`color-mix()\`, \`anchor-name\`) 도입 시점**에 여전히 유용합니다

**JS 대응**: \`CSS.supports('display', 'grid')\`로 같은 검사를 할 수 있습니다.

> 관련: \`@media\`는 환경(뷰포트·기기)을 묻고, \`@supports\`는 **브라우저 능력**을 묻고, \`@container\`는 부모 컨테이너 크기를 묻습니다.`,
    sub_category: '모던 CSS',
    difficulty: 'medium',
    tags: ['@supports', 'Feature Query', '점진적 향상', '폴백'],
  },
  {
    id: 'q-188',
    question: ':is()와 :where() 가상 클래스 선택자의 차이점은 무엇인가요?',
    answer: `둘 다 **선택자 목록을 받아 반복을 줄이는** 가상 클래스이고, 동작하는 매칭 결과는 완전히 같습니다. **차이는 명시도(specificity) 단 하나**입니다.

| | \`:is()\` | \`:where()\` |
| --- | --- | --- |
| 명시도 | **인자 중 가장 높은 것**을 채택 | **항상 0** |
| 용도 | 일반적인 선택자 그룹화 | 재정의되어야 할 기본 스타일 |

## 예시로 보는 차이

\`\`\`css
/* 인자에 #id가 섞이면 :is()는 그 명시도를 물려받음 */
:is(#main, .content) p { color: red; }    /* 명시도 (1,0,1) — ID 수준 */
:where(#main, .content) p { color: blue; }/* 명시도 (0,0,1) — 요소 하나 수준 */

.content p { color: green; }              /* 명시도 (0,1,1) */
\`\`\`

\`#main\` 안의 \`p\`는 → \`:is()\` 규칙이 이겨 **빨강**. \`:where()\` 규칙은 \`.content p\`에게 져서 파랑도 못 됩니다.

## 반복 제거 효과

\`\`\`css
/* Before */
header h1, header h2, header h3,
main h1, main h2, main h3 { margin-block: 0; }

/* After */
:is(header, main) :is(h1, h2, h3) { margin-block: 0; }
\`\`\`

## 관용 선택자 목록(forgiving selector list)

일반 선택자 목록은 **하나라도 파싱 실패하면 전체가 무효**가 됩니다.

\`\`\`css
h1, h2, :unknown-thing { color: red; }   /* ❌ 전부 무시됨 */
:is(h1, h2, :unknown-thing) { color: red; } /* ⭕ h1, h2는 적용됨 */
\`\`\`

브라우저 지원이 갈리는 신규 선택자를 섞을 때 안전합니다.

## \`:where()\`의 실전 용도 — 라이브러리·리셋 스타일

\`\`\`css
/* 사용자가 클래스 하나로 손쉽게 덮어쓸 수 있음 */
:where(.btn) { padding: 8px 16px; border-radius: 6px; background: #eee; }

.btn-primary { background: blue; }   /* 명시도 (0,1,0) > (0,0,0) → 이김 */
\`\`\`

기본 스타일을 \`:where()\`로 감싸면 **명시도 0이 되어 어떤 클래스로든 재정의 가능**합니다. 디자인 시스템·CSS 리셋에서 \`!important\` 남발을 없애는 정석 패턴입니다.

## 주의점

- **\`:where()\`는 인자가 아니라 규칙 전체의 명시도에 영향을 줍니다.** \`:where(.a) .b\`의 명시도는 \`(0,1,0)\` — \`.b\`의 명시도는 그대로 남습니다
- 둘 다 **의사 요소(\`::before\` 등)는 인자로 넣을 수 없습니다**
- \`:has()\`와 조합하면 강력하지만 성능을 고려하세요. \`:has()\`는 서브트리 전체를 검사하므로 넓은 범위에 남발하면 스타일 재계산 비용이 커집니다

**\`:not()\`과의 관계** — \`:not()\`도 인자 중 최고 명시도를 채택합니다(\`:is()\`와 동일). 명시도를 0으로 만들고 싶으면 \`:not(:where(.x))\` 트릭을 씁니다.`,
    sub_category: '모던 CSS',
    difficulty: 'medium',
    tags: [':is', ':where', '명시도', '선택자'],
  },
];
