---
title: "Vue 3 ref와 reactive 차이, 그리고 React useState 톺아보기"
description: "Vue 3의 Proxy 반응성 안에서 ref와 reactive가 어떻게 다른지 파헤치고, React useState와의 차이, 데이터 형태에 따른 선택 기준을 정리해요."
publishedAt: "2025-10-18T14:31:44+09:00"
updatedAt: "2026-11-10T18:24:00+09:00"
category: "dev"
tags: ["vue","react"]
legacyUrl: "https://dansoon-dev.tistory.com/22"
thumbnail: "./thumbnail.jpg"
cover: "./cover.jpg"
---

## 들어가며: 기본형은 ref, 객체는 reactive라는 말

"기본형은 ref, 객체는 reactive로 써야 합니다."

Vue 3을 쓰다 보면 이런 말을 자주 듣습니다. 하지만 실무에서 보면 꼭 그렇지 않습니다.

대부분의 코드베이스에서는 ref만 쓰는 경우가 훨씬 많습니다. 객체형 데이터도 ref로 감싸 쓰는 경우가 흔하고 reactive를 거의 안 쓰는 프로젝트도 있습니다.

이게 단순히 팀 컨벤션 때문일까요? 저는 이 부분이 항상 명확히 와닿지 않았습니다.

그래서 ref와 reactive가 어떻게 다르게 작동하는지, React의 useState와는 구조가 어떻게 다른지 직접 파헤쳐 봤습니다.

## 1\. Vue의 반응성, Proxy로 시작하다

Vue 3의 반응성 시스템은 Proxy 위에서 돌아갑니다. Proxy는 JavaScript에 내장된 객체로, 대상 객체의 읽기·쓰기 같은 동작을 가로채 직접 정의할 수 있게 해줍니다.

모든 reactive 객체는 Proxy로 감싸져서 getter/setter 동작을 가로채며 의존성을 추적(track)합니다.

```javascript
const state = reactive({ count: 0 })

state.count // get → track('count')
state.count++ // set → trigger('count')
```

Vue 내부에는 이런 구조가 있습니다.

```text
targetMap (WeakMap)
 └── target(object)
       └── key → Set(effect1, effect2, ...)
```

-   track()은 “누가 이 데이터를 읽었는지”를 기록합니다.
-   trigger()는 “그 데이터가 바뀌면 어떤 effect를 다시 실행할지”를 호출합니다.

effect는 반응형 데이터를 읽는 함수입니다. 컴포넌트의 렌더 함수도 effect로 동작합니다.

이게 Vue의 근본입니다.

“누가 무엇을 읽었는지 기억하고, 그 데이터가 바뀌면 그 사람만 깨운다.”

## 2\. reactive가 모든 걸 감시하지 못하는 이유

Proxy는 객체만 감쌀 수 있습니다.

그래서 다음 코드는 작동하지 않거나, 원하는 반응성을 얻지 못합니다.

```javascript
let count = reactive(0) // ❌ 원시값은 Proxy로 감싸지 못해 0이 그대로 돌아옴
count++ // 숫자만 바뀔 뿐 반응성 없음
```

Proxy는 객체의 프로퍼티 접근(get, set)을 가로채는 기능이기 때문에 숫자나 문자열처럼 프로퍼티가 없는 값에는 적용할 수 없습니다.

그래서 Vue는 별도의 래퍼를 만들었습니다 — ref().

```javascript
const count = ref(0)
count.value++ // 내부적으로 track(), trigger() 실행
```

ref는 단일 값을 { value } 형태의 객체로 감싸고, value를 읽고 쓸 때 track과 trigger를 호출하게 만든 래퍼입니다.

## 3\. ref와 reactive의 진짜 차이

| 항목 | ref | reactive |
| --- | --- | --- |
| **대상** | 모든 값 (기본형, 객체 모두) | 객체, 배열, Map, Set |
| **구현 방식** | { value } 형태로 감싸고 get/set 재정의 | Proxy로 전체 객체 감시 |
| **접근 방식** | .value 필요 | 바로 점 표기법 사용 가능 |
| **반응성 범위** | .value 추적 (객체를 넣으면 내부는 reactive로 깊게 추적) | 속성 단위 추적 (Deep Reactivity) |
| **주요 목적** | 단일 상태 관리 | 구조적 데이터 관리 |

## 4\. React의 useState는 완전히 다른 접근을 한다

Vue의 ref와 reactive가 “데이터 중심”이라면 React의 useState는 “렌더링 중심” 구조로 설계되어 있습니다.

React는 Proxy나 getter/setter를 사용하지 않습니다. 대신 “Fiber Reconciler”라는 내부 엔진이 “상태 변경이 감지된 컴포넌트를 다시 렌더링”합니다.

### 4-1. useState의 동작 구조 간단히 보기

```javascript
function Counter() {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

이때 React 내부에서는 이런 흐름이 일어납니다.

1.  **컴포넌트 렌더링**
    -   useState(0)이 호출되면 React는 현재 Fiber(컴포넌트 인스턴스)에 상태 슬롯을 할당합니다.
    -   이 슬롯은 \[state, queue\] 형태로 저장됩니다.
2.  **setState 호출 시**
    -   setCount(count + 1)이 호출되면, 해당 Fiber에 “업데이트 큐(update queue)”가 추가됩니다.
    -   React는 “이 컴포넌트를 다시 렌더링해야 한다”고 스케줄링합니다.
3.  **Fiber Reconcile 단계**
    -   React는 새 상태(count + 1)로 컴포넌트를 다시 호출하고
    -   이전 Virtual DOM과 비교(diff)합니다.
4.  **Commit 단계**
    -   변경된 부분만 실제 DOM에 반영합니다.

즉, React는 “상태 변경 → 컴포넌트 재실행 → diff 반영”의 사이클을 갖고 있습니다.

이건 Vue처럼 “데이터의 일부만 업데이트”하는 것이 아니라, “컴포넌트 전체를 다시 실행하는 구조”입니다.

React가 diff로 변경분만 DOM에 반영하는 원리는 [내가 리액트를 직접 만들어봤다?](/posts/build-my-own-react/)에서 직접 구현해 봤고, 프레임워크 없이 상태 변경에 따른 UI 업데이트를 수동으로 처리한 경험은 [Vanilla JavaScript로 SPA 만들기](/posts/vanilla-js-spa/)에 정리했습니다.

### 4-2. 요약 비교

| 구분 | Vue (ref/reactive) | React (useState) |
| --- | --- | --- |
| **핵심 원리** | Proxy 기반 데이터 추적 | Fiber 기반 컴포넌트 재렌더링 |
| **업데이트 단위** | 속성 단위 | 컴포넌트 단위 |
| **렌더링 방식** | 데이터 변경 시 필요한 effect만 재실행 | setState 시 해당 컴포넌트 전체 렌더 |
| **성능 최적화 포인트** | fine-grained reactivity | diff reconciliation |
| **개발자 관점** | "데이터가 바뀌면 그 데이터만 반응" | "상태가 바뀌면 컴포넌트 전체가 반응" |

Vue는 “데이터 중심”, React는 “렌더링 중심”입니다.

그래서 Vue는 reactive 시스템의 정밀도를, React는 렌더링 파이프라인의 단순성을 택했습니다.

## 5\. 실무에서 reactive보다 ref가 더 자주 쓰이는 이유

1.  **타입 안정성**: reactive는 중첩된 ref를 자동으로 풀어 주기 때문에 반환 타입이 넘긴 타입과 달라질 수 있습니다. 공식 문서도 reactive에 제네릭 인자를 쓰지 말라고 안내합니다. 반면 ref는 Ref\<T> 타입으로 명확하게 추론됩니다.
2.  **구조분해 안정성**: reactive 객체를 구조분해하면 반응성이 깨집니다. const { count } = state에서 count가 원시값이면 값만 복사되어 이후 변경이 반영되지 않습니다(중첩 객체를 꺼내면 그 객체 자체의 반응성은 남습니다). 반면 ref는 값 자체가 독립적으로 추적됩니다.
3.  **코드 일관성**: Composition API 안에서 .value 접근을 명시적으로 하므로 “이건 반응형 데이터구나”라는 인식이 명확합니다.
4.  **성능 제어 용이성**: 기본 ref도 객체를 넣으면 내부를 깊게 반응형으로 만들지만, 깊은 감시가 필요 없는 큰 값은 shallowRef로 바꿔 최상위 값만 추적하게 할 수 있습니다.

## 6\. reactive만 사용했을 때의 문제점

| 문제 | 설명 |
| --- | --- |
| **Primitive 감싸기 불가** | Proxy는 객체만 감쌀 수 있어 기본형에서는 동작하지 않음 |
| **구조분해 시 반응성 손실** | Proxy 참조가 끊기면 반응성도 끊김 |
| **Deep Proxy 비용** | 모든 하위 객체를 Proxy로 감싸는 오버헤드 |
| **타입이 달라질 수 있음** | 중첩된 ref를 풀어 주는 과정에서 반환 타입이 넘긴 타입과 달라짐 |

```javascript
const state = reactive({ count: 0 })
const { count } = state // ❌ 값만 복사되어 반응성이 끊김
```

## 7\. ref만 사용했을 때의 문제점

| 문제 | 설명 |
| --- | --- |
| **.value 중첩** | 객체 상태에서 .value 접근이 반복되어 가독성 저하 |
| **깊은 반응성 비용** | 객체를 넣으면 내부를 reactive로 감싸 깊게 추적함(최상위만 추적하려면 shallowRef) |
| **Composition 코드 일관성 저하** | .value 남발로 코드 통일성 저하 |

```javascript
const user = ref({ name: 'Danwoo', age: 28 })
user.value.name = 'Robin' // 반응하지만 구조적으로 불편
```

## 8\. 팀 규칙이 아니라 데이터의 형태로 결정해야 한다

Vue의 반응성 시스템은 언어의 제약(Proxy 한계) 위에 만들어졌습니다.

그래서 단순히 “팀 규율”로 결정할 문제가 아니라, 데이터의 형태와 생명주기로 결정해야 합니다.

> 단일 값, 짧은 생명주기 → ref()  
> 구조적 상태, 여러 속성의 일관된 변경 → reactive()  
> 복잡한 구조에서는 혼합 사용 (reactive + ref)

React의 useState가 “렌더링 단위의 재실행”이라면 Vue의 ref/reactive는 “데이터 단위의 반응성”입니다.

결국 중요한 건 “무엇이 다시 그려지는가”를 이해하는 것입니다. 그걸 알면 규율이 아니라 설계의 판단으로 선택할 수 있습니다.

---

## 참고 자료

-   [**Vue 3 Deep Dive with Evan You (Vue Mastery)**](https://www.vuemastery.com/courses/vue3-deep-dive-with-evan-you/)
-   [**A deep dive into React Fiber (LogRocket Blog)**](https://blog.logrocket.com/deep-dive-react-fiber/)
