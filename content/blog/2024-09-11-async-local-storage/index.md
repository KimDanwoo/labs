---
title: 'React에서 AsyncLocalStorage 활용하기: 비동기 상태 관리'
date: 2024-09-11
description: 'Node.js에서는 AsyncLocalStorage를 통해 비동기 흐름에서 데이터를 안전하게 관리할 수 있다. React는 주로 클라이언트 측 라이브러리지만, AsyncLocalStorage는 서버 사이드 렌더링(SSR) 환경에서 유용하게 사용될 수 있다. 이번 글에서는 React와 AsyncLocalStorage를 연계해 사용하는 방법을 알아보자.'
thumbnail: './thumbnail.png'
category: 'node'
isHidden: false
---

Node.js에서는 `AsyncLocalStorage`를 통해 비동기 흐름에서 데이터를 안전하게 관리할 수 있다. React는 주로 **클라이언트 측 라이브러리**지만, `AsyncLocalStorage`는 **서버 사이드 렌더링(SSR)** 환경에서 유용하게 사용될 수 있다. 이번 글에서는 React와 `AsyncLocalStorage`를 연계해 사용하는 방법을 알아보자.

### 왜 React에서 `AsyncLocalStorage`를 사용할까?

React는 클라이언트에서 UI를 구성하지만, **서버 사이드 렌더링(SSR)**을 통해 초기에 페이지를 렌더링한 뒤, 그 결과를 클라이언트에 보내는 경우가 많다. 특히 **Next.js** 같은 프레임워크는 SSR을 기본적으로 지원하는데, 이때 **비동기적으로 데이터를 불러와야 하는 경우**가 있다. `AsyncLocalStorage`는 이러한 상황에서 **비동기 데이터의 문맥(Context)을 유지**하는 데 도움을 준다.

예를 들어, **각 사용자 요청에 따른 상태 관리**나 **로그 추적**을 SSR 환경에서 처리할 때, `AsyncLocalStorage`를 사용하면 각 요청의 상태를 안전하게 유지할 수 있다.

### React와 `AsyncLocalStorage` 사용 예시

다음은 **Next.js** 환경에서 `AsyncLocalStorage`를 사용하여 각 요청마다 고유한 상태를 유지하는 방법을 보여주는 예시다.

```jsx
import { AsyncLocalStorage } from 'async_hooks'
import { useEffect } from 'react'

const asyncLocalStorage = new AsyncLocalStorage()

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 클라이언트 측에서의 비동기 처리를 위한 예시
    asyncLocalStorage.run(new Map(), () => {
      const store = asyncLocalStorage.getStore()
      store.set('userSession', 'sessionId123') // 세션 ID를 저장

      someAsyncOperation().then(() => {
        const sessionId = asyncLocalStorage.getStore().get('userSession')
        console.log(`세션 ID: ${sessionId}`)
      })
    })
  }, [])

  return <Component {...pageProps} />
}

function someAsyncOperation() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('완료')
    }, 1000)
  })
}
```

### 사용 설명

1. **서버 사이드 렌더링**: React와 Next.js에서 SSR을 사용할 때, 각 요청마다 고유한 상태나 세션을 유지하는 것이 중요하다. `AsyncLocalStorage`를 사용하면 **비동기 흐름에서도 해당 요청의 상태를 유지**할 수 있다. 위 코드에서는 비동기 함수 `someAsyncOperation`이 호출되면서도, 해당 요청의 세션 ID가 유지된다.
2. **클라이언트와 서버에서 사용**: `AsyncLocalStorage`는 **서버 측에서 비동기 데이터 관리**에 강력한 도구이지만, 클라이언트 측에서도 비슷한 흐름을 사용할 수 있다. 다만 클라이언트 환경에서는 보통 비동기 처리를 `useState`나 `useEffect`로 하므로 `AsyncLocalStorage`가 필요한 경우는 드물다.

### 결론

`AsyncLocalStorage`는 React에서 **서버 사이드 렌더링(SSR)**을 사용할 때 특히 유용하다. 각 요청마다 비동기적으로 데이터를 불러와야 할 때, 이를 안전하게 관리하고, 데이터를 전파하는 역할을 한다. 특히 로그 추적, 상태 관리, 사용자 세션 유지 등의 상황에서 큰 도움이 될 수 있다.

React와 함께 서버 측에서 데이터를 다뤄야 할 때, `AsyncLocalStorage`를 활용하여 비동기 작업 간 문맥을 안전하게 유지하고 관리해보자. 😊
