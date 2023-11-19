---
title: 'SWR 이해하기 -2'
date: 2023-10-11
description: 'SWR(Stale-While-Revalidate)'
thumbnail: './thumbnail.png'
category: 'react'
---

## SWR이 유용한 이유

1. 선언적인 코드를 작성할 수 있어서 개발자도 코드의 의도를 확인하는 데 있어 직관적으로 이해할 수 있다.
2. 동일한 API 요청이 여러번 호출된 경우, 한 번만 실행된다.
3. Global State와 Server State를 분리하여 관리할 수 있다.

## SWR 시작하기

```jsx
import useSWR from 'swr'

const fetcher = (...args) => {
  fetch(...args).then(res => res.json())
}

function Profile() {
  const { data, error, isLoading } = useSWR('/api/user/danwoo', fetcher)

  if (error) return <div>...error</div>
  if (isLoading) return <div>...loading</div>

  return <div>hello {data.name}</div>
}
```

직관적으로 쉽게 코드를 작성할 수 있다.

만약 받아온 데이터를 여러 곳에서 재사용하고 싶다면 어떻게 코드를 작성해야 할까?

데이터에 관련된 hook을 작성하면 된다.

```jsx
function useUser(id) {
  const { data, error, isLoading } = useSWR(`/api/user/${id}`, fetcher)
  return {
    user: data,
    isLoading,
    isError: error
  }
}
```

## useSWR의 리턴 값

```jsx
const { data, error, isLoading, isValidation, mutate } = useSWR(
  key,
  fetcher,
  options
)
```

### 파라미터

- key : 요청을 위한 고유한 키 문자열(또는 함수, 배열, null)
- fetcher : 옵션, 데이터를 가져오기 위한 함수를 반환하는 Promise
- options: swr hook을 위한 옵션 객체

### 반환 값

- data : fetcher가 이행한 주어진 키에 대한 데이터, 만약 로드되지 않았다면 undefined로 남아 있다.
- error : fetcher 가 던진 에러
- isLoading : 진행 중인 요청이 존재하고, 로드된 데이터가 없는 경우 반환
- isValidation : 요청이나 갱신 로딩의 여부 확인
- mutate(data?,option?) : 캐시된 데이터를 뮤테이트 하기 위한 함수이다.

## 전역 설정

SWRConfig 컨텍스트는 모든 SWR hook에 대한 전역 설정을 제공한다.

```jsx
<SWRConfig value={options}>
  <Component />
</SWRConfig>
```

모든 SWR hook은 동일한 fetcher를 사용하여 JSON 데이터를 로드하고 기본적으로 3초마다 갱신한다.

```jsx
import useSWR, { SWRConfig } from 'swr'

function Dashboard () {
	const { data: events } = useSWR('/api/events')
	const { data: projects } = useSWR('/api/projects')
	const { data: user } = useSWR('/api/user, { refreshInterval:0 })
}

function App (){
	return (
		<SWRConfig
			value={{
				refreshInterval : 3000,
				fetcher: (resource,init) => fetch(resource,init).then(res=>res.json()}
			}}
			<Dashboard />
		</SWRConfig>
	)
}
```

## 뮤테이션

mutate는 API를 사용하여, 데이터를 변경하는 방법이 존재한다.

모든 키를 변경할 수 있는 global mutate API가 존재하고, 해당 SWR hook의 데이터만을 변경할 수 있는 bound mutate API가 존재한다.

### Global Mutate

global mutate를 가져오는 권장 방법은 useSWRConfig Hook을 사용하는 것이다.

```jsx
// 권장 방법
import { useSWRConfig } from 'swr'

function App() {
  const { mutate } = useSWRConfig()
  mutate(key, data, options)
}

// 전역 호출
import { mudate } from 'swr'

function App() {
  mutate(key, data, options)
}
```

### Bound Mutate

```jsx
import useSWR from 'swr'

function Profile() {
  const { data, mutate } = useSWR('/api/user', fetcher)

  return (
    <div>
      <h1>My name is {data.name}.</h1>
      <button
        onClick={async () => {
          const newName = data.name.toUpperCase()
          // API에 대한 요청을 종료하여 데이터를 업데이트 합니다.
          await requestUpdateUsername(newName)
          // 로컬 데이터를 즉시 업데이트 하고 다시 유효성 검사(refetch)를 합니다.
          // NOTE: key는 미리 바인딩되어 있으므로 useSWR의 mutate를 사용할 때 필요하지 않습니다.
          mutate({ ...data, name: newName })
        }}
      >
        Uppercase my name!
      </button>
    </div>
  )
}
```

현재 키를 기반으로 데이터를 변경한다. useSWR 함수에 전달된 키와 연결된 키는 캐시에서 데이터를 찾을 때 사용되고, 이렇게 찾은 데이터는 첫번째 인자로 반환된다.
