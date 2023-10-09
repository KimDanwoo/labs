---
title: 'ES2023'
date: 2023-10-09
description: 'ES2023 최신 문법 알아보기'
thumbnail: './thumbnail.png'
---

## Array find from last

Array와 TypeArray 프로토타입에 findLast(),findLastIndex() 메서드가 추가됬다.

```jsx
// 기존 방식
const arr = [5, 10, 15, 20]
const result = [...arr].reverse().find(i => i > 16)
console.log(result) // 20

// Array.prototype.findLast()
const arr = [5, 10, 15, 20]
const result = arr.findLast(i => i > 16)
console.log(result) // 20

// Array.prototype.findLastIndex()
const arr = [5, 10, 15, 20]
const result = arr.findLastIndex(i => i > 16)
console.log(result) // 3
```

## Array Copy

기존 Array.prototype 의 reverse(), sort(), splice() 메서드는 원본 배열을 변형시켰다. 기존 원본 배열을 변형시키지 않고 복사본 배열을 반환하는 기능이 추가되었다.

1. toReversed()
2. toSorted()
3. toSpliced(start,deleteCount)
4. toWith(index,value) // 해당 index의 값을 value로 바꾼다.

```jsx
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Array.prototype.toReversed()
const reversed = numbers.toReversed()
console.log(reversed) // [9, 8, 7, 6, 5, 4, 3, 2, 1]
console.log(numbers) // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Array.prototype.toSorted()
const sortedArr = numbers.toSorted()
console.log(sortedArr) // [1, 2, 3, 4, 5, 6, 7, 8, 9]
console.log(numbers) // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Array.prototype.toWith()
const replaceWith = numbers.with(1, 100)
console.log(replaceWith) // [1, 100, 3, 4, 5, 6, 7, 8, 9]
console.log(numbers) // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Array.prototype.toSpliced()
const splicedArr = numbers.toSpliced(0, 4)
console.log(splicedArr) // [5, 6, 7, 8, 9]
console.log(numbers) // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```
