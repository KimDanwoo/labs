---
title: "내가 리액트를 직접 만들어봤다? 가상 DOM·이벤트 위임·diff 구현"
description: "vNode 변환, 이벤트 위임, 변경분만 반영하는 DOM 비교를 직접 구현하며 가상 DOM이 성능에 도움이 되는 이유를 익힌 과정을 돌아봐요."
publishedAt: "2024-12-11T13:21:01+09:00"
updatedAt: "2026-11-10T18:24:00+09:00"
category: "dev"
tags: ["react","javascript"]
legacyUrl: "https://dansoon-dev.tistory.com/4"
thumbnail: "./thumbnail.jpg"
cover: "./cover.jpg"
---

## 1\. 문제: 가상 DOM을 직접 구현해야 했다

리액트와 같은 프레임워크는 가상 DOM으로 성능을 최적화한다. 이 과제에서는 이를 직접 구현해야 했고, 문제는 세 가지였다.

첫번째로 가상 노드(vNode)를 실제 DOM 요소로 변환해야 했는데, 다양한 타입(숫자, 문자열, 배열, 함수형 컴포넌트 등)을 고려하여 처리하는 로직을 만들어야 했다.

두번째로 여러 이벤트 핸들러를 각 요소에 개별적으로 설정하지 않고, **이벤트 위임** 방식을 사용해 성능을 최적화하고 유지보수를 쉽게 해야 했다.

세번째로 최적화된 렌더링을 위해 가상 DOM과 기존 DOM을 비교해 필요한 부분만 업데이트함으로써 불필요한 DOM 조작을 최소화해야 했다.

이 문제들은 성능 최적화와 복잡한 사용자 인터페이스 관리에 필수적인 부분들이었다.

하지만 주로 잘 만들어진 프레임워크나 라이브러리를 사용해왔기 때문에 이런 부분을 코드로 직접 작성하기엔 조금 막막했다.

## 2\. 시도: vNode 변환, 이벤트 관리, DOM 업데이트

코드에서 실제로 해결하려고 노력한 부분은 다음과 같다.

1.  vNode 변환
    1.  가상 노드가 다양한 형태(숫자, 문자열, 배열, 함수형 컴포넌트 등) 일 수 있기 때문에 이를 다룰 수 있는 여러가지 조건을 추가했다. 예를 들어 숫자와 문자열은 텍스트 노드로 만들고 배열은 DocumentFragment로 처리했다. DocumentFragment는 메모리 위에만 존재하는 가벼운 DOM 컨테이너로, 여러 노드를 묶어 한 번에 붙일 수 있다.
2.  이벤트 관리
    1.  이벤트 위임 방식을 도입하여 DOM에 직접 이벤트를 등록하는 대신, 하위 요소에서 발생한 이벤트를 상위 컨테이너 하나에서 받아 처리하도록 하여 성능을 최적화하려 했고, 여러 자식 요소에 일일이 이벤트를 걸지 않고도 효율적으로 처리하도록 시도했다.
3.  DOM 업데이트
    1.  새로운 vNode와 기존 DOM을 비교하여 필요한 부분만 업데이트하는 방법을 선택했다. 불필요한 DOM 변경은 이렇게 최소화했다.

## 3\. 해결: 구현 코드

```ts
export function resolveVNodeType(vNode, version) {
  if (!vNode) return document.createTextNode('')
  if (isPrimitive(vNode)) return document.createTextNode(vNode)
  if (Array.isArray(vNode)) return createFragment(vNode)
  if (isFunction(vNode)) return createFunction(vNode)

  return createDomElement(vNode, version)
}
```

resolveVNodeType 함수를 만들어 각 vNode의 타입에 따라 텍스트 노드를 반환하거나 DOM요소를 생성하는 로직을 구현했고, 이 함수가 가상 DOM을 실제 DOM으로 변환한다.

가상 DOM은 화면 구조를 자바스크립트 객체 트리로 표현한 것이다. 객체를 만들고 비교하는 일은 실제 DOM을 건드리는 것보다 가볍고 실제 DOM 조작은 레이아웃 계산이나 다시 그리기를 일으킬 수 있어 상대적으로 비싸다. resolveVNodeType은 이 객체를 DOM으로 바꾸는 입구로, 위에서부터 조건을 하나씩 거르는 구조다. 비어 있는 값은 빈 텍스트 노드로, 숫자와 문자열은 텍스트 노드로, 배열은 Fragment로, 함수는 컴포넌트로 처리하고 나머지만 요소 노드로 만든다. 첫 조건이 `!vNode`라서 숫자 0도 이 단계에서 빈 텍스트 노드가 된다는 점은 코드에서 읽히는 동작이다.

```ts
const eventMap = new Map()

function manageRootListener(eventType, action = ACTIONS.ADD) {
  if (!rootElement) return

  if (action === ACTIONS.ADD) {
    rootElement.addEventListener(eventType, handleEvent, { capture: true })
  } else if (action === ACTIONS.REMOVE) {
    rootElement.removeEventListener(eventType, handleEvent, { capture: true })
  }
}

export function setupEventListeners(root) {
  if (rootElement) {
    eventMap.forEach((_, eventType) => {
      manageRootListener(eventType, ACTIONS.REMOVE)
    })
  }

  rootElement = root

  eventMap.forEach((_, eventType) => {
    manageRootListener(eventType, ACTIONS.ADD)
  })
}
```

이벤트 위임은 리스너를 각 요소에 붙이는 대신 eventMap과 setupEventListeners 함수로 상위(루트)에서 이벤트를 처리하도록 구현했다. 이벤트 종류별로 루트에 capture 리스너를 등록하므로, 각 요소에 핸들러를 설정하지 않아도 전역에서 이벤트를 처리할 수 있었다.

`eventMap`은 이벤트 종류를 키로 쓰는 Map이고 `manageRootListener`는 루트 요소에 같은 `handleEvent` 함수를 등록하거나 해제한다. `setupEventListeners`는 이전 루트가 있으면 등록돼 있던 리스너를 먼저 걷어낸 뒤 새 루트에 다시 붙인다. 루트가 바뀌어도 리스너가 두 곳에 남지 않게 하는 순서다. 등록 옵션인 `capture: true`는 이벤트가 루트에서 타깃으로 내려가는 캡처 단계에서 리스너를 실행하게 한다. `focus`와 `blur`처럼 버블링하지 않는 이벤트도 캡처 단계에서는 상위 요소가 받을 수 있다. `handleEvent`는 이벤트가 일어난 타깃에 등록된 핸들러를 찾아 실행하는 함수다.

React도 이벤트를 요소마다 붙이지 않고 루트 컨테이너에서 처리한다. React 17부터는 리스너가 `document`가 아니라 앱을 렌더링하는 루트 컨테이너에 붙는다. 링크 클릭에 위임을 적용한 사례는 [Vanilla JavaScript로 SPA 만들기](/posts/vanilla-js-spa/)에서 볼 수 있다.

```ts
function updateElement(parentElement, newNode, oldNode, index = 0) {
  const currentNode = parentElement.childNodes[index]

  if (!newNode && oldNode) {
    currentNode && parentElement.removeChild(currentNode)
    return 
  }

  if (newNode && !oldNode) {
    parentElement.appendChild(createElement__v2(newNode))
    return 
  }

  if (typeof newNode === 'string' || typeof newNode === 'number') {
    if (newNode !== oldNode && currentNode) {
      const newTextNode = document.createTextNode(String(newNode))
      parentElement.replaceChild(newTextNode, currentNode)
    }
    return
  }

  if (newNode.type !== oldNode.type) {
    parentElement.replaceChild(createElement__v2(newNode), currentNode)
    return
  }

  updateAttributes(currentNode, newNode.props || {}, oldNode.props || {})

  const newChildren = newNode.children || []
  const oldChildren = oldNode.children || []
  const maxLength = Math.max(newChildren.length, oldChildren.length)

  for (let i = 0; i < maxLength; i++) {
    updateElement(currentNode, newChildren[i], oldChildren[i], i)
  }

  while (currentNode.childNodes.length > newChildren.length) {
    currentNode.removeChild(currentNode.lastChild)
  }
}
```

DOM 업데이트는 updateElement 함수가 이전 노드와 새 노드를 비교해 필요한 부분만 고치도록 해 DOM 조작을 최소화했다. 텍스트 노드 변경, 속성 업데이트, 자식 노드 처리는 재귀로 처리했다. `createElement__v2`는 가상 노드를 실제 DOM으로 만드는 함수다.

updateElement가 비교하는 순서를 코드에서 따라가면 다음과 같다. 새 노드가 없고 이전 노드만 있으면 해당 DOM을 지운다. 새 노드만 있으면 만들어 붙인다. 문자열이나 숫자면 값이 달라졌을 때만 텍스트 노드를 교체한다. 두 노드의 `type`이 다르면 하위 트리를 비교하지 않고 통째로 교체한다. 타입이 같을 때만 속성을 갱신하고 자식을 같은 인덱스끼리 재귀로 비교하며 마지막에는 새 자식보다 남는 이전 자식을 while 루프로 지운다.

타입이 다르면 하위 트리를 버리고 새로 만드는 규칙은 React의 비교 알고리즘이 쓰는 가정과 같다. React 공식 문서는 두 트리를 완전히 비교하면 비용이 너무 크므로, 타입이 다르면 다른 트리로 보고 리스트에는 `key`를 쓴다는 두 가지 휴리스틱으로 비교한다고 설명한다. 여기서는 자식을 인덱스 기준으로만 대응시키므로 `key`에 해당하는 장치가 없다. 리스트 중간에 항목이 끼어들면 뒤의 항목이 모두 다른 노드와 비교돼 불필요한 갱신이 생길 수 있다.

## 4\. 알게 된 것: 함수형 컴포넌트 처리, 이벤트 위임, 변경분만 반영하기

함수형 컴포넌트를 처리하는 방법이 흥미로웠다. 컴포넌트를 호출한 결과를 다시 가상 노드로 변환하고, 이를 재귀적으로 처리하면 된다는 것을 알게 되었다.

이벤트 위임은 개별 요소에 이벤트를 등록하는 것보다 훨씬 효율적이었다. 특히 많은 요소가 동적으로 추가되거나 제거되는 상황에서 큰 차이를 만들 수 있다고 생각했다.

매번 전체 DOM을 새로 그리지 않고 변경된 부분만 업데이트하는 방식이 성능 최적화에 어떻게 도움이 되는지도 이해하게 됐다. 가상 DOM과 실제 DOM을 비교해 업데이트하는 과정이 특히 중요했다.

이어서 메모이제이션과 렌더링 최적화를 다룬 과제는 [React Hook을 직접 구현해보자](/posts/implement-react-hooks/)에 정리했다.

## 가상 DOM 방식의 한계와 다른 접근

가상 DOM이 언제나 직접 DOM을 조작하는 것보다 빠른 것은 아니다. 비교 과정에도 비용이 들고 어느 부분이 바뀌는지 처음부터 알고 있다면 해당 노드를 곧바로 고치는 편이 적게 일한다. 가상 DOM이 주는 이점은 상태에서 화면을 선언적으로 계산하게 해 주는 개발 방식에 가깝다. 상태와 DOM 노드를 직접 연결해 바뀐 값에 대응하는 부분만 갱신하는 세밀한 반응형 방식(Solid, Svelte 등)은 이 비교 단계를 두지 않는다.

## Keep: 현재 만족하고 계속 유지할 부분

주어진 과제들이 앞으로도 많이 남아 있는데, 가장 만족스러운 부분은 주도적으로 코드를 짜보고 그 코드를 이해하려고 노력하면서 내가 조금씩 늘고 있구나? 라고 생각하게 된 점이다.

리액트 직접 구현하기, 가상돔 만들기, diff알고리즘 구현하기! 라는 과제를 들었을때 저번주의 나는 혼란 속에서 과제 발제를 마무리했는데, 과제를 풀어가며 모르는 부분을 채워간 일주일이 지난 지금은 저번주보다 성장했구나? 라는 확신을 가질 수 있다는 게 정말 만족스럽다.

이동욱 CTO님의 강연을 본 적이 있는데, 주기적인 회고의 습관이 자신이 얼마나 늘었고 성장했는지 느낄 수 있는 포인트라고 말씀하셨다. 앞으로 남은 8주는 물론이고 남은 커리어를 어떻게 성장해야 할지 감을 잡을 수 있었다. 앞으로도 화이팅~!
