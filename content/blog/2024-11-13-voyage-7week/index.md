---
title: '테스트 코드 작성, FSD 패턴 리팩토링을 곁들인'
date: 2024-11-13
description: '테스트 코드 작성, FSD 패턴 리팩토링을 곁들인'
thumbnail: './thumbnail.png'
category: 'WIL'
isHidden: true
---

## **1. 문제**

이번 주 과제는 지난주에 리팩토링한 프로젝트 구조를 바탕으로 **테스트 코드를 작성**하고, **FSD 패턴**과 상태 관리에서 미숙했던 부분을 개선하는 것이었다. 이 과정에서 몇 가지 문제와 고민이 생겼다.

1. **테스트 범위 결정의 어려움**
   - 주요 기능을 모두 테스트하려다 보니 **테스트 범위를 어디까지 설정해야 할지** 고민이 많았다. 특히 유틸리티 함수와 커스텀 훅의 테스트부터 시작해, 전체 흐름을 확인하는 통합 테스트까지 커버하려고 하니 **테스트 케이스 관리와 코드 작성**이 생각보다 오래 걸렸다.
2. **데이터 상태의 독립성 유지**
   - 각 테스트가 독립적으로 작동하도록 **테스트 데이터와 핸들러를 설정**하는 방법을 고민하게 되었다. 특히 mock 데이터를 기반으로 테스트를 진행하면서 **테스트 간 상태 초기화와 독립성**을 어떻게 유지할지 어려움이 있었다.
3. **리팩토링 후 테스트 코드의 유지보수성**
   - 테스트 코드를 한곳에서 작성하다보니 테스트 코드 관리를 효율적으로 할 수 있는 방법을 생각했다 이를 바탕으로 **폴더 구조와 상태 관리 로직을 리팩토링**하며 테스트 코드의 유지보수성 또한 높이고자 했다.

</br>

---

</br>

## **2. 시도**

### 1. **테스트 유틸리티 핸들러 작성**

- 모든 API 요청에 대한 **mock 핸들러를 `setupMockHandlers` 유틸리티 함수로 관리**하며, 테스트별로 독립적인 상태를 유지하도록 설정했다.
- 데이터 초기화와 핸들러 재설정을 통해 **테스트 데이터의 일관성과 독립성을 보장**할 수 있도록 클로저와 `server.resetHandlers()`를 사용했다.

### 코드 예시: setupMockHandlers

```tsx
export const setupMockHandlers = (initEvents: Event[] = []) => {
  let mockEvents = [...initEvents]

  server.use(
    // 조회 - 항상 최신 mockEvents 상태 반환
    http.get('/api/events', () => HttpResponse.json({ events: mockEvents })),

    // 생성
    http.post('/api/events', async ({ request }) => {
      const newEvent = await request.json()
      newEvent.id = String(mockEvents.length + 1)
      mockEvents = [...mockEvents, newEvent]
      return HttpResponse.json(newEvent, { status: 201 })
    }),

    // 수정
    http.put('/api/events/:id', async ({ params, request }) => {
      const updatedEvent = await request.json()
      mockEvents = mockEvents.map(event =>
        event.id === params.id ? updatedEvent : event
      )
      return HttpResponse.json(updatedEvent)
    }),

    // 삭제
    http.delete('/api/events/:id', ({ params }) => {
      mockEvents = mockEvents.filter(event => event.id !== params.id)
      return new HttpResponse(null, { status: 204 })
    })
  )

  return {
    reset: () => {
      mockEvents = [...initEvents]
      server.resetHandlers()
    },
    getCurrentEvents: () => [...mockEvents]
  }
}
```

### 2. **CRUD 및 필터, 뷰 모드 기능 테스트**

- **일정 CRUD 기능**과 **뷰 모드** 및 **검색 기능**을 테스트했다. 특히 일정 추가, 수정, 삭제 기능에서 **정확한 데이터 변경 여부**를 확인하고, 각 뷰 모드에 따라 일정이 잘 표시되는지 테스트했다.
- 각 기능의 정상 작동을 검증하기 위해 `vitest` 와 `react-testing-library`를 사용해 컴포넌트 단위의 테스트와 통합 테스트를 진행했다.

### 코드 예시: CRUD 및 뷰 모드 테스트

```tsx
describe('일정 CRUD 및 뷰 모드 기능', () => {
  it('새로운 일정이 리스트에 정확히 추가된다.', async () => {
    setupMockHandlers()
    renderApp()

    const newEvent = {
      title: '프론트엔드 리뷰',
      date: '2024-11-04',
      startTime: '09:00',
      endTime: '10:00'
    }

    await fillEventForm(user, newEvent) // 헬퍼 함수
    await user.click(screen.getByRole('button', { name: /일정 추가/ }))

    const eventList = screen.getByTestId('event-list')
    await waitFor(() =>
      expect(within(eventList).getByText(newEvent.title)).toBeInTheDocument()
    )
  })
})
```

### 3. **리팩토링과 테스트 코드 유지보수성 강화**

- **FSD 패턴**을 유지하면서 테스트 코드와 모듈별로 의존성을 낮추기 위해 **폴더 구조를 조금 더 개선**했다.
- 테스트 코드의 유지보수를 위해 **공통 유틸리티**와 **helper 함수**를 분리해 관리했다. 이를 통해 코드가 간결해지고, **다양한 케이스에도 유연하게 대응할 수 있는 구조**를 만들 수 있었다.

</br>

---

</br>

## **3. 해결**

1. **테스트 데이터의 독립성과 재사용성 확보**
   - `setupMockHandlers` 함수로 **독립적인 mock 데이터 상태**를 설정하고, 테스트 환경에서 데이터가 일관되게 관리되도록 개선했다. 이로 인해 **테스트가 서로 영향을 주지 않고 독립적으로 실행**될 수 있었다.
2. **FSD 패턴과 테스트 코드 구조의 정돈**
   - 기존 FSD 패턴에서 부족했던 폴더 구조와 모듈화를 보완하며, 각 기능과 상태 관리의 의존성을 낮추었다. 이를 통해 **리팩토링 후에도 테스트 코드가 안정적으로 유지**될 수 있었다.
3. **코드 신뢰성과 유지보수성 강화**
   - 테스트 코드 작성으로 인해 프로젝트의 **신뢰성과 유지보수성**이 한층 높아졌다. 코드 변경이 있을 때마다 테스트를 통해 문제를 빠르게 확인할 수 있었고, 리팩토링의 효과도 더 확실하게 체감할 수 있었다.

</br>

---

</br>

## **4. 배운 점**

1. **테스트 코드의 중요성과 작성 방법**
   - 테스트 코드를 작성하면서 **기능별로 테스트를 분리하고 독립적으로 관리하는 것**이 얼마나 중요한지 깨달았다. 각 기능의 흐름을 검증하는 **통합 테스트**와 기능 단위의 **단위 테스트**가 병행될 때, 코드의 안정성이 더 높아진다는 점을 경험했다.
2. **Mock 데이터와 핸들러의 유연성**
   - 각 테스트에서 독립적인 데이터 상태를 유지하고 API 호출을 모의함으로써, **테스트 환경에서도 실제 환경처럼 동작하는 구조**를 구현할 수 있었다. 이를 통해 **테스트의 신뢰성**을 크게 높일 수 있었다.
3. **코드 일관성과 유지보수성의 중요성**
   - FSD 패턴을 기반으로 테스트 코드를 작성하다 보니, **폴더 구조와 코드 모듈화**의 중요성을 더 깊이 체감하게 되었다. 코드가 일관되고 유지보수성이 높아질수록 기능 변경이 쉽게 관리될 수 있다는 것을 확인했다.

</br>

---

</br>

## **5. Keep: 앞으로도 유지할 부분**

- **테스트 코드와 리팩토링 병행**: 테스트 코드가 코드 변경과 리팩토링을 보완할 수 있도록, 새로운 기능이나 수정이 있을 때 테스트 코드를 병행해 작성할 것이다.
- **모듈화된 테스트 유틸리티 사용**: 반복되는 로직은 테스트 유틸리티로 분리해 재사용 가능성을 높이고, 테스트 환경의 일관성을 유지할 계획이다.
- **FSD 패턴 기반의 폴더 구조 유지**: 프로젝트 확장성 확보를 위해, 코드가 깔끔하고 유지보수성이 높은 구조를 유지할 예정이다.

</br>

---

</br>

이번 주는 **테스트 코드 작성과 FSD 패턴 기반 리팩토링**을 통해 코드의 신뢰성과 유지보수성을 크게 높일 수 있었다. 앞으로 프로젝트가 더 복잡해져도 이 경험을 바탕으로 테스트와 리팩토링을 병행하며, 안정적이고 확장성 있는 구조를 만들어갈 자신감을 얻었다
