---
title: 'Destructuring'
date: 2023-09-24
description: '객체구조를 제거 한다는 의미가 있다.'
thumbnail: './thumbnail.png'
---

## 1. Destructuring 이란

- 객체 구조(structure)를 제거(de) 한다는 의미가 있다.
- Destructuring은 객체의 구조를 분해 후 할당이나 확장과 같은 연산을 수행한다.
- 자료형에 따라 다름과 같은 방식으로 나뉜다.
  1. 객체 Destructuring
  2. 배열 Destructuring

### 1-1. 객체 Destructuring

- 값 할당

```jsx
let { id, name } = { id: 123, name: 'danwoo' }
console.log(id) // 123
console.log(name) // danwoo
```

- 새로운 변수 이름 할당

```jsx
let highSchool = { className: '개나리', classNumber: 1 - 2 }
let { className: name, classNumber: number } = highSchool
console.log(name) // '개나리'
console.log(number) // '1-2'
```

- 중첩된 객체의 구조 분해

```jsx
const metadata = {
  title: 'Scratchpad',
  translations: [
    {
      locale: 'de',
      localization_tags: [],
      last_edit: '2014-04-14T08:43:37',
      url: '/de/docs/Tools/Scratchpad',
      title: 'JavaScript-Umgebung'
    }
  ],
  url: '/en-US/docs/Tools/Scratchpad'
}

const {
  title: englishTitle,
  translations: [{ title: localeTitle }]
} = metadata

console.log(englishTitle) // "Scratchpad"
console.log(localeTitle) // "JavaScript-Umgebung"
```

- for of 반복문과 구조 분해

```jsx
const people = [
  {
    name: '김철수',
    family: {
      mother: '김영희',
      father: '김진수'
    },
    age: 35
  },
  {
    name: '김진혁',
    family: {
      mother: '최영희',
      father: '김준수'
    },
    age: 25
  }
]

for (let {
  name,
  family: { father }
} of people) {
  console.log(`이름은 :${name} 아빠는 : ${father}`)
}

// "이름은: 김철수 아빠는: 김진수"
// "이름은: 김진혁 아빠는: 김준수"
```

- destructuring 매개변수 선언

```jsx
function profile(obj) {
  var name = ''
  name = obj.name !== undefined ? obj.name : 'none'
}

profile({ name: 'boy' })
```

- 함수 매개변수로 전달된 객체로부터 분해

```jsx
const checkList = [
  { id: 1, check: true, title: '할일1' },
  { id: 2, check: false, title: '할일2' },
  { id: 3, check: false, title: '할일3' }
]
const checkedItem = checkItems.filter(({ check }) => check)
console.log(checkedItem) // [ { id: 1, check: true, title:'할일1' } ]

function userId({ id }) {
  return id
}

function userName({ displayName, fullName: { firstName } }) {
  console.log(`name: ${displayName} fullName: ${firstName}`)
}

const user = {
  id: 42,
  displayName: '철수',
  fullName: {
    firstName: '김',
    lastName: '철수'
  }
}
console.log(userId(user)) // "42"
userName(user) // "name: 철수 fullName: 김"
```

### 1-2. 배열 Destructuring

```jsx
const arr = [1, 2, 3]
const [one, two, three] = arr

console.log(one, two, three) // 1 2 3
```

```jsx
let x, y, z;
[x, y, z] = [1, 2, 3];

// 위의 구문과 동치이다.
let [x, y, z] = [1, 2, 3
```

```jsx
let x, y, z
;[x, y] = [1, 2]
console.log(x, y) // 1 2
;[x, y] = [1]
console.log(x, y) // 1 undefined
;[x, y] = [1, 2, 3]
console.log(x, y) // 1 2
;[x, , z] = [1, 2, 3]
console.log(x, z) // 1 3

// 기본값
;[x, y, z = 3] = [1, 2]
console.log(x, y, z) // 1 2 3
;[x, y = 10, z = 3] = [1, 2]
console.log(x, y, z) // 1 2 3

// spread 문법
;[x, ...y] = [1, 2, 3]
console.log(x, y) // 1 [ 2, 3 ]
```

```jsx
const today = new Date() // Tue May 21 2019 22:19:42 GMT+0900 (한국 표준시)
const formattedDate = today.toISOString().substring(0, 10) // "2019-05-21"
const [year, month, day] = formattedDate.split('-')
console.log([year, month, day]) // [ '2019', '05', '21' ]
```
