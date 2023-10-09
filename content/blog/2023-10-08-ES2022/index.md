---
title: 'ES2022'
date: 2023-10-08
description: 'ES2022 최신 문법 알아보기'
thumbnail: './thumbnail.png'
---

## Class: private,static

```javascript
class Student {
	name = "danwoo",
	#age = 20,
	static isHuman = true
}

new Student().age // undefined
new Student().name // danwoo
Student.isHuman // true
```

속성들을 더이상 constructor안에 쓰지 않아도 된다. 그냥 클래스 안에 위와같이 선언하면 된다.

다만 생성자로부터 매개변수를 사용해야할 때는 여전히 constructor함수를 사용해야 한다.

클래스 내부에서만 쓸 수 있는 속성인 private가 추가되었다.

앞에 #만 붙이면 된다.

static속성은 앞에 static을 붙이면 된다. static은 new를 사용하지 않고 쓰는 속성을 의미한다. Array.isArray 같은 메서드가 있다.

또한 static속성 앞에 #을 붙여서 private로 만들 수 있다. 마찬가지로 클래스 내부에서만 사용할 수 있다.

## at

배열과 문자열에 at메서드가 추가되었다.

```jsx
;[1, 2, 3]
  .at(2) // 3
  [(1, 2, 3)].at(-1) // 3
'danwoo'.at(-1) // 'o'
```

-1을 사용하여 마지막 값에 접근하지 못했지만 이제 at으로 접근 가능하다.

## Object.hasOwn()

Object에 hasOwn 메서드가 추가되었다. 객체 안에 속성이 있는지 체크한다.

```jsx
Object.hasOwn({ name: 'danwoo' }, 'name') // true
Object.hasOwn({ age: 13 }, 'name') // false
```

## Error.Cause

에러 객체에 좀 더 구체적인 원인을 적는 cause 속성이 추가되었다.

```jsx
const e = new Error('error',{ cause: '에러의 원인' }
e.cause // '에러의 원인'
```

## Top-Level await

비동기 처리를 할때 await을 최상위에서 사용할 수 있다.

```jsx
import { getUsers } from 'api/user'
const users = await getUsers
```
