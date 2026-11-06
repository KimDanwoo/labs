---
title: "테스트 시나리오 작성과 E2E테스트"
description: "Integration 테스트 중심에 E2E를 보완하는 전략으로 MSW와 Playwright 테스트를 구현하며 겪은 환경 격리·시간 테스트 문제를 정리해요."
publishedAt: "2024-12-11T13:26:30+09:00"
updatedAt: "2025-08-03T09:36:48+09:00"
category: "dev"
tags: ["testing"]
legacyUrl: "https://dansoon-dev.tistory.com/9"
thumbnail: "./thumbnail.jpg"
cover: "./cover.jpg"
---

## 프로젝트 개요: 테스트 시나리오를 직접 작성하다

이번 주에는 프론트엔드 애플리케이션의 테스트 시나리오를 직접 작성하고 구현하는 작업을 진행했다. 직전 주의 테스트 코드 작성 과정은 [테스트 코드 작성과 FSD 패턴 리팩토링](/posts/test-code-fsd-refactoring/)에 적어 두었다.

처음 과제를 접했을 때, 테스트 코드를 작성하는 일이 개발 품질 전반에 얼마나 큰 영향을 미치는지 깨닫게 되었다. 특히 사용자 관점에서의 신뢰성 확보와 엣지 케이스 처리의 중요성을 직접 체감할 수 있었다.

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
      return HttpResponse.json({}, { status: 204 })
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

테스트 환경을 격리하는 것은 생각보다 까다로운 과제였다. 특히 여러 테스트가 연속해서 실행될 때, 이전 테스트의 상태가 다음 테스트에 영향을 미치는 문제가 종종 드문 실패를 일으키곤 했다.

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

## 배운 점

### 테스트 도구의 생태계

이번 테스트 구현을 통해 현대 프론트엔드 테스트 도구의 생태계가 얼마나 풍부하고 강력한지 깨달았다.

MSW, Testing Library, Playwright와 같은 도구들은 각각 특화된 영역에서 뛰어난 성능을 발휘했고, 이들을 적절히 조합함으로써 포괄적인 테스트 시스템을 구축할 수 있었다.

특히 MSW는 API 모킹만이 아니라 테스트 중의 서버 상태를 조작하고 검증할 수도 있다는 것을 알게 되었다.

프론트엔드 테스트가 UI 렌더링 확인에 그치지 않고 데이터 흐름과 상태 관리까지 포괄할 수 있다는 뜻이다.

### 테스트 설계도 설계다

테스트를 작성하는 일은 기술적 작업이면서 일종의 설계 활동이기도 하다는 것을 깨달았다. 어떤 테스트가 가치 있는지, 어떤 수준에서 테스트를 작성해야 하는지, 어떻게 테스트를 구조화할지 등의 결정은 코드 디자인만큼이나 중요했다.

특히 테스트 시나리오를 설계할 때, 실제 사용자의 관점에서 생각하는 것이 매우 중요했다.

코드 커버리지를 높이기 위한 테스트보다는, 실제 사용자가 경험할 수 있는 시나리오를 중심으로 테스트를 구성했을 때 더 의미 있는 품질 보증이 가능했다.

### 엣지 케이스의 중요성

테스트를 작성하면서 가장 크게 깨달은 점은 엣지 케이스의 중요성이었다.

일반적인 상황에서는 잘 동작하는 코드도, 특수한 상황(윤년, 월말, 시간대 변경 등)에서는 예상치 못한 오류를 일으킬 수 있다는 것을 직접 경험했다.

이런 엣지 케이스를 미리 테스트에 포함시킴으로써, 실제 운영 환경에서 발생할 수 있는 많은 문제를 사전에 방지할 수 있었다.

테스트는 회귀를 막는 데서 더 나아가 코드의 견고성을 높이는 도구라는 뜻이다.

## 앞으로 적용할 전략

### 테스트 주도 개발(TDD) 시도

이번 경험을 통해 테스트의 가치를 실감한 후, 다음 프로젝트에서는 테스트 주도 개발(TDD) 방식을 시도해 보고 싶다. 기능 구현 전에 테스트를 먼저 작성함으로써, 요구사항을 더 명확히 이해하고 더 견고한 코드를 작성할 수 있을 것으로 기대한다.

### 테스트 자동화 파이프라인 구축

CI/CD 파이프라인에 테스트를 통합하여, 코드 변경이 있을 때마다 자동으로 모든 테스트가 실행되도록 할 계획이다.

이를 통해 빠른 피드백 루프를 구축하고, 품질 문제를 조기에 발견할 수 있을 것이다.

### 테스트 코드의 품질 관리

테스트 코드도 결국 코드이기에, 유지보수성과 가독성을 중요하게 관리할 필요가 있다.

향후에는 테스트 코드의 리팩토링과 재사용성 개선에도 시간을 투자하여, 테스트 시스템 자체의 지속 가능성을 높일 계획이다.

## 결론

이번 테스트 구현 경험은 기술 학습에 그치지 않고 소프트웨어 품질에 대한 관점을 넓히는 계기가 되었다.

특히 사용자 중심의 테스트 설계와 엣지 케이스 처리의 중요성을 깊이 이해할 수 있었다.

MSW와 Playwright를 통해 구현한 테스트 시스템은 앞으로의 프로젝트에서도 큰 자산이 될 것이다.

테스트 자동화의 가치를 직접 체험한 만큼, 앞으로는 테스트를 개발 프로세스의 핵심 부분으로 더욱 깊이 통합할 계획이다.

테스트는 버그를 막는 도구이기도 하고 더 나은 소프트웨어를 설계하고 구현하는 방법론이기도 하다는 것을 깨달았다. 이 깨달음은 앞으로의 개발 접근 방식에 계속 영향을 미칠 것이다.
