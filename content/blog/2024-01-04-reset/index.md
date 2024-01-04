---
title: '새로운 CSS Reset'
date: 2024-01-04
description: '새로운 CSS Reset(번역)'
thumbnail: './thumbnail.png'
category: 'css'
---

> 원문: https://piccalil.li/blog/a-more-modern-css-reset/

## 전체 Reset 코드

```css
/* box-sizing 규칙을 명시합니다. */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* 폰트 크기의 팽창을 방지합니다. */
html {
  -moz-text-size-adjust: none;
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
}

/* 기본 여백을 제거하여 작성된 CSS를 더 잘 제어할 수 있습니다. */
body,
h1,
h2,
h3,
h4,
p,
figure,
blockquote,
dl,
dd {
  margin-block-end: 0;
}

/* list를 role값으로 갖는 ul, ol 요소의 기본 목록 스타일을 제거합니다. */
ul[role='list'],
ol[role='list'] {
  list-style: none;
}

/* 핵심 body의 기본값을 설정합니다. */
body {
  min-height: 100vh;
  line-height: 1.5;
}

/* 제목 요소와 상호작용하는 요소에 대해 line-height를 더 짧게 설정합니다. */
h1,
h2,
h3,
h4,
button,
input,
label {
  line-height: 1.1;
}

/* 제목에 대한 text-wrap을 balance로 설정합니다. */
h1,
h2,
h3,
h4 {
  text-wrap: balance;
}

/* 클래스가 없는 기본 a 태그 요소는 기본 스타일을 가져옵니다. */
a:not([class]) {
  text-decoration-skip-ink: auto;
  color: currentColor;
}

/* 이미지 관련 작업을 더 쉽게 합니다. */
img,
picture {
  max-width: 100%;
  display: block;
}

/* input 및 button 항목들이 글꼴을 상속하도록 합니다. */
input,
button,
textarea,
select {
  font: inherit;
}

/* 행 속성이 없는 textarea가 너무 작지 않도록 합니다. */
textarea:not([rows]) {
  min-height: 10em;
}

/* 고정된 모든 항목에는 여분의 스크롤 여백이 있어야 합니다. */
:target {
  scroll-margin-block: 5ex;
}
```

## 분석

```css
/* box-sizing 규칙을 명시한다. */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

이 규칙은 매우 간단하지만, 요약하자면 모든 요소와 가상 요소들이 크기 조정을 위해 기본값인 content-box 대신 border-box를 사용하도록 설정하고 있다. 이제 브라우저가 유동적인 타입과 공간을 가진 유연한 레이아웃 작업을 더 많이 처리하도록 초점을 두고 있기 때문에 이규칙은 한때만큼 유용하지 않다. 그러나 프로젝트에 명시적인 크기 지정이 전혀 없는 경우는 드물기 때문에, 이 규칙은 여전히 리셋에 포함하고 있다.

```css
/* 폰트 크기의 팽창을 방지한다. */
html {
  -moz-text-size-adjust: none;
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
}
```

폰트 크기의 팽창을 방지한다.

```css
/* 기본 여백을 제거하여 작성된 CSS를 더 잘 제어할 수 있다. */
body,
h1,
h2,
h3,
h4,
p,
figure,
blockquote,
dl,
dd {
  margin-block-end: 0;
}
```

기존에 스타일에는 모든 마진 요소를 제거했지만 이젠 끝 마진만을 제거하고 있다.

```css
/* list를 role값으로 갖는 ul, ol 요소의 기본 목록 스타일을 제거합니다. */
ul[role='list'],
ol[role='list'] {
  list-style: none;
}
```

사파리에서는 리스트 스타일을 제거하면, 사파리는 voiceOver에 대한 의미론적 정보도 제거한다. 그로인해 role을 추가해서 사파리에서 동작하도록 작성했다.

```css
/* 핵심 body의 기본값을 설정합니다. */
body {
  min-height: 100vh;
  line-height: 1.5;
}
```

좋은 가독성을 위해 적절한 줄 간격을 사용하는 것이 중요하다. 특히 장식 요소를 사용할 계획이라면, body에 최소 높이를 100vh로 설정하는 것도 유용하다. 새로운 단위인 dvh를 사용하는것도 좋을 수 있지만, 더 큰 문재를 일으킬 수 있다.

```css
/* 제목 요소와 상호작용하는 요소에 대해 line-height를 더 짧게 설정합니다. */
h1,
h2,
h3,
h4,
button,
input,
label {
  line-height: 1.1;
}
```

글로벌하게 넉넉한 줄 간격을 설정하는 것이 좋듯, 해딩이나 버튼 같은 곳에는 좀 더 짧은 줄 간격을 적용하는 것도 유용하다. 하지만, 사용하는 폰트가 상승부와 하강부가 크다면, 이 규칙을 없애거나 수정하는 것이 좋다. 상승부와 하강부가 서로 겹쳐 접근성 문제를 일으키는 것을 피해야 한다.

```css
/* 제목에 대한 text-wrap을 balance로 설정합니다. */
h1,
h2,
h3,
h4 {
  text-wrap: balance;
}
```

새롭게 도입된 text-wrap 속성이 헤딩을 매력적으로 만들어 준다.

```css
/* 클래스가 없는 기본 a 태그 요소는 기본 스타일을 가져옵니다. */
a:not([class]) {
  text-decoration-skip-ink: auto;
  color: currentColor;
}
```

이 규칙은 텍스트 데코레이션이 상승부와 하강부에 방해가 되지 않도록 하는 것이다. 이제는 대부분의 브라우저에서 기본적으로 설정되어 있지만, 이를 명시적으로 설정하는 것도 좋은 정책이 될 수 있다.

```css
/* input 및 button 항목들이 글꼴을 상속하도록 합니다. */
input,
button,
textarea,
select {
  font: inherit;
}
```

입력 필드와 폼 요소에 폰트를 상속받도록 하는것은 매우 유용하다. 프로젝트 후반의 CSS작업을 줄일 수 있으므로 폼 요소에 적절하게 적용할 수 있다.

```css
/* 행 속성이 없는 textarea가 너무 작지 않도록 합니다. */
textarea:not([rows]) {
  min-height: 10em;
}
```

기본적으로 rows속성을 추가하지 않으면 textarea는 매우 작아질 수 있다. 보통 여러줄의 텍스트를 위해 사용하기 더 편하게 만드는 것이 좋다.

```css
/* 고정된 모든 항목에는 여분의 스크롤 여백이 있어야 합니다. */
:target {
  scroll-margin-block: 5ex;
}
```

어떤 요쇼가 고정되어 있다면, 그 요소가 대상이 될 때만 고려되는 scroll-margin을 사용하여 위쪽에 조금 더 공간을 추가하는 것이 좋다. 사용자 경험을 크게 향상시킬 수 있는 작은 조정이다.

## 마무리

이 CSS Reset은 더 지속될거라고 말한다. 이번 버전은 문제가 많지 않고 새프로젝트를 시작할 때 사용하면 유용하다고 말한다. CSS Reset은 사람들이 신경쓰는 것 중 하나지만, 사실 요즘 브라우저의 성능이 워낙 뛰어나기 때문에 애초에 CSS Reset이 필요하지 않을 수도 있다. 웹에서 유용한 CSS가 있다면 자신만의 (또는 팀 만의) Reset CSS를 만들어보는게 어떨까?
