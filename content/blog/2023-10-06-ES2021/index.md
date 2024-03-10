---
title: 'ES2021'
date: 2023-10-06
description: 'ES2021 최신 문법 알아보기'
thumbnail: './thumbnail.png'
category: 'javascript'
isHidden: false
---

## Promise.any

배열을 담은 여러 프로미스 처리 중 하나라도 성공하면 성공 케이스로 이행하고 종료한다.

```tsx
const list = [
  fetch('https://www.google.co.kr/').then(() => 'google'),
  fetch('https://www.naver.com/').then(() => 'naver'),
  fetch('https://www.daum.net/').then(() => 'daum')
]

promise
  .any(list)
  .then(first => console.log(first))
  // google
  .catch(error => console.log(error))
// 모든 프로미스가 reject 됨
// 프로미스 중에 가장 먼저 이행된객체 반환
```

## \***\*숫자 구분 기호\*\*** Numeric separators

성능과 관계없이 big number를 보다 읽기 쉽게 하기 위한 표현이 추가되었다.

```tsx
let billon = 1,000,000,000 // 10억
// number가 아님

let billon = 1_000_000_000 // 10억
// 100000000 // 사용가능
```

## WeakRef

자바스크립트에서 객체 참조는 강하게 유지된다. 하지만 이번에 추가된 WeakRef로 약한 참조를 만들 수 있게 되었고 큰 객체를 가지는 캐시 또는 맵핑에 사용하면 성능상의 이점을 누릴 수 있다.

```tsx
let user = { name: 'kim' }
const weakUser = new WeakRef(user)
user = null // 참조 끊어줌

const timer = setInterval(() => {
  const wUser = weakUser.deref()
  if (wUser) {
    console.log(wUser.name)
  } else {
    console.log('제거 되었습니다.')
    crealInterval(timer)
  }
}, 1000)
// weakRef는 일정시간만 참조한다.
```

```tsx
class MyCache {
  constructor() {
    this.cache = {}
  }
  add() {
    this.cache[key] = new WeakRef(obj)
  }
  get() {
    let cacheRef = this.cache[key].deref()
    if (cachedRef) {
      return cachedRef
    } else {
      return false
    }
  }
}
```

## String.prototype.replaceAll

기존에는 replace의 정규식을 사용하여 지정한 문자열을 변경할 수 있었다. 하지만 ES2021에서는 정규식을 사용하지 않더라고 모든 문자열을 변경할 수 있게 되었다.

```jsx
const str = '오늘의 운동부위는 하체 입니다. 하체 화이팅!'

// 이전
str.replace(/\하체/g, '등')
str.split('하체').join('등')

// ES2021
str.replaceAll('하체', '등')

// 오늘의 운동부위는 등 입니다 등 화이팅!.
```

## 논리 할당 연산자 Logical assignment

논리 연산자와 할당 표현식을 결합한 논리 할당 연산자 3가지가 추가되었다.

```jsx
const temp = 2

// Nullish
let n1
n1 ??= temp // 2

let n2 = 1
n2 ??= temp // 1

// 풀어 쓰기 1
let n3
n3 ?? (n3 = temp)
// 풀어 쓰기 2
if (n3 === null || typeof n3 === 'undefined') {
  n3 = temp
}

const temp = 2

// OR
let or = 0
or ||= temp // 2

// 풀어 쓰기 1
or || (or = temp)
// 풀어 쓰기 2
if (!or) {
  or = temp
}

const temp = 2

// AND
let and = 1
and &&= temp // 2

// 풀어 쓰기 1
and && (and = temp)
// 풀어 쓰기 2
if (and) {
  and = temp
}
```
