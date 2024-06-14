---
title: 'SWR 이해하기'
date: 2023-09-25
description: 'SWR(Stale-While-Revalidate).'
thumbnail: './thumbnail.png'
category: 'react'
isHidden: false
---

## 1. SWR이란 (Stale-While-Revalidate)

SWR은 먼저 캐시(stale)로 부터 데이터를 반환한 후, fetch요청(revalidate)을 하고, 최종적으로 최신화된 데이터를 가져오는 전략이다.

## 1-1. SWR을 왜 사용할까?

최상위 레벨 컴포넌트에서 useEffect를 사용해 데이터를 가져오고, props를 이용해 자식 컴포넌트에 전달하는 방법으로 서버의 데이터를 로컬 상태 변수로 사용이 가능하다.

하지만, 보통 최상위 레벨 컴포넌트에서 가져온 모든 데이터를 유지하고, 데이터의 전달을 위해서 하위 컴포넌트에 값을 전달하는 과정에서 서버로부터 가져오는 데이터의 수가 많아진다면 코드는 점점 유지하기가 힘들어진다.

```jsx
// page 컴포넌트
function Page() {
  const [user, setUser] = useState(null)
  const fetchUser = async () => {
    const { data } = await api.getUser()
    setUser(data)
  }
  useEffect(() => {
    fetchUser()
  }, [])

  if (!user) return <Spinner />
  return <Content user={user} />
}

// 자식 컴포넌트
function Content({ user }) {
  return <h1>Welcome back, {user.name}</h1>
}
```

context나 여러 상태관리 라이브러리를 이용해 전역 상태를 이용한다면 props 전달을 피할 수 있지만 API호출을 처리하는 비동기 호출의 문제가 여전히 존재한다.

즉, 페이지 콘텐츠 내 컴포넌트 들은 동적일 수 있으며, 최상위 레벨 컴포넌트는 그 자식 컴포넌트가 필요로 하는 데이터가 무엇인지 알 수 없는 경우가 발생한다.

SWR은 위 문제를 해결하기 위해 등장했으며, SWR hook을 사용해서 아래와 같이 리팩토링할 수 있다.

```jsx
// page 컴포넌트
function Page() {
  return (
    <div>
      ... // 다른 컴포넌트
      <Content />
    </div>
  )
}

// 자식 컴포넌트
function Content() {
  const { user, isLoading, error } = useUser()
  if (error) return <ErrorMessage />
  if (isLoading) return <Spinner />
  return <h1>안녕하세요, {user.name}님</h1>
}
```

데이터는 데이터가 필요한 컴포넌트로 범위가 제한되며, 모든 컴포넌트는 독립적이다.

SWR을 사용하면, 로컬 상태변수를 원격 상태와 연결된 데이터 스트림으로써 바라볼 수 있도록 데이터 fetching 단계를 추상화 한다.

### 1-2. 어떻게 원격 서버의 상태를 실시간 데이터 스트림으로 얻을 수 있을까?

SWR이 내부적으로 적절한 타이밍에 지속적으로 데이터를 폴링하기 때문이다.

SWR은 브라우저 창이 focus될때 네트워크가 offline에서 online으로 바뀔 때 자동으로 데이터를 fetch한다. 그밖에 polling 주기를 직접 설정하는 것도 가능하다.
