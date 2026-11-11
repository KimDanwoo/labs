---
title: "테스트 시나리오 작성과 E2E 테스트: MSW와 Playwright"
description: "Integration 테스트 중심에 E2E를 보완하는 전략으로 MSW와 Playwright 테스트를 구현하며 겪은 환경 격리·시간 테스트 문제를 정리해요."
publishedAt: "2024-12-11T13:26:30+09:00"
updatedAt: "2026-11-11T12:48:16+09:00"
category: "dev"
tags: ["testing"]
legacyUrl: "https://dansoon-dev.tistory.com/9"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

## 프로젝트 개요: 테스트 시나리오를 직접 작성하다

이번 주에는 프론트엔드 애플리케이션의 테스트 시나리오를 직접 작성하고 구현하는 작업을 진행했다. 직전 주의 테스트 코드 작성 과정은 [MSW로 테스트 코드를 작성하며 FSD 구조 보완하기](/posts/test-code-fsd-refactoring/)에 적어 두었다.

과제를 진행하면서, 테스트 코드를 작성하는 일이 개발 품질 전반에 얼마나 큰 영향을 미치는지 깨닫게 되었다. 특히 사용자 관점에서의 신뢰성 확보와 엣지 케이스 처리의 중요성을 직접 체감할 수 있었다.

## 테스트 전략 설계: Integration 중심에 E2E 보완

팀 내에서 처음 테스트 전략을 논의할 때, 다양한 의견이 있었다. Unit 테스트와 E2E 테스트를 조합해야 한다는 의견, Unit 테스트와 Integration 테스트의 조합이 효율적이라는 의견, 모든 단계의 테스트가 필요하다는 의견까지, 각자의 경험과 프로젝트 배경에 따라 접근 방식이 달랐다.

여러 논의 끝에 Integration 테스트를 중심으로 하되, 복잡한 사용자 시나리오는 E2E 테스트로 보완하는 전략을 채택했다.

코드 커버리지보다 실제 사용자 경험과 비즈니스 요구사항을 우선시하는 현실적인 접근이었다고 생각한다.

### MSW와 Testing Library로 Integration 테스트 구현

MSW(Mock Service Worker)는 프론트엔드 테스트에서 가장 도움이 된 도구였다.

API 요청을 실제 서버 없이도 모킹할 수 있다는 점은 테스트 환경의 독립성과 안정성을 크게 향상시켰다.

다음과 같은 모킹 핸들러를 구현해 API 상호작용을 테스트했다.

```ts
export const setupMockHandlers = (initEvents: Event[] = []) => {
  let mockEvents = [...initEvents]

  server.use(
    http.get('/api/events', () =>
      HttpResponse.json({ events: mockEvents })
    ),
    http.post('/api/events', async ({ request }) => {
      const newEvent = await request.json()
      mockEvents = [...mockEvents, newEvent]
      return HttpResponse.json(newEvent, { status: 201 })
    }),
    http.put('/api/events/:id', async ({ request, params }) => {
      const updatedEvent = await request.json()
      const eventId = params.id
      mockEvents = mockEvents.map(event => 
        event.id === eventId ? updatedEvent : event
      )
      return HttpResponse.json(updatedEvent)
    }),
    http.delete('/api/events/:id', ({ params }) => {
      const eventId = params.id
      mockEvents = mockEvents.filter(event => event.id !== eventId)
      return new HttpResponse(null, { status: 204 })
    })
  )

  return {
    reset: () => {
      mockEvents = [...initEvents]
      server.resetHandlers()
    },
    getEvents: () => mockEvents
  }
}
```

이 핸들러는 API를 모킹할 뿐 아니라 테스트 중에 발생하는 상태 변화를 추적하고 검증하는 데도 쓸 수 있었다.

특히 reset 메서드를 통해 각 테스트가 독립적인 환경에서 실행될 수 있도록 보장했다.

Testing Library로는 사용자 관점에서 UI를 테스트할 수 있었다.

실제 DOM 요소와 사용자 상호작용을 시뮬레이션하여 기능이 의도대로 동작하는지 검증할 수 있었다.

```tsx
test('반복 일정을 생성하고 수정할 수 있다', async () => {
  const { reset, getEvents } = setupMockHandlers()
  
  render(<Calendar />)
  
  // 반복 일정 생성 과정
  await userEvent.click(screen.getByText('일정 추가'))
  await userEvent.type(screen.getByLabelText(/제목/), '주간 회의')
  await userEvent.type(screen.getByLabelText(/날짜/), '2023-10-05')
  await userEvent.click(screen.getByLabelText(/반복/))
  await userEvent.selectOptions(screen.getByLabelText(/반복 주기/), '매주')
  await userEvent.click(screen.getByText('저장'))
  
  // 생성된 일정 확인
  await waitFor(() => {
    expect(screen.getByText('주간 회의')).toBeInTheDocument()
    expect(screen.getByText('매주 반복')).toBeInTheDocument()
  })
  
  // 서버 상태 검증
  const events = getEvents()
  expect(events.length).toBe(1)
  expect(events[0].title).toBe('주간 회의')
  expect(events[0].recurrence.pattern).toBe('weekly')
  
  // 테스트 후 상태 초기화
  reset()
})
```

Integration 테스트를 구현하면서 가장 인상적이었던 점은 실제 사용자 관점에서 시스템을 바라볼 수 있다는 것이었다.

함수의 입출력을 확인하는 데 그치지 않고, 사용자가 UI와 상호작용하는 방식 그대로 테스트를 작성함으로써 더 실질적인 품질 검증이 가능했다.

### Playwright로 E2E 테스트 구현

E2E 테스트를 위해 Playwright를 선택했다.

처음에는 학습 곡선이 있었지만, 실제 브라우저 환경에서 사용자 시나리오를 테스트할 수 있다는 점이 큰 장점이었다.

특히 시간 관련 테스트를 위해 Playwright의 시간 조작 기능을 활용한 것은 큰 수확이었다.

```ts
test.describe('특수 시간 케이스 테스트', () => {
  test('윤년에 생성된 2월 29일 일정이 비윤년에는 2월 28일에 표시된다', async ({ page }) => {
    // 2024년(윤년)으로 시간 설정
    await page.evaluate(() => {
      // @ts-ignore
      window.__setSystemTime(new Date('2024-01-15T10:00:00'));
    });
    
    await page.goto('/');
    
    // 윤년의 2월 29일에 이벤트 생성
    await page.click('text=일정 추가');
    await page.fill('[aria-label="제목"]', '윤년 특별 행사');
    await page.fill('[aria-label="날짜"]', '2024-02-29');
    
    // 매년 반복 설정
    await page.check('[aria-label="반복"]');
    await page.selectOption('[aria-label="반복 주기"]', '매년');
    await page.click('text=저장');
    
    // 생성된 일정 확인
    await expect(page.locator('text=윤년 특별 행사')).toBeVisible();
    
    // 2025년(비윤년)으로 이동
    await page.evaluate(() => {
      // @ts-ignore
      window.__setSystemTime(new Date('2025-02-15T10:00:00'));
    });
    
    await page.goto('/calendar/2025-02');
    
    // 2월 28일에 일정이 표시되는지 확인
    const feb28Cell = page.locator('[data-date="2025-02-28"]');
    await expect(feb28Cell.locator('text=윤년 특별 행사')).toBeVisible();
  });
  
  test('월말 기준 반복 일정은 각 월의 마지막 날에 표시된다', async ({ page }) => {
    // 2023년 1월 31일로 설정
    await page.evaluate(() => {
      // @ts-ignore
      window.__setSystemTime(new Date('2023-01-31T10:00:00'));
    });
    
    await page.goto('/');
    
    // 1월 31일에 월말 반복 일정 생성
    await page.click('text=일정 추가');
    await page.fill('[aria-label="제목"]', '월말 결산 회의');
    await page.fill('[aria-label="날짜"]', '2023-01-31');
    await page.check('[aria-label="반복"]');
    await page.selectOption('[aria-label="반복 주기"]', '매월');
    await page.selectOption('[aria-label="반복 기준"]', '월말 기준');
    await page.click('text=저장');
    
    // 2월로 이동
    await page.click('[aria-label="다음 달"]');
    
    // 2월 28일(2월의 월말)에 일정이 있는지 확인
    const feb28Cell = page.locator('[data-date="2023-02-28"]');
    await expect(feb28Cell.locator('text=월말 결산 회의')).toBeVisible();
    
    // 3월로 이동
    await page.click('[aria-label="다음 달"]');
    
    // 3월 31일에 일정이 있는지 확인
    const mar31Cell = page.locator('[data-date="2023-03-31"]');
    await expect(mar31Cell.locator('text=월말 결산 회의')).toBeVisible();
  });
});
```

이런 E2E 테스트를 통해 실제 사용자 환경에서 복잡한 시나리오를 검증할 수 있었다.

특히 시간 관련 엣지 케이스(윤년, 월말 처리 등)를 실제 브라우저 환경에서 테스트할 수 있다는 점은 애플리케이션의 신뢰성을 크게 향상시켰다.

## 테스트 환경 격리와 시간 테스트 문제 해결

### 테스트 환경 격리

테스트 환경을 격리하는 것은 생각보다 까다로운 과제였다. 특히 여러 테스트가 연속해서 실행될 때, 이전 테스트의 상태가 다음 테스트에 영향을 미치는 문제가 가끔씩만 나타나는 실패를 일으키곤 했다.

이 문제를 해결하기 위해 모든 테스트 전후에 상태를 초기화하는 패턴을 도입했다.

```ts
const useTestSetup = (initialEvents = []) => {
  const mockHandlers = setupMockHandlers(initialEvents);
  
  beforeEach(() => {
    // 테스트 시작 전 상태 초기화
    mockHandlers.reset();
  });
  
  afterEach(() => {
    // 테스트 종료 후 정리
    cleanup();
    mockHandlers.reset();
  });
  
  return mockHandlers;
};
```

이 유틸리티 함수는 테스트 스위트 전체에서 재사용할 수 있었고, 각 테스트의 독립성을 보장하는 데 큰 도움이 되었다.

### 시간 관련 테스트: 윤년·월말 엣지 케이스

시간 관련 기능을 테스트하는 것은 예상보다 훨씬 복잡했다. 윤년 처리, 월말 처리, 시간대 변경 등 다양한 엣지 케이스를 고려해야 했다. 특히 반복 일정의 경우, 이런 특수한 상황에서도 정확하게 동작하는지 검증하는 것이 중요했다.

이를 위해 시간을 모킹하는 전략을 개발했다.

```ts
// Test Utility
const mockDateAndTime = (isoDateString: string) => {
  // 테스트 환경에서 Date 객체 모킹
  const originalDate = global.Date;
  const mockDate = new Date(isoDateString);
  
  class MockDate extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        super(mockDate);
      } else {
        super(...args);
      }
    }
    
    static now() {
      return new originalDate(mockDate).getTime();
    }
  }
  
  global.Date = MockDate as DateConstructor;
  
  // 테스트 종료 후 원래 Date 객체로 복원하는 함수 반환
  return () => {
    global.Date = originalDate;
  };
};

// 테스트에서 활용
test('윤년 처리 테스트', () => {
  const restoreDate = mockDateAndTime('2024-02-29T10:00:00Z');
  
  // 테스트 로직...
  
  restoreDate(); // 원래 Date 객체로 복원
});
```

이런 시간 모킹 전략을 통해 특정 날짜와 시간을 가정한 테스트를 안정적으로 실행할 수 있었다.

이는 캘린더 애플리케이션과 같은 시간 의존적 시스템에서 특히 중요한 부분이었다.

## 다음 테스트에 남길 기준

일정 CRUD와 검색은 MSW·Testing Library로 확인하고, 브라우저에서 이어지는 사용자 흐름은 Playwright로 확인했다. 모든 시나리오를 같은 도구로 작성하기보다 무엇을 검증하는지에 따라 범위를 나눴다.

시간에 의존하는 캘린더에서는 윤년과 월말 같은 조건을 직접 넣어 보는 일이 중요했다. 테스트 중에는 시간을 고정하고, 끝나면 원래 `Date`와 이벤트 데이터를 복원하도록 했다. 다음 테스트가 어떤 순서로 실행되더라도 같은 전제로 시작하게 만들기 위해서다.

다음에는 이 시나리오를 CI에 넣어 코드 변경마다 실행하고 싶다. 테스트를 추가할 때도 커버리지 수치와 함께 어떤 사용자 흐름의 회귀를 막는지 살펴볼 것이다.
