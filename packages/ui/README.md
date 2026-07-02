# @ui/react

모노레포 앱이 공통으로 사용하는 표시(presentational) 컴포넌트 모음. 도메인 상태를 알지 않으며, 렌더링에 필요한 데이터만 props로 받는다.

## 사용법

```ts
import { Button, Badge, ThemeToggle } from '@ui/react';
import * as Card from '@ui/react/card';   // Compound API
import { Card } from '@ui/react/flat';    // Flat API (단순 사용)
```

## export 목록

| 이름 | 설명 |
| --- | --- |
| `Button` | 주요 액션 버튼. `ButtonVariant` 타입 포함 |
| `Badge` | 상태·분류 레이블. `BadgeTone` 타입 포함 |
| `ThemeToggle` | 라이트/다크 테마 전환 버튼 |
| `Card` (namespace) | Compound API — `<Card.Root>`, `<Card.Header>`, `<Card.Body>`, `<Card.Footer>`, `<Card.Title>`, `<Card.Description>` |
| `Card` (flat) | Flat API — `import { Card } from '@ui/react/flat'` |

## 원칙

- **표시-only**: 컴포넌트가 전역 상태·API를 직접 참조하지 않는다.
- **토큰 기반**: 모든 색·간격은 `@tokens/css` Tailwind 유틸을 사용한다. 임의 hex/px 금지.
- **함수 컴포넌트만**: `React.FC` 없이, props 타입은 파일 내 `type`으로 정의한다.
- 여러 앱에서 공통으로 쓰이는 컴포넌트만 이 패키지에 둔다. 앱 전용은 해당 앱 FSD 레이어에 둔다.
