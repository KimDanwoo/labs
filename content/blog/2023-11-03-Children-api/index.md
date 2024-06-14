---
title: 'React Children API'
date: 2023-11-03
description: 'React Children API 이해하기'
thumbnail: './thumbnail.png'
category: 'react'
isHidden: false
---

## Children APi의 필요성

먼저 React에서 Children이라는 API가 왜 필요한지에 대해서 간단하게 짚고 넘어가자.

우선 이름이 비슷해서 컴포넌트의 children Props와 Children API가 햇갈리기 쉬운데. 소문자로 시작하는 children은 소위 props라고 일컫는 컴포넌트 함수의 매개 변수가 가지고 있는 하나의 속성이며 이를 통해 컴포넌트의 자식이 넘어오게 된다. 대문자로 시작하는 Children은 React에서 children prop 을 효과적으로 다룰 수 있도록 제공하는 API이다.

### Children으로 넘어 올 수 있는 것들

```jsx
// 문자
<Component>Text</Component>
// 숫자
<Component>{100}</Component>
// React 요소
<Component><Input/></Component>
// 함수
<Component>{(item)=><span>{item}</span>}</Component>
// null
<Component/>
// else
<Component>
	Text
  {100}
	<input/>
</Component>
```

이렇게 React는 자식으로 무엇이든지 사용할 수 있도록 상당히 유연하게 설계되어 있기 때문에 우리는 children prop의 자료형(data type)을 예상할 수 없다. 그러므로 children prop을 상대로 직접 프로그래밍 하게 되면 버그가 발생하기 쉬워진다.

이것이 React에서 children이라는 별도의 API를 제공하는 이유이며, 우리는 Children API를 통해서 children prop을 좀 더 안전하게 다룰 수 있다.

## Children API 접근 방법

React의 Children API는 크게 두 가지 방법으로 접근할 수 있다.

첫번째 방법은 react 패키지로 부터 React를 불러온 후에 React.Children에 접근하는 것이다.

```jsx
import React from 'react'

function ReactChildren({ children }) {
  console.log(React.Children)
  return <>{children}</>
}

// { map:f,forEach:f,counf:f,toArray:f,only:f }
```

출력결과를 보면 이렇게 5개의 함수로 이루어졌다는 것을 알 수 있다.

두번째 방법은 react 패키지로 부터 Children을 named import로 바로 불러와서 사용하는 것이다.

```jsx
import { Children } from 'react'

function ReactChildren({ children }) {
  console.log(Children)
  return <>{children}</>
}
```

콘솔에는 동일한 내용이 출력되기 때문에 두 방식 다 사용 가능하다.

## Children.map()

children API에서 아마도 가장 많이 사용되는 함수는 map() 이다.

많은 사람들이 자바스트 배열의 map() 함수를 떠올릴 것이다. 실제로 상당히 흡사한 API를 가지고 있다.

첫번째 인자로는 children prop을 받고 두번째 인자로는 콜백 함수를 받는데 이 콜백 함수에는 각 자식과 인덱스가 인자로 주어지기 때문에, 우리는 이 콜백 함수를 통해서 각 자식을 다른 형태로 변환할 수 있다.

참고로 Children API map() 함수의 시그니처를 타입스크립트로 나타내보면 다음과 같다.

```jsx
map(
	children: unknown,
	fn: (child: unknown, index: number) => unknown
): unknown[]

```

예를들어 홀수,짝수를 구분하는 컴포넌트를 작성해보면

```jsx
function MapComponent({ children }) {
  return React.Children.map(children, (child, i) =>
    i % 2 === 0 ? <b>{child}</b> : <u>{child}</u>
  )
}
```

이제 이 Map 컴포넌트의 자식으로 다음과 같은 3개의 요소를 사용해보면 111,333는 굵은 글씨, 222는 및줄이 그어져 출력될 것이다.

children prop의 자료형이 뭐가 될 지 알 수 없다. 그래서 Children.map()을 사용하면 children prop이 HTML/React 요소나 함수 일 때는 마치 하나의 원소가 들어있는 배열처럼 처리를 해주고, null일 때는 빈 배열처럼 처리를 해준다. 따라서 항상 배열을 다루는 것처럼 안전하게 API를 쓸 수 있다.

## Children.forEach()

Children API의 forEach() 함수는 방금 살펴본 map() 함수와 거의 비슷하지만 두 번째 인자로 넘어가는 콜백 함수가 아무것도 반환하지 않는다는 차이가 있다. 그래서 함수의 시그니쳐를 타입스크립트로 나타내보면 다음과 같다.

```jsx
forEach(
	children: unknown,
	fn: (child: unknown, index: number) => void
): unknown[]
```

보통 forEach() 함수 외부에서 선언된 변수를 갱신하는 용도로 많이 사용되는데

예를 들어, 모든 자식이 담고 있는 문자열의 길이를 더해서 표시해주는 컴포넌트를 작성해보자.

```jsx
function ForEachComponent({ children }) {
	const [count,setCount] = useState(0)
	React.Children.forEach(children, (child) => {
		setCount(prev=>child.length)
	})
	return (
		<>
			{children}
			{`총 글자수는 = ${count}`
		</>
	)
}
```

작성한 ForEach 컴포넌트의 자식으로 다음과 같은 4개의 문자열을 사용해보면 총글자수를 표현해준다.

```jsx
<ForEach>
  {'1'}
  {'2'}
  {'3'}
  {'4'}
</ForEach>
```

child.length 부분 때문에 모든 자식으로 반드시 문자열을 사용해야 하는 점 주의해야 한다.

## Children.count()

Children API의 count() 함수는 자식의 개수를 구할 때 사용하는데 인자로 children prop하나만 받으면 해당 컴포넌트로 넘어온 자식이 몇개인지 반환한다.

children prop이 반드시 배열이 아니더라도 Children.count() 함수는 안전하게 작동한다. 즉 Children.count() 함수는 자식이 null이면 0을 반환, 자식이 하나면 1을 반환한다.

```jsx
function Count({ children }) {
  const count = React.Children.count(children)
  return (
    <>
      {children}
      {`총 자식수 : ${count}`}
    </>
  )
}
```

```jsx
<Count>
  <span>1</span>
  <span>2</span>
  <span>3</span>
</Count>
```

작성한 Count 컴포넌트의 자식으로 다음과 같은 3개의 요소를 사용해보면 총 자식수 : 3이라는 메세지를 볼 수 있다.

## Children.toArray()

Children API의 toArray() 함수는 자식을 일반 자바스크립트 배열로 변환해주는데 자식을 상대로 join(), reverse(), sort(), filter(), reduce() 와 같은 자바스크립트 배열에서 제공하는 함수를 사용하고 싶을때 유용하다.

```jsx
function ToArray({ children }) {
  const array = React.Children.toArray(children)
  return array.filter((child, i) => i % 2 === 0)
}
```

```jsx
<ToArray>
  {'1'}
  {'2'}
  {'3'}
</ToArray>
```

작성한 ToArray컴포넌트의 자식으로 위 코드를 작성하면 화면에 2가 나타날 것이다.

## Children.only()

Children API의 only() 함수는 컴포넌트에 자식이 하나만 넘어왔는지 검증하고 싶을 때 사용할 수 있다. 만약 자식이 없거나 여러 개의 자식이 넘어왔다면 다음과 같은 오류가 발생할 수 있다.

```jsx
React.Children.only expected to receive a single React element child.
```

only는 오직 하나의 children를 받아서 처리하고 싶을 경우에 사용할 수 있따.

```jsx
// 정상
<Only>
	<input/>
</Only>

// 오류
<Only>
	<input/>
	<input/>
</Only>

// 오류
<Only/>

```
