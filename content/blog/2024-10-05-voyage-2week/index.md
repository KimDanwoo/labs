---
title: '[항해99] 내가 리액트를 직접 만들어봤다? 2주차 성장기 [WIL]'
date: 2024-10-05
description: '직접 만들며 이해하는 리액트'
thumbnail: './thumbnail.png'
category: '항해플러스'
isHidden: false
---

## 1. 문제

리액트에서는 가상 DOM을 사용하여 성능을 최적화하는데, 이 과제에서는 이를 직접 구현해야 했다. 주된 문제는 다음과 같았다.

첫 번째로 가상 노드(vNode)를 실제 DOM 요소로 변환해야 했는데, 다양한 타입(숫자, 문자열, 배열, 함수형 컴포넌트 등)을 고려하여 처리하는 로직을 만들어야 했다.

두 번째로 여러 이벤트 핸들러를 각 요소에 개별적으로 설정하지 않고, **이벤트 위임** 방식을 사용해 성능을 최적화하고 유지보수를 쉽게 해야 했다.

세 번째로 최적화된 렌더링을 위해 가상 DOM과 기존 DOM을 비교해 **필요한 부분만** 업데이트함으로써 불필요한 DOM 조작을 최소화해야 했다.

이 문제들은 성능 최적화와 복잡한 사용자 인터페이스를 관리하기 위해 필수적인 부분들이었다.

하지만 주로 잘 만들어진 프레임워크나 라이브러리를 사용해왔고 이런부분을 쉽게 코드로 작성하기엔 조금 막막한 감이 있었다.

## 2. 시도

코드에서 실제로 해결하려고 노력한 부분은

1. vNode 변환
   1. 가상 노드가 다양한 형태(숫자, 문자열, 배열, 함수형 컴포넌트 등) 일 수 있기 때문에 이를 다룰 수 있는 여러가지 조건을 추가했다. 예를들어 텍스트노드나 배열을 DocumentFragment로 처리했다.
2. 이벤트 관리
   1. 이벤트 위임 방식을 도입하여 DOM에 직접 이벤트를 등록하는 대신, 이벤트가 상위 컨테이너에서 하위로 전파되도록 하여 성능을 최적화 하고, 여러 자식 요소들에 일일이 이벤트를 걸지 않고도 효율적인 이벤트 처리가 가능하도록 시도했다.
3. DOM 업데이트
   1. 새로운 vNode와 기존 DOM을 비교하여 필요한 부분만 업데이트하는 방법을 선택했다. 이를 통해 불필요한 DOM변경을 최소화 했다.

## 3. 해결

```jsx
export function resolveVNodeType(vNode, version) {
  if (!vNode) return document.createTextNode('')
  if (isPrimitive(vNode)) return document.createTextNode(vNode)
  if (Array.isArray(vNode)) return createFragment(vNode)
  if (isFunction(vNode)) return createFunction(vNode)

  return createDomElement(vNode, version)
}
```

resolveVNodeType함수를 만들고 각 vNode의 타입에 따라 텍스트 노드를 반환하거나 DOM요소를 생성하는 로직을 구현했다. 이를통해 가상 DOM을 실제 DOM으로 변환했다.

```jsx
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

이벤트 위임 처리는 이벤트 리스너를 각 요소에 직접 붙이는 대신 eventMap과 setupEventListeners함수를 이용해 이벤트를 상위에서 처리하도록 구현했다. 이를 통해 각 요소에 직접 이벤트 핸들러를 설정하지 않고도 전역에서 이벤트를 처리할 수 있었다.

```jsx
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

DOM업데이트는 updateElement함수를 사용해 이전 노드와 새로운 노드를 비교하여 필요한 부분만 업데이트 하는 방식으로 DOM조작을 최소화함으로써 성능을 향상시켰다. 텍스트 노드 변경, 속성 업데이트, 자식 노드 처리 등의 작업을 재귀적으로 처리했다.

## 4. 알게 된 것

함수형 컴포넌트를 처리하는 방법이 흥미로웠다. 해당 컴포넌트를 호출하고 그 결과를 다시 가상 노드로 변환한 뒤, 재귀적으로 처리하는 방법을 알게 되었고,

이벤트 위임을 개별 요소에 등록하는 것 보다 이벤트 위임 방식이 훨씬 효율적이라는 것을 알았다. 특히 많은 요소가 동적으로 추가됙거나 제거되는 상황에서 큰 차이를 만들 수 있다고 생각했고,

매번 전체 DOM을 새로 그리는 것이 아니라, 변경된 부분만 업데이트하는 방식이 어떻게 성능 최적화에 도움이 되는지 이해하게됐다. 특히 가상 DOM과 실제 DOM을 비교하여 업데이트 하는 과정이 매우 중요하다는 점을 알게 되었다.

## **Keep : 현재 만족하고 계속 유지할 부분**

주어진 과제들이 앞으로도 많이 남아 있는데, 가장 만족스러운 부분은 주도적으로 코드를 짜보고 그 코드를 이해하려고 노력하는 부분에서 내가 조금씩 늘고 있구나? 라고 생각하게 되었다.

리액트 직접 구현하기, 가상돔 만들기, diff알고리즘 구현하기! 라는 과제를 들었을때 저번주의 나는 혼란속에서 과제 발제를 마무리 할 수 있었는데 과제를 풀어가고 모르는부분을 채워가면서 일주일이 지난 이 시점에서는 나는 저번주 보다 성장했구나? 라는 확신을 가질 수 있다는게 정말 만족스럽다.

인프런 CTO이신 이동욱님의 강연을 본적이 있는데 주기적인 회고의 습관이 자신이 얼마나 늘었구나? 얼마나 성장했구나?라고 느낄 수있는 포인트라고 말씀하셨는데, 앞으로의 8주도 8주이지만 앞으로의 남은 커리어를 어떻게 성장해야 할지 감을 잡을 수 있었다. 앞으로도 화이팅~!
