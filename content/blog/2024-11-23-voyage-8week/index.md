---
title: '테스트 시나리오 작성과 E2E 테스트'
date: 2024-11-23
description: '테스트 시나리오 작성과 E2E 테스트'
thumbnail: './thumbnail.png'
category: 'WIL'
isHidden: false
---

## **1. 문제**

이번 주 과제는 **테스트 시나리오를 직접 작성하고 구현**하는 것이었다. 이 과정에서 몇 가지 문제와 고민이 생겼다.

1. **테스트 전략 수립**
   - 팀 내에서 다양한 테스트 의견이 있었고(Unit + E2E, Unit + Integration, 모든 테스트), **적절한 테스트 전략을 결정**하는데 어려움이 있었다.
   - 통합 테스트만으로도 충분하다는 결론이 났다, 나도 동감했고 통합 테스트를 작성하다 시간이 남아서 **E2E 테스트의 필요성**도 느껴 추가 도전을 결정했다.
2. **테스트 환경 구성**
   - Integration 테스트를 위한 **MSW 설정과 API 모킹 방법** 고민
   - E2E 테스트를 위한 **Playwright 환경 설정**과 학습이 필요했다.
   - 특히 윤년, 월말 등 **시간 관련 테스트를 위한 모킹 전략** 수립이 어려웠다.
3. **테스트 시나리오 설계**
   - 반복 일정이라는 복잡한 기능에 대해 **어떤 케이스들을 테스트**할지 결정해야 했다.
   - Integration과 E2E 테스트 각각에서 **중복되지 않으면서도 필요한 테스트를 구분**하는 것이 어려웠다.

</br>

---

</br>

## **2. 시도**

### 1. **Integration Test 구현**

- MSW를 활용해 모든 API 요청을 모킹하고, `setupMockHandlers` 유틸리티로 테스트별 독립적인 상태를 관리했다.
- Testing Library의 다양한 기능들을 활용해 컴포넌트와 이벤트를 테스트했다.

### 코드 예시: setupMockHandlers 구현

```tsx
tsx
Copy
export const setupMockHandlers = (initEvents: Event[] = []) => {
  let mockEvents = [...initEvents]

  server.use(
    http.get('/api/events', () => HttpResponse.json({ events: mockEvents })),
    http.post('/api/events', async ({ request }) => {
      const newEvent = await request.json()
      mockEvents = [...mockEvents, newEvent]
      return HttpResponse.json(newEvent, { status: 201 })
    })
    // ... 더 많은 핸들러들
  )

  return {
    reset: () => {
      mockEvents = [...initEvents]
      server.resetHandlers()
    }
  }
}
```

### 2. **E2E Test 구현**

- Playwright를 활용해 실제 사용자의 행동 흐름대로 테스트를 구현했다.
- 특히 시간 관련 테스트를 위해 Playwright의 clock 기능을 활용했다.

### 코드 예시: E2E 테스트 구현

```tsx
test.describe('캘린더 E2E 테스트', () => {
  test('윤년 테스트', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2027-02-01T10:00:00'))
    await page.goto('/')

    // 윤년 관련 테스트 로직
    await userEvent.type(screen.getByLabelText(/제목/), '2월 29일 특별 기념일')
    await userEvent.type(screen.getByLabelText(/날짜/), '2024-02-29')
    // ... 더 많은 테스트 단계들
  })
})
```

### 3. **엣지 케이스 테스트 구현**

- 매월/매년 마지막 날 처리, 윤년 2월 29일 등 특수한 케이스들에 대한 테스트를 구현했다.
- 각 케이스별로 Integration과 E2E 테스트를 모두 구현해 안정성을 높였다.

</br>

---

</br>

## **3. 해결**

1. **효과적인 테스트 환경 구축**
   - MSW와 Playwright를 활용해 **안정적이고 독립적인 테스트 환경**을 구축했다.
   - 각 테스트가 서로 영향을 주지 않도록 격리된 환경을 보장했다.
2. **포괄적인 테스트 구현**
   - Integration 테스트로 주요 기능과 데이터 흐름을 검증했다.
   - E2E 테스트로 실제 사용자 시나리오를 검증했다.
   - 특히 엣지 케이스들에 대해 견고한 테스트를 구현했다.
3. **재사용 가능한 테스트 유틸리티 구현**
   - 반복되는 설정과 검증 로직을 유틸리티 함수로 분리했다.
   - 테스트 코드의 재사용성과 유지보수성을 높였다.

</br>

---

</br>

## **4. 배운 점**

1. **테스트 도구의 활용**
   - MSW를 통한 API 모킹 방법
   - Playwright의 다양한 기능들 (시간 조작, 페이지 조작 등)
   - Testing Library를 활용한 컴포넌트 테스트 방법
2. **테스트 전략의 중요성**
   - 각 테스트 방식의 장단점 이해
   - 상황에 맞는 테스트 전략 선택의 중요성
   - 테스트 코드도 유지보수가 필요한 코드라는 인식
3. **엣지 케이스 처리의 중요성**
   - 예외 상황에 대한 철저한 테스트의 필요성
   - 실제 사용자 시나리오를 고려한 테스트 설계
   - 시간 관련 로직의 복잡성과 처리 방법

</br>

---

</br>

## **5. Keep: 앞으로도 유지할 부분**

- **다양한 테스트 방식 시도**: 상황에 따라 다양한 테스트 방식을 적절히 조합하고, 새로운 테스트 도구와 방법론에 대한 학습을 지속할 것이다.
- **테스트 시나리오 설계 중시**: 엣지 케이스를 포함한 포괄적인 테스트 시나리오를 작성하고, 실제 사용자 관점에서의 테스트 케이스를 고려할 것이다.
- **테스트 코드의 품질 관리**: 테스트 코드의 가독성과 유지보수성을 고려하고, 재사용 가능한 테스트 유틸리티를 개발할 것이다.

</br>

---

</br>

이번 주는 테스트 코드 작성을 통해 다양한 테스트 도구의 활용법과 테스트 전략 수립의 중요성을 배웠다. 특히 MSW와 Playwright를 활용한 테스트 구현 경험은 앞으로의 프로젝트에서도 큰 도움이 될 것 같다.
