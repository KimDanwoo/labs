---
title: "자바스크립트+리액트 디자인 패턴 스터디 회고: 컴포넌트·상태·성능"
description: "두 달간 『자바스크립트+리액트 디자인 패턴』을 읽고, 무심코 쓰던 컴포넌트·상태·성능 패턴에 이름을 붙이며 남은 생각을 돌아봐요."
publishedAt: "2025-04-01T12:50:36+09:00"
updatedAt: "2026-11-11T12:48:16+09:00"
category: "reading"
tags: ["react","design-pattern"]
legacyUrl: "https://dansoon-dev.tistory.com/16"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

## 코드 구조화 문제를 풀려고 읽은 책

파생 상태를 따로 저장하지 않고 계산하거나, UI 로직을 커스텀 훅으로 분리하는 방식은 이미 쓰고 있었다. 두 달 동안 『자바스크립트 + 리액트 디자인 패턴』을 읽으면서 이 코드들을 어떤 패턴으로 설명할 수 있는지, 어떤 조건에서 쓰는지 다시 살펴봤다.

## 책이 다루는 내용: 컴포넌트·상태·성능 패턴

이 책은 리액트 애플리케이션의 설계와 구조화에 초점을 맞춘다. 컴포넌트를 만드는 방법만이 아니라 확장 가능하고 유지보수하기 쉬운 애플리케이션을 구축하는 방법도 다룬다. 특히 컴포넌트 패턴, 상태 관리 전략, 성능 최적화 패턴이 인상적이었다.

### 컴포넌트 패턴의 진화

기존에 알고 있던 HOC(Higher-Order Components)와 Render Props 패턴부터 최신 React Hooks를 활용한 패턴까지 리액트의 발전 과정에 따른 디자인 패턴의 변화를 깊이 있게 다룬다. HOC는 컴포넌트를 받아 기능이 추가된 새 컴포넌트를 돌려주는 함수이고, Render Props는 렌더링 로직을 함수 prop으로 넘기는 패턴이다. 각 패턴의 장단점을 실제 코드 예시와 함께 설명해서 상황에 맞는 패턴을 선택할 수 있는 기준을 제시해준다.

```ts
// 책에서 소개된 커스텀 훅 패턴 예시
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기값 설정

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

위 훅은 `resize` 이벤트를 구독해 창 크기를 상태로 유지하고, 컴포넌트가 사라질 때 이벤트 리스너를 해제한다. useMemo·useCallback 같은 Hook을 직접 구현해본 과정은 [React Hook을 직접 구현해보자](/posts/implement-react-hooks/)에서 따로 다뤘다.

### 상태 관리 전략

리액트 애플리케이션에서 가장 중요한 부분 중 하나인 상태 관리를 깊이 있게 다룬다. useState부터 useReducer, Context API, 그리고 외부 라이브러리인 Redux, MobX, Recoil까지(Recoil은 지금은 개발이 중단됐다) 다양한 상태 관리 방법을 비교 분석해서 프로젝트 규모와 복잡도에 따라 적절한 선택을 할 수 있게 도와준다.

특히 상태 관리의 분리와 관심사 분리(Separation of Concerns)에 대한 내용이 실무에 즉시 적용 가능했다. Context와 Hook으로 상태 관리를 고친 사례는 [리액트 리팩토링: Context와 Hook을 활용한 상태 관리 개선](/posts/react-context-hook-refactoring/)에 정리했다.

### 성능 최적화 패턴

리액트 애플리케이션의 성능을 최적화하는 다양한 패턴을 소개한다. 불필요한 렌더링을 방지하기 위한 메모이제이션 기법(React.memo, useMemo, useCallback), 코드 스플리팅과 지연 로딩(lazy loading), 가상화(virtualization) 등의 기법을 실제 사례와 함께 설명해 주어 유용했다.

## 이미 쓰고 있던 코드가 디자인 패턴이었다

이 책의 가장 큰 수확은 그동안 내가 직관적으로 작성해왔던 코드 패턴들이 실제로는 잘 정립된 디자인 패턴이었다는 것을 깨달은 점이다. 개발자로서 경험이 쌓이면서 자연스럽게 발전시켜온 코딩 방식이 책에서 체계적으로 설명하는 패턴과 일치한다는 사실이 흥미로웠다.

### 무의식적으로 사용했던 컴포넌트 패턴

그동안 코드의 재사용성을 높이기 위해 직관적으로 작성했던 방식이 사실은 Compound Component 패턴과 유사했다. 여러 컴포넌트를 한 묶음으로 조합해 쓰는 이 패턴은 아래 `Select`와 `Select.Option`처럼 부모와 자식 컴포넌트가 함께 동작하는 구조다. 특히 폼 요소를 구성할 때 자주 사용했던 패턴이 책에서 설명하는 모범 사례와 일치했다.

```jsx
// 내가 자주 사용하던 패턴 (Compound Component와 유사)
function Select({ children, value, onChange, ...props }) {
  return (
    <select value={value} onChange={onChange} {...props}>
      {children}
    </select>
  );
}

Select.Option = function Option({ children, value, ...props }) {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  );
};

// 사용 예시
<Select value={selectedValue} onChange={handleChange}>
  <Select.Option value="option1">옵션 1</Select.Option>
  <Select.Option value="option2">옵션 2</Select.Option>
</Select>
```

다만 이 예시는 네이티브 `select`를 감싼 단순한 형태다. 보통의 Compound Component는 Context로 부모의 상태를 자식과 공유한다.

### 상태 관리에서 확인한 최소 상태 원칙

상태 관리에서도 복잡성을 느낄 때마다 직관적으로 상태를 분리하고 캡슐화했던 방식이 책에서 설명하는 "최소 상태 원칙"과 일맥상통한다는 것을 알게 되었다. 특히 파생 상태를 별도로 저장하지 않고 계산하는 방식을 선호했는데, 이것이 리액트의 권장 패턴이라는 사실이 반가웠다.

### 성능 최적화 방식의 재확인

불필요한 리렌더링을 줄이기 위해 사용했던 메모이제이션 방식이 책에서 설명하는 성능 최적화 패턴과 일치한다는 점도 다시 확인했다. 특히 useMemo와 useCallback을 사용하는 상황에 대한 가이드라인이 내 직관과 일치했다는 점이 인상적이었다.

## 익숙한 코드에 이름을 붙여 보니

커스텀 훅과 컴포지션, 파생 상태를 계산하는 방식처럼 이미 쓰던 코드가 책에 나왔다. 구현을 따라 읽는 동안 각 방식이 책임을 어디에 두고, 어떤 중복을 줄이는지 설명할 수 있었다.

앞으로 리뷰에서 패턴 이름을 쓰더라도 그 이름만으로 선택을 설명하지 않으려 한다. 이 화면에서 어떤 로직을 나눌지, 상태를 따로 저장할 필요가 있는지, 메모이제이션으로 줄이려는 연산이 무엇인지 함께 이야기하고 싶다.

책의 예시를 익숙한 코드와 비교하며 읽을 수 있었다는 점에서 내게는 유용한 스터디였다.
