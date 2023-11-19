---
title: 'Redux'
date: 2023-08-26
description: 'redux의 도입과 설명'
thumbnail: ./thumbnail.png
category: 'redux'
---

## Redux란?

### 정의

리덕스는 javascript 상태관리 라이브러리이다. react뿐만 아니라 vue,angular,jquery등 다양한 프레임 워크와 작동되게 설계하였다.

### 상태(state) 란 무엇일까?

**상태는 단지 데이터이다.** 사용자의 이름, 주소 이거나, 로그인 여부,페이지가 로딩중인지에 대한 것들과 같은 어플리케이션 데이터 집합이라고 생각하면 될것이다. 어플리케이션의 상태는 사용자의 동작이나 API응답 등으로 인해 언제든 바뀔수 있다.

## Redux의 등장 배경

### MVC패턴

리덕스가 등장하기 전 프론트엔드에서의 데이터 흐름을 관리하는 방식은 MVC 패턴이였다.

- Model
  - 데이터의 비즈니스 로직
  ```
  class CounterModel {
    constructor() {
      this.count = 0
    }

    increment() {
      this.count += 1
    }

    getCount() {
      return this.count
    }
  }
  ```
- View
  - 사용자 인터페이스 및 표현 로직
  ```
  import React from 'react'

  function CounterView({ count, onIncrement, onDecrement }) {
    return (
      <div>
        <p>{count}</p>
        <button onClick={onIncrement}>Increment</button>
      </div>
    )
  }
  ```
- Controller
  - 사용자 입력과 상호작용 관리
  ```
  import React, { useState } from 'react'
  import CounterModel from './CounterModel'
  import CounterView from './CounterView'
  function CounterController() {
    const model = new CounterModel()
    const [count, setCount] = useState(model.getCount())

    const handleIncrement = () => {
      model.increment()
      setCount(model.getCount())
    }

    return <CounterView count={count} onIncrement={handleIncrement} />
  }
  ```

### MVC 패턴의 특징

MVC패턴은 **양방향 데이터 흐름**이다. Model이 변경되면 View또한 변경되고, 사용자에 의해 view에서 변경이 되면 Model또한 변경이 되기 때문에 양방향성 데이터 흐름이다. 이런 흐름은 설계가 간단하고 코드 또한 작성하기 쉬운 장점이 있는데 단점은 규모에서 온다. 어플리케이션의 규모가 커진다면 하나의 Model이 여러 View를 조작하거나 하나의 View가 여러개의 Model을 조작한다고 가정한다면, 데이터흐름을 파악하기 어려워진다. 버그라도 발생한다면 흐름 추적하는데 시간이 소요된다.

### MVC 패턴의 단점

양방향 데이터 흐름이로 인한 **데이터 복잡성**과 **Props Drilling이 발생**한다.

## Flux

### 특징

Flux는 MVC패턴으로 인한 복잡한 상황을 개선하는것이 목적이었고, 그 방한으로 **단방향 데이터 흐름을 적용**하였다. **View는 데이터를 변경시키지 않고 Action을 일으키고 Action은 반드시 Dispatcher를 통한 데이터 변경을 해야한다.** View는 변경된 데이터를 Store를 통해 다시 전달받게 된다. 이러한 단방향 데이터 흐름은 기존의 양방향 데이터흐름인 MVC패턴에 비해 데이터 복잡성을 덜어주고 상태의 전이 현상을 없애준다.

> Redux = Reducer + Fl(ux)

## Redux

### Redux 사용 전

React는 기본적으로 단방향 데이터 흐름을 가진다. 부모 컴포넌트에서 자식 컴포넌트들로 데이터를 props로 내려 보내준다는 것을 의미한다.

각 컴포넌트는 서로 독립적이고 고유의 state를 해당 컴포넌트 이외에 접근할 수 없다. 즉 하향식으로 데이터를 넘겨줄 수 있지만 상향식으로는 데이터가 이동 못한다. 그러나 자식 컴포넌트에 의해 부모 컴포넌트의 state가 변하는 상황이 있는데, 이런 경우를 해결하기 위해 Lifting State Up 이 존재한다. 상위 컴포넌트의 상태를 변경하는 함수 자체를 하위 컴포넌트로 전달하고, 하위 컴포넌트를 실행하면 된다.

핵심은 state가 업데이트 되고 앱 전체로 퍼지는 방식이 복잡해지는것이다. 해당 state가 필요없는 컴포넌트 까지 들러야 하기 때문에 흐름이 복잡해진다.

### Redux 사용 후

Redux구조는 state의 변경은 Reducer를 통해서 일어나며 state는 store에 저장된다. 그리고 데이터가 필요한 곳에 뿌려준다. 여전히 부모 컴포넌트에서 자식 컴포넌트로 state를 넘겨줄 수 있지만 이 state의 원천은 항상 Store가 되어야 한다.

### Redux의 3가지 원칙

1. Single source of truth (진실은 하나의 근원으로부터)
   - **동일한 state(데이터)는 항상 같은 곳에서 가지고 온다.**
   - 스토어라는 하나뿐인 데이터 공간이 있다는 의미
2. State is read-only (상태는 읽기 전용이다.)
   - view에서 일어나는 이벤트는 직접 데이터를 건들지 않고 **Action을 통해 요청**만 한다.
   - 리엑트에서는 setState 메소드를 활용해야만 상태 변경이 가능하듯
   - 리덕스에서도 **Action이라는 객체를 통해서만 변경**할 수 있다.
3. Changes are made with pure functions (변화는 순수 함수로 작성되어야 한다.)
   - Action에 의해 상태 트리가 어떻게 변화하는 지를 지정하기 위해 **순수 함수로 Reducer를 작성**한다.
   - Reducer는 반드시 이전의 **state와 Action을 매개변수**로 받는다.
   - Reducer는 결과값으로 이전의 state를 변경시키지 않고 **new state를 만들어 변환**한다.

### 그 외 참조할 설계 원칙

1. **사이드 이펙트를 위해 미들웨어를 사용하기**:
   - Redux는 기본적으로 비동기 작업을 지원하지 않는다.
   - 비동기 작업이나 다른 side effect 처리하기 위해 미들웨어 사용하기
   - redux-thunk, redux-saga
2. **정규화된 상태 구조를 유지하기**:
   - 중복 데이터를 피하기 위해 상태 구조를 정규화 한다. 이렇게 하면 데이터를 쉽게 업데이트하고 관리할 수 있다.
3. **개발 도구를 활용하세요**:
   - Redux DevTools를 사용하여 상태 변화와 액션을 실시간으로 모니터링하고 디버깅할수있다.
4. **상태의 불변성을 유지해야한다**:
   - 상태를 변경할 때는 항상 새로운 객체나 배열을 반환하여 상태의 불변성을 유지 해야한다.
   - 이를 위해 **`Object.assign()`**, 스프레드 연산자, 불변성을 지원하는 라이브러리(예: immer) 등을 활용할 수 있다.
5. **상태 접근과 action dispatch 를 최소화하세요**:
   - 불필요하게 상태를 빈번하게 접근하거나 액션을 발송하는 것은 성능에 부정적인 영향을 줄 수 있다.
6. **재사용 가능한 reducer와 액션을 작성해야한다**:
   - 비슷한 동작의 코드를 반복하지 않도록 **reducer**와 액션을 재사용 가능하게 작성한다.
