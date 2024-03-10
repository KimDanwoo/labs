---
title: 'CSS 작성 유의사항'
date: 2023-12-27
description: 'CSS 작성 유의사항'
thumbnail: './thumbnail.png'
category: 'css'
isHidden: false
---

## 취소 스타일 (Undoing styles)

스타일을 재설정 하는 css는 지양해야 한다

css의 본질은, 이전에 정의된 것들로부터 케스케이드 하고 상속하는 것이다. CSS 규칙 세트는 오직 이전 것을 상속하고, 이전 것에 추가하기만 해야지 절대로 취소해서는 안된다.

```css
h2 {
  font-size: 2em;
  margin-bottom: 0.5em;
  padding-bottom: 0.5em;
  border-bottom: 1px solid #ccc;
}
```

위 스타일에서 모든 h2요소에 border-bottom을 먹였다.

하지만 h2를 사용할때 밑줄을 빼고싶을 경우가 생길 수 있다.

그때 이전에 있던 스타일을 제거하면서 사용해야 하는데 더 나은 방법으로 이렇게 작성할 수 있다.

```css
h2 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

.headline {
  padding-bottom: 0.5em;
  border-bottom: 1px solid #ccc;
}
```

이렇게 하면 앞선 선언을 취소하는 것도 없고, 클래스 이름도 훌륭하고 시맨틱 하다.

스타일시트를 작성해 나갈 때, 스타일은 추가하기만 해야한다. 취소하는 건 안 된다. 스타일을 작성하다가 앞선 선언한 스타일을 취소해야 한다면, 바로 취소 스타일을 추가하기 쉽상이다. 지양해야 한다.

## 매직 넘버 (Magic Numbers)

매직 넘버는 ‘반드시 그렇게만 동작하는’ 값을 말한다.

```css
.site-nav {
  ...;
}

.site-nav > li:hover .dropdown {
  position: absolute;
  left: 0;
  top: 37px;
}
```

top: 37px; 이게 매직 넘버다. 이걸 이렇게 작성한 이유는 아마 site-nav안에 있는 li가 높이 37로 만들어 졌고, 그러면 .dropdown이 그 아래 나타나야 하기 때문일 것이다.

문제는 37px이 전적으로 특정 환경에 따른 숫자이고, 이 숫자가 늘 이렇게 유지되지 않을 거라는 점이다.

만약 site-nav안에 요소가 바뀌어서 사이즈가 달라진다면 37px의 dropdown은 깨질 것이다.

그러므로 top: 100%; 아니면 bottom:0;으로 작성하는게 더 유지보수에 적합할 수 있다.

## 조건부 선택자 (Qualified selector)

```css
// 조건부 선택자
ul.nav {
}
a.button {
}
div.header {
}
```

위 요소들은 전부 조건부 선택자이다.

기본적으로 선택자 앞에 쓸모없는 HTML 태그가 들어가 있다. 이건 나쁜 징후다. 이유는 다음과 같다.

- 다른 요소에서 재사용 될 수 없다.
- 특정도 (specificity) 를 높인다.
- 브라우저 작업량을 증가시킨다. (성능 저하)

```css
// 더 나은 방법
.nav {
}
.button {
}
.header {
}
```

이제 어떤 요소에서든 .nav 클래스를 재사용 할 수 있고, button, a 태그의 스타일을 .button으로 바꿀 수 있다.

## 절대값 (Hard-coded/absolute values)

```css
h1 {
  font-size: 24px;
  line-height: 32px;
}
```

처음에 줄간격을 고정으로 지정하면 계속해서 고정된 line-height를 지정해야 한다. 상대값으로 지정해서 line-height가 비율에 따라 변하게 하면 더 간단하게 할 수 있다.

```css
h1 {
  font-size: 24px;
  line-height: 1.333;
}
```

절대값은 유연하지 않다. 유연한 값으로 대체 사용해야 한다.

## 무차별 강제 스타일 (Brute forcing)

```css
.foo {
  margin-left: -3px;
  position: relative;
  z-index: 99999;
  height: 59px;
  float: left;
}
```

이 모든 선언은 레이아웃에 영향을 미치는 강력한 무차별 강제 선언으로, 오직 원하는 대로 렌더링 하도록 완전히 강제하는 데만 사용된다. 이런 종류의 CSS는 사용을 지양해야 한다.

## 위험한 선택자 (Dangerous selectors)

‘위험한 선택자’란 너무 광범위하게 적용될 수 있는 것을 말한다.

```css
div {
  background-color: #fff;
  padding: 1em;
}
```

태그 선택자에 특정 스타일을 주는 건 위험하다. 해당 요소를 다른 데서 사용하려고 하면 아까 준 스타일이 새어나와 거기에 적용될 것이다.

선택자를 의도가 명확한 선택자로 만들어라.

## 즉흥적인 !important

!important는 중요한 툴이다. 하지만 오직 특정한 상황에서만 사용해야 한다.

!important는 명확한 의도를 갖고 사용해야지 즉흥적으로 사용하면 안된다.

```css
.error-text {
  color: red !important;
}
```

위 스타일은 언제나 빨간색을 노출하기 위해 명확한 의도를 가지고 !important를 사용했다.

하지만 위험한 경우는 문제를 우회하기 위함이거나 즉흥적으로 스타일을 주려고 사용할 때 발생한다.

!important를 즉흥적으로 사용하는 것은 잘못된 CSS로 인해 발생한 문제를 우회하는 것일 뿐이다. !important는 어떤 문제점도 수정하지 않는다. 증상만 덮을 뿐이다. 문제점은 슈퍼 특정도를 가진 레이어와 함께 여전히 남아 있다. 그리고 이것을 압도하기 위해 훨씬 더 많은 특정도가 필요하게 될 것이다.

## ID

ID는 CSS에서 사용하면 안 된다. HTML에서 책갈피나 JS훅에 사용하고 CSS에서는 사용하지 마라.

이유는 간단하다.

- ID는 한 페이지에서 두 번 사용될 수 없다.
- 클래스는 한 페이지에 한 번만 존재해도 되고 여러번 존재해도 된다.
- ID를 클래스로 바꾸면 재사용이 가능해지는 경우가 많다.
- ID는 클래스보다 강력하다. 그래서 class로 ID를 덮을 수 없다.

## 느슨한 클래스 이름 (Loose class names)

느슨한 클래스 이름이란 의도한 목적을 훙분히 드러내지 못하는 것을 말한다. .card라는 클래스를 생각해보면

클래스 이름이 느슨하다. 그래서 클래스의 목적을 알아내기 어렵고, 이름이 너무 모호해서 다른 개발자가 우연히 다른 의도로 사용하게 될 수 있다.

명확한 의도를 가지고 클래스 명을 정의하면 이러한 문제를 해결할 수 있다.

## 참고

https://csswizardry.com/2012/11/code-smells-in-css/
