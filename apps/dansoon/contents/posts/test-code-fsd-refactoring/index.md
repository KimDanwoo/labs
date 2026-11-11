---
title: "MSW로 테스트 코드를 작성하며 FSD 구조 보완하기"
description: "MSW 핸들러로 테스트 독립성을 확보하고 CRUD·필터 테스트를 작성하며 FSD 구조를 보완한 과정과 배운 점을 돌아봐요."
publishedAt: "2024-12-11T13:25:56+09:00"
updatedAt: "2026-11-11T12:48:16+09:00"
category: "dev"
tags: ["testing","fsd"]
legacyUrl: "https://dansoon-dev.tistory.com/8"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

## 테스트 코드를 작성하며 겪은 문제

이번 주 과제는 지난주에 [FSD 패턴으로 상태 관리 리팩토링하기](/posts/fsd-state-management-refactoring/)한 프로젝트 구조를 바탕으로 테스트 코드를 작성하고, FSD 패턴과 상태 관리에서 미숙했던 부분을 개선하는 것이었다. 이 과정에서 몇 가지 문제와 고민이 생겼다.

1.  테스트 범위 결정의 어려움
    -   주요 기능을 모두 테스트하려다 보니 테스트 범위를 어디까지 설정해야 할지 고민이 많았다. 특히 유틸리티 함수와 커스텀 훅의 테스트부터 시작해, 전체 흐름을 확인하는 통합 테스트까지 커버하려고 하니 테스트 케이스 관리와 코드 작성이 생각보다 오래 걸렸다.
2.  데이터 상태의 독립성 유지
    -   각 테스트가 독립적으로 작동하도록 테스트 데이터와 핸들러를 설정하는 방법을 고민하게 되었다. 특히 mock 데이터를 기반으로 테스트를 진행하면서 테스트 간 상태 초기화와 독립성을 어떻게 유지할지 어려움이 있었다.
3.  리팩토링 후 테스트 코드의 유지보수성
    -   6주차에 FSD 패턴을 도입해 모듈화를 진행한 상태였지만, 테스트 코드 작성 중에 코드 구조의 보완점이 드러났다. 이를 바탕으로 폴더 구조와 상태 관리 로직을 리팩토링하며 테스트 코드의 유지보수성 또한 높이고자 했다.

---

## 시도: mock 핸들러와 기능별 테스트

### 테스트 유틸리티 핸들러 작성

-   모든 API 요청에 대한 mock 핸들러를 setupMockHandlers 유틸리티 함수로 관리하며, 테스트별로 독립적인 상태를 유지하도록 설정했다.
-   데이터 초기화와 핸들러 재설정을 통해 테스트 데이터의 일관성과 독립성을 보장할 수 있도록 클로저와 server.resetHandlers()를 사용했다.

### 코드 예시: setupMockHandlers

```ts
export const setupMockHandlers = (initEvents: Event[] = []) => {
  let mockEvents = [...initEvents];

  server.use(
    // 조회 - 항상 최신 mockEvents 상태 반환
    http.get('/api/events', () => HttpResponse.json({ events: mockEvents })),

    // 생성
    http.post('/api/events', async ({ request }) => {
      const newEvent = await request.json();
      newEvent.id = String(mockEvents.length + 1);
      mockEvents = [...mockEvents, newEvent];
      return HttpResponse.json(newEvent, { status: 201 });
    }),

    // 수정
    http.put('/api/events/:id', async ({ params, request }) => {
      const updatedEvent = await request.json();
      mockEvents = mockEvents.map(event => (event.id === params.id ? updatedEvent : event));
      return HttpResponse.json(updatedEvent);
    }),

    // 삭제
    http.delete('/api/events/:id', ({ params }) => {
      mockEvents = mockEvents.filter(event => event.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    })
  );

  return {
    reset: () => {
      mockEvents = [...initEvents];
      server.resetHandlers();
    },
    getCurrentEvents: () => [...mockEvents],
  };
};
```

### setupMockHandlers 읽기

MSW(Mock Service Worker)는 fetch나 axios 모듈을 가짜로 바꾸는 대신 네트워크 요청 단계에서 요청을 가로채 응답을 돌려주는 라이브러리다. 앱 코드는 실제 서버에 요청하는 것과 같은 방식으로 동작하므로 API 호출 코드까지 테스트에 포함된다. 코드의 `http.get`과 `HttpResponse.json`은 MSW 2.x에서 쓰는 형태다.

핵심은 `mockEvents`를 함수 안의 지역 변수로 둔 클로저 구조다. 조회·생성·수정·삭제 핸들러가 모두 같은 변수를 읽고 다시 대입하므로 생성 요청 뒤에 조회하면 방금 만든 일정이 응답에 들어 있다. 전역 변수가 아니라 `setupMockHandlers`를 호출할 때마다 새로 만들어지므로 테스트마다 서로 다른 초기 데이터를 줄 수 있다. 반환값의 `reset`은 데이터를 초기값으로 되돌리고 `server.resetHandlers()`로 `server.use`가 런타임에 추가한 핸들러를 걷어낸다. `getCurrentEvents`는 배열을 얕게 복사해 돌려준다. 그래서 테스트 쪽에서 배열에 항목을 넣거나 빼도 mock 상태는 그대로지만, 배열 안의 일정 객체는 같은 객체를 가리키므로 `events[0].title`처럼 객체 속성을 바꾸면 mock 상태도 함께 바뀐다. `initEvents`를 복사할 때도 마찬가지다.

생성 핸들러의 id는 `mockEvents.length + 1`로 만든다. 항목을 삭제한 뒤 생성하면 이미 있는 id와 겹칠 수 있는 방식이라, 삭제와 생성을 섞는 시나리오를 테스트할 때는 알아 두어야 한다.

### CRUD·필터·뷰 모드 기능 테스트

-   일정 CRUD 기능과 뷰 모드 및 검색 기능을 테스트했다. 특히 일정 추가, 수정, 삭제 기능에서 정확한 데이터 변경 여부를 확인하고, 각 뷰 모드에 따라 일정이 잘 표시되는지 테스트했다.
-   각 기능의 정상 작동을 검증하기 위해 Vitest와 React Testing Library를 사용해 컴포넌트 단위의 테스트와 통합 테스트를 진행했다.

### 코드 예시: CRUD 및 뷰 모드 테스트

```ts
describe('일정 CRUD 및 뷰 모드 기능', () => {
  it('새로운 일정이 리스트에 정확히 추가된다.', async () => {
    setupMockHandlers();
    renderApp();

    const newEvent = {
      title: '프론트엔드 리뷰',
      date: '2024-11-04',
      startTime: '09:00',
      endTime: '10:00',
    };

    await fillEventForm(user, newEvent); // 헬퍼 함수
    await user.click(screen.getByRole('button', { name: /일정 추가/ }));

    const eventList = screen.getByTestId('event-list');
    await waitFor(() => expect(within(eventList).getByText(newEvent.title)).toBeInTheDocument());
  });
});
```

### 테스트 코드 읽기

테스트는 준비, 실행, 검증 순서로 읽힌다. 먼저 `setupMockHandlers()`로 API를 준비하고 `renderApp()`으로 앱을 그린 뒤, 헬퍼 함수 `fillEventForm`으로 입력 폼을 채운다. 실행 단계에서는 `user.click`으로 버튼을 눌러 사용자의 클릭을 흉내 낸다. React Testing Library는 구현 세부사항보다 사용자가 보는 화면을 기준으로 요소를 찾도록 권한다. `getByRole('button', { name: /일정 추가/ })`는 접근성 역할과 이름으로 버튼을 찾는 쿼리라서 클래스 이름이나 DOM 구조가 바뀌어도 깨지지 않는다.

일정 추가는 서버 응답을 받은 뒤 화면이 갱신되는 비동기 흐름이다. 그래서 검증에는 `waitFor`를 쓴다. 조건이 참이 될 때까지 일정 시간 안에서 반복 확인하는 함수다. `within(eventList)`는 검색 범위를 일정 목록 안으로 좁혀, 같은 제목의 텍스트가 폼 입력창 등 다른 곳에 있어도 목록 안에서만 확인하게 한다. `toBeInTheDocument`는 jest-dom이 제공하는 matcher다.

### 리팩토링과 테스트 코드 유지보수성 강화

-   FSD 패턴을 유지하면서 테스트 코드와 모듈별로 의존성을 낮추기 위해 폴더 구조를 조금 더 개선했다.
-   테스트 코드의 유지보수를 위해 공통 유틸리티와 helper 함수를 분리해 관리했다. 이를 통해 코드가 간결해지고, 다양한 케이스에도 유연하게 대응할 수 있는 구조를 만들 수 있었다.

---

## 이 방식의 한계와 다른 선택지

클로저 기반 인메모리 mock은 테스트 안에서 서버처럼 동작하는 장점이 있는 대신, 실제 서버의 검증 규칙과 오류 응답까지 재현하지는 않는다. mock과 실제 API의 응답 형태가 달라져도 테스트는 계속 통과할 수 있으므로, 계약을 확인하는 별도의 장치나 E2E 테스트가 필요하다. 시나리오를 작성하는 방법은 [테스트 시나리오 작성과 E2E테스트](/posts/test-scenario-e2e/)에서 이어서 볼 수 있다.

다른 방식도 있다. 특정 테스트에서만 응답을 바꾸고 싶다면 `server.use`로 해당 테스트 안에서 핸들러를 덮어쓰는 방법이 있고 이 경우 `afterEach`에서 `server.resetHandlers()`를 호출해 다음 테스트로 새지 않게 한다. 네트워크 계층 대신 `vi.mock`으로 API 모듈 자체를 대체하는 방법은 설정이 간단하지만 요청 URL이나 메서드가 틀려도 잡아내지 못한다. 테스트 데이터가 늘어나면 객체를 직접 쓰는 대신 기본값을 채워 주는 팩토리 함수를 두는 방식도 쓴다.

---

## 테스트마다 상태를 따로 준비할 수 있게 됐다

`setupMockHandlers`를 호출할 때마다 별도의 `mockEvents`가 만들어지도록 했다. 각 테스트는 자신에게 필요한 일정으로 시작하고, 생성·수정·삭제 요청 뒤의 결과를 확인할 수 있었다. 앞 테스트에서 바꾼 데이터가 다음 테스트의 전제가 되는 일을 피하려는 구성이었다.

여전히 주의할 부분은 남았다. 초기 배열을 복사해도 내부 객체는 공유되며, 삭제 후 생성하는 시나리오에서는 길이로 만든 id가 겹칠 수 있다. 헬퍼로 중복을 줄이는 것과 테스트 데이터가 독립적인지는 따로 확인해야 했다.

다음 주에는 이 테스트를 바탕으로 사용자 흐름과 시간 경계까지 범위를 넓혔다. 그 과정은 [테스트 시나리오 작성과 E2E 테스트](/posts/test-scenario-e2e/)에 정리했다.
