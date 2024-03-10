---
title: 'Throttle, Debounce 알아보기'
date: 2023-09-20
description: 'Throttle, Debounce with next.js'
thumbnail: './thumbnail.png'
category: 'javascript'
isHidden: false
---

## 소개

디바운스 및 스로틀은 햇갈릴 수 있는 개념이지만 개념만 확실하게 파악한다면 각각 상황에 따라서 어떤걸 사용해야 할지 알 수 있다.

### Throttle

자주 발생하는 이벤트를 일관성있게 제한하기 위해 사용할 수 있다.
스로틀은 고정된 시간 프레임에 바인딩 되므로 이벤트 리스너는 이벤트의 중간 상태를 실행할 준비를 해야한다. 즉 일정 시간마다 함수를 호출한다.

```typescript
import { useEffect, useState } from 'react'

export default function useThrottle (callbackFunc: () => void, time: number): any => {
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    if (!isWaiting) {
      callbackFunc()
      setIsWaiting(true)

      setTimeout(() => {
        setIsWaiting(false)
      }, time)
    }
  }, [callbackFunc, isWaiting, time])
}
```

### Debounce

디바운스된 함수는 마지막 호출 이후 N 시간 이 지난 후에 호출된다.
계속해서 요청하면 중지하고 그 멈추면 딜레이된 시간 후 실행된다.
자주 사용하는 이벤트에 중간상태가 필요없고 이벤트의 최종 상태에 응답하려고 할 때 유용하다.

```typescript
import { useState, useEffect } from 'react'

export default function useDebounce(value: string, delay: number = 500) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debounced
}
```
