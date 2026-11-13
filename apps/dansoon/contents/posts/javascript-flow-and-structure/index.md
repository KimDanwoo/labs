---
title: "JavaScript의 진화: jQuery에서 ES2025까지 구조와 흐름 살펴보기"
description: "jQuery, ES6, async/await, 프레임워크, TypeScript, ES2025까지 JavaScript가 구조를 문법으로 받아들여 온 흐름을 살펴보고, jQuery를 순수 JS로 바꿀 때 확인할 fetch·위임 이벤트 동작 차이를 정리해요."
publishedAt: "2025-08-01T10:00:52+09:00"
updatedAt: "2026-11-13T13:30:00+09:00"
category: "dev"
tags: ["javascript"]
legacyUrl: "https://dansoon-dev.tistory.com/18"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

## 자바스크립트는 어떻게 구조를 갖춰 왔을까

자바스크립트는 오랜 시간 동안 ‘기능적인 언어’로 오해받아 왔습니다. 필요하면 쓰고 문제 생기면 회피하는 도구처럼 사용했습니다.

하지만 개발 환경이 바뀌고 프론트엔드가 복잡한 애플리케이션 구조를 갖추게 되면서 자바스크립트는 그 한계를 극복하며 스스로 구조를 진화시켜 왔습니다.

연대기보다는 언어 자체가 어떻게 ‘구조’와 ‘패턴’을 받아들이고 실제 문법으로 진화해왔는지를 따라가 봤습니다.

## 태생부터 빠른 실행을 위한 구조였다

자바스크립트는 1995년 넷스케이프에서 태어났습니다. 설계자였던 브렌던 아이크는 단 열흘 만에 이 언어를 완성했습니다.

설계보다는 속도, 철학보다는 실용이 우선이었고 그 결과 JS는 아래와 같은 특징을 가진 언어로 태어났습니다.

-   전역 스코프
-   유연한 타입
-   느슨한 바인딩

```html
<script>
  alert('Hello JS');
</script>
```

HTML 안에 스크립트를 바로 적어 실행하는 방식입니다. 처음에는 문서에 동작을 붙이는 수준이었고 객체지향이나 모듈성은 고려되지 않았습니다.

이런 구조는 이후 브라우저 간 충돌, 호환성 문제, 유지보수의 어려움으로 이어졌습니다.

## jQuery는 ‘언어 설계의 시사점’이었다

2006년 jQuery가 등장했을 때 많은 사람들은 그것을 “코드 몇 줄을 줄여주는 도구”로 보았습니다.

하지만 실상은 달랐습니다. jQuery는 자바스크립트의 문법적 불편함, 브라우저 간 비표준 API, DOM 인터페이스 문제를 통합된 인터페이스로 추상화한 도구였습니다.

```ts
$('#btn').on('click', () => {
  $.ajax({
    url: '/data',
    success: res => $('#msg').text(res.message),
  });
});
```

이벤트 처리, DOM 조작, Ajax 호출 모두가 `$` 하나의 인터페이스로 통일되었습니다. 브라우저에 따라 다른 방식으로 처리해도 개발자는 그 내부를 몰라도 되었습니다.

jQuery로 새 기능을 개발해 본 적은 없습니다. 다만 레거시 프로젝트에서 jQuery를 걷어내고 순수 JavaScript로 바꾸는 리팩터링을 한 적이 있습니다.

당시 .on() → addEventListener(), $.ajax() → fetch(), .addClass() → classList.add() 등으로 변환하면서 문법 차이뿐 아니라 코드 구조 자체가 더 명확하고 예측 가능해졌다는 것을 체감했습니다.

이 과정에서 jQuery는 “그 시대에는 필요했던 합리적인 추상화”였지만, 이제 JS가 그 기능을 품음으로써 언어 자체가 구조적으로 성장해왔음을 실감할 수 있었습니다.

### jQuery를 걷어낼 때 확인해야 하는 동작 차이

메서드 이름만 일대일로 바꾸면 같은 코드처럼 보여도 동작이 달라지는 곳이 있습니다. 공식 문서([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch), [jQuery API](https://api.jquery.com/))에서 확인한 차이를 아래 표에 모았습니다.

![만능칼 하나에 모여 있던 도구가 각각의 도구로 나뉘어 놓인 모습](./jquery-to-vanilla.webp)

| jQuery | 순수 JavaScript | 달라지는 점 |
| --- | --- | --- |
| `$.ajax()` | `fetch()` | `$.ajax`는 요청이 실패하면 `error` 콜백을 부르고, 404 같은 에러 응답도 그쪽으로 처리합니다. `fetch()`는 404·504 응답에서 reject하지 않으므로 `response.ok`를 직접 확인해야 합니다. |
| `dataType` 생략 | `response.json()` | `$.ajax`는 `dataType`을 생략하면 응답 형식을 추측(Intelligent Guess)해 파싱합니다. `fetch()`는 본문을 `json()`이나 `text()`로 직접 읽어야 합니다. |
| `.on('click', '.item', fn)` | `addEventListener` + `closest()` | 위임 이벤트는 나중에 추가된 자식 요소의 이벤트도 처리합니다. 순수 JavaScript에서는 부모에 리스너를 걸고 `event.target.closest('.item')`으로 대상을 찾아야 합니다. |
| 핸들러에서 `return false` | `preventDefault()`·`stopPropagation()` | jQuery는 `return false`를 두 메서드 호출로 처리합니다. `addEventListener` 콜백의 반환값은 쓰이지 않으므로 두 메서드를 직접 불러야 합니다. |
| `$('.item').addClass('on')` | `querySelectorAll` + `forEach` | `addClass`는 선택된 모든 요소에 적용됩니다. `classList.add`는 요소 하나에만 적용되므로 `querySelectorAll`이 돌려준 NodeList를 순회해야 합니다. |

첫 번째 차이를 가장 놓치기 쉽습니다. `success`·`error` 콜백을 그대로 `then`·`catch`로 옮기면 404 응답이 성공 경로로 들어갑니다.

```ts
// jQuery
$.ajax({
  url: '/data',
  success: (res) => render(res),
  error: () => showError(),
});

// 순수 JavaScript
try {
  const response = await fetch('/data');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  render(await response.json());
} catch {
  showError();
}
```

위임 이벤트도 같은 방식으로 옮깁니다. 목록에 나중에 추가되는 항목까지 처리하려면 리스너를 목록에 걸고 클릭된 요소에서 대상을 찾아 올라갑니다.

```ts
// jQuery
$('#list').on('click', '.item', function () {
  select(this);
});

// 순수 JavaScript
const list = document.querySelector('#list');
list?.addEventListener('click', (event) => {
  const item = (event.target as Element).closest('.item');
  if (!item || !list.contains(item)) return;
  select(item);
});
```

메서드를 바꾸는 작업이지만 이런 차이를 놓치면 에러 처리나 이벤트 동작이 조용히 달라집니다. 바꾼 뒤에는 실패 응답과 동적으로 추가된 요소처럼 jQuery가 대신 처리해 주던 경우를 따로 확인해야 합니다.

## ES5에서 ES6로의 진화는 ‘언어적 반성’의 결과였다

ES5(2009)는 엄격 모드("use strict")와 JSON 지원, Array 메서드 정비를 통해 자바스크립트의 첫 정리 작업이었습니다.

그러나 진짜 진화는 ES6(2015)부터 시작됩니다.

```javascript
const greet = (name = 'JS') => `Hello, ${name}`;
```

위 코드는 화살표 함수, 기본값 파라미터, 템플릿 리터럴을 한 줄에 쓴 예입니다. ES6에 들어온 주요 문법은 다음과 같습니다.

-   블록 스코프(let, const)
-   클래스 문법
-   모듈(import/export)
-   비동기 흐름(Promise)
-   화살표 함수, 템플릿 리터럴, 전개 연산자, 기본값 파라미터

여기서부터 JS는 이런 문법을 통해 이전보다 구조적으로 예측 가능한 언어로 변화하게 됩니다.

실무에서 ES6 이후 문법이 가장 큰 전환점이 되었다고 느낀 순간은 let과 const의 도입이었습니다.

이 둘이 없던 시절에는 실수로 전역 컨텍스트를 더럽히거나 변수의 재할당 여부를 예측하지 못해 디버깅에 시간을 낭비하는 일이 잦았습니다. 지금은 const를 기본으로 사용하고 꼭 필요한 경우에만 let을 쓰는 게 팀 내 컨벤션이 되었고, 이 하나만으로도 코드 안정성이 눈에 띄게 개선된 경험이 있습니다.

## 자바스크립트는 비동기를 언어 수준에서 받아들였다

JS의 가장 복잡한 부분 중 하나는 비동기 처리였습니다.

이전에는 콜백 중첩이 기본이었고 코드 흐름이 예측 불가능해지는 경우가 많았습니다.

```javascript
getUser(userId, function (user) {
  getPosts(user.id, function (posts) {
    render(posts);
  });
});
```

이를 해결한 구조적 전환점이 Promise(ES6), 그리고 이어지는 async/await(ES2017)입니다.

```javascript
const user = await getUser(userId);
const posts = await getPosts(user.id);
render(posts);
```

이 코드는 보기 좋을 뿐 아니라 **비동기 흐름 자체를 동기적 문맥 안에서 관리**하게 만들어 줍니다. 콜백 예제에서는 다음 작업이 콜백 안으로 계속 들어가지만, async/await 예제는 위에서 아래로 순서대로 읽힙니다. fetch처럼 Promise를 돌려주는 API가 기본이 된 것도 이 흐름입니다.

## 자바스크립트는 ‘제안-채택-실행’의 순환 시스템을 갖추고 있다

이제 자바스크립트는 브라우저 업체가 정하는 언어가 아닙니다. TC39라는 표준화 위원회가 단계별로 제안을 받고 논의하고 실험하고 브라우저에 반영합니다.

-   Stage 0: 아이디어
-   Stage 1: 기술 정의
-   Stage 2: 설계 초안 및 API
-   Stage 3: 브라우저 반영 시작
-   Stage 4: 최종 승인

이 과정을 거쳐 ES2022에 들어온 예가 Array.prototype.at() 메서드입니다. 이 기능은 index를 음수로 접근하는 직관적인 방식이었고, Polyfill(지원하지 않는 환경에서 새 기능을 대신 구현해 주는 코드)을 통해 실험된 뒤 최종적으로 모든 브라우저에 정식 반영되었습니다.

또한 2025년 6월, ECMAScript 2025가 공식 승인되면서 개발자 생산성을 높이는 실질적인 기능들이 추가되었습니다. 대표적으로 아래와 같습니다.

-   Iterator Helper 메서드: .map(), .filter(), .take(), .drop() 등 반복자 기반 데이터 흐름 제어가 가능해졌습니다. 중간 배열 없이 처리할 수 있어 메모리 효율이 개선됩니다.
-   JSON 모듈 import: import config from './config.json' with { type: 'json' } 형태로, 별도 설정 없이 JSON 파일을 네이티브로 불러올 수 있습니다.
-   Promise.try(): 동기 함수도 catchable한 promise 흐름에 통합할 수 있게 되어 동기 예외와 비동기 예외를 같은 .catch 흐름으로 처리할 수 있습니다.
-   Set 연산 메서드: union, intersection, difference, isSubsetOf 등의 집합 연산이 표준 API로 도입되어, 불필요한 배열 변환 없이도 직관적 연산이 가능해졌습니다.
-   RegExp.escape(): 사용자 입력을 안전하게 정규식에 삽입할 수 있도록 도와주는 정규식 이스케이프 API가 추가되었습니다.

실제로 저는 Array.prototype.at() 메서드가 도입되기 전까지는 arr\[arr.length - 1\] 같은 표현을 습관처럼 사용했지만, 그 의미가 명확하지 않아 가독성이 떨어진다는 피드백을 받은 경험이 있습니다. 이후 Stage 4 기능들을 꾸준히 체크하며 코드의 의도를 더 분명히 전달하는 습관이 생겼습니다.

또한 최근 프로젝트에서는 Promise.try()를 사용해 예외 흐름을 보다 일관되게 유지할 수 있는 것도 코드 품질을 높이는 데 도움이 되었습니다.

신기능의 도입은 문법의 추가에 그치지 않고 팀 전체의 코드 퀄리티와 생산성을 한 단계 끌어올리는 계기라고 생각합니다.

## React, Vue, Svelte는 JS 구조를 기반으로 한 다른 해석들입니다

JS는 이제 DOM을 다루는 데 그치지 않습니다. UI와 상태, 반응성, 컴파일 타임까지 다루는 기반 언어가 되었습니다.

React는 상태 기반 UI 흐름을 공식화했습니다. Vue는 선언성과 직관성의 균형을 시도했습니다. Svelte는 런타임이 아닌 컴파일 타임에 최적화된 DOM을 만들어냅니다. Vue와 React의 상태 처리 방식은 [Vue 3 ref와 reactive 차이, 그리고 React useState 톺아보기](/posts/vue-ref-reactive-vs-react-usestate/)에서 비교했습니다.

프레임워크 중에서는 특히 React의 JSX가 자바스크립트 구조의 변화를 가장 극적으로 드러냈다고 느꼈습니다.

로직과 뷰를 한 덩어리로 구성할 수 있다는 것은 문법적 편의 그 이상이었고, 상태 기반 렌더링을 통해 UI 구성 방식 자체를 근본적으로 바꿔놓은 경험이었습니다.

이렇게 보면 “기능의 단순화”보다는 “구조적 철학의 재해석”이 프레임워크마다 다르게 표현되고 있다는 사실을 자주 체감합니다.

## 타입스크립트는 자바스크립트의 미래를 정의하고 있다

자바스크립트가 구조적으로 성숙해지면서 이를 더 정형화하려는 시도로 **타입스크립트(TypeScript)**가 등장했습니다.

2012년 마이크로소프트에 의해 처음 발표된 타입스크립트는 자바스크립트 위에 정적 타입 시스템과 클래스 기반 객체지향 문법을 더한 상위 언어입니다.

초창기에는 학습 난이도나 설정 복잡도 때문에 일부 대규모 프로젝트에서만 사용되었지만, 최근 몇 년 사이에는 라이브러리, 프레임워크, 툴링 모두가 TS를 기본 전제로 움직이고 있습니다.

저 역시 타입스크립트를 처음 접했을 때는 타입 선언이 오히려 불편하게 느껴졌지만 점점 팀 단위 협업과 유지보수 상황에서 명확한 계약이 있는 코드가 얼마나 중요한지를 실감하게 되었습니다. 특히 API 스펙이 바뀌었을 때 에디터에서 바로 에러가 발생하는 경험은 자바스크립트만 썼을 때는 상상하기 힘든 안정감이었습니다.

타입스크립트는 JS를 확장하고 정형화하며 다음 세대로 이끄는 진화의 도구라고 생각합니다.

## 정리: 자바스크립트가 구조를 재해석해 온 방식

자바스크립트는 **사용자의 기대, 프레임워크의 압력, 브라우저 생태계의 필요에 따라** 스스로의 구조를 재해석하며 진화해 왔습니다.

jQuery는 편리한 도구가 아니라 JS 문법과 인터페이스의 방향을 바꿔놓은 혁신이었고, ES6 이후 자바스크립트는 스스로 구조를 정의하고 표준을 생산하며 다른 언어와 동등한 수준에서 경쟁하는 언어가 되었습니다.

프레임워크는 계속해서 바뀌고 있지만 그 근간에 있는 JS의 구조적 원리들은 점점 더 명확하고 깊이 있는 방향으로 발전하고 있습니다.

과거의 기술을 넘기는 데 그치지 않고 그 구조를 다시 뜯어보고 재해석하며 현재의 문법에 녹여보는 경험은 개발자에게 중요한 자산이 됩니다. 저 역시 jQuery 기반 코드를 순수 JS로 재구성하면서 언어가 어떤 문제를 해결하며 성장해왔는지를 체감할 수 있었습니다. 프레임워크 없이 JavaScript만으로 SPA를 직접 구현한 과정은 [Vanilla JavaScript로 SPA 만들기](/posts/vanilla-js-spa/)에도 남겼습니다.

## 참고 자료

-   [ECMAScript 2025 주요 변경사항 – The Innovators](https://theinnovators.zone/archives/4364)
-   TC39 Proposal Tracking: [https://tc39.es](https://tc39.es)
