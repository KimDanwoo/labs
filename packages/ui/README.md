# @ui/react

모노레포 앱이 공통으로 사용하는 표시(presentational) 컴포넌트 모음. 도메인 상태를 알지 않으며, 렌더링에 필요한 데이터만 props로 받는다.

## 사용법

진입점은 `@ui/react` 하나다(`package.json`의 `exports`는 `.`만 있다). 서브패스 import는 없다.

```tsx
import { Badge, Button, Card, ThemeToggle } from '@ui/react';

<Card>
  <Card.Header>
    <Card.Title>제목</Card.Title>
    <Card.Description>설명</Card.Description>
    <Card.Action>
      <Badge variant="success">완료</Badge>
    </Card.Action>
  </Card.Header>
  <Card.Content>본문</Card.Content>
  <Card.Footer>
    <Button size="sm">확인</Button>
  </Card.Footer>
</Card>;
```

## export 목록

`src/index.ts` 기준.

| 이름                       | 설명                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`, `buttonVariants` | 버튼. variant: `default`·`primary`(`default` 별칭)·`destructive`·`outline`·`secondary`·`ghost`·`link`. size: `default`·`xs`·`sm`·`lg`·`icon`·`icon-xs`·`icon-sm`·`icon-lg`. `ButtonVariant` 타입 포함 |
| `Badge`, `badgeVariants`   | 레이블. variant: `default`·`primary`·`secondary`·`destructive`·`outline`·`ghost`·`link` + 상태 톤 `success`·`warning`·`info`·`error`(subtle 배경). `BadgeVariant` 타입 포함                           |
| `Card`                     | 컴파운드 API. `<Card>` 루트 + `Card.Header`·`Card.Title`·`Card.Description`·`Card.Action`·`Card.Content`·`Card.Footer`                                                                                |
| `Checkbox`                 | 체크박스(`@radix-ui/react-checkbox`)                                                                                                                                                                  |
| `Input`                    | 텍스트 입력                                                                                                                                                                                           |
| `ThemeToggle`              | 라이트/다크 전환 버튼. `<html>`의 `dark` 클래스와 `localStorage 'theme'`를 직접 다룬다                                                                                                                |
| `Accordion*`               | `Accordion`·`AccordionItem`·`AccordionTrigger`·`AccordionContent`                                                                                                                                     |
| `Avatar*`                  | `Avatar`·`AvatarImage`·`AvatarFallback`·`AvatarBadge`·`AvatarGroup`·`AvatarGroupCount`                                                                                                                |
| `DropdownMenu*`            | `DropdownMenu`·`DropdownMenuTrigger`·`DropdownMenuContent`·`DropdownMenuItem` 등 radix 서브컴포넌트 전체                                                                                              |
| `Progress`                 | 진행 바                                                                                                                                                                                               |
| `ScrollArea`, `ScrollBar`  | 스크롤 영역                                                                                                                                                                                           |
| `Select*`                  | `Select`·`SelectTrigger`·`SelectValue`·`SelectContent`·`SelectItem` 등 radix 서브컴포넌트 전체                                                                                                        |
| `Sheet*`                   | `Sheet`·`SheetTrigger`·`SheetContent`·`SheetHeader`·`SheetFooter`·`SheetTitle`·`SheetDescription`·`SheetClose`                                                                                        |

Accordion 이하 radix 기반 프리미티브는 fe-deep에서 승격한 것으로, `index.ts`가 파일 단위로 전량 re-export한다.

## 앱 쪽 준비

- **`@source` 등록**: 이 패키지는 빌드 없이 TS 소스를 그대로 내보낸다. 앱 전역 CSS에 `@source '../../../../packages/ui/src/**/*.{ts,tsx}';`가 없으면 컴포넌트가 쓰는 유틸이 생성되지 않는다(현재 hub·design·soundlab·fe-deep에 있음).
- **보더 색**: 컴포넌트의 `border`는 색을 따로 지정하지 않는다. `@tokens/css/theme.css`의 `@layer base { * { border-color: var(--color-border) } }`가 기본 보더 색을 준다 — `theme.css`를 import해야 한다.
- **애니메이션**: radix 기반 컴포넌트(DropdownMenu·Select·Sheet·Accordion)는 `animate-in`·`fade-*`·`zoom-*`·`slide-*`·`accordion-*` 클래스를 쓴다. Tailwind 기본에 없으므로 쓰는 앱에서 `@import 'tw-animate-css';`가 필요하다. 현재는 fe-deep만 import한다.

## 원칙

- **표시-only**: 컴포넌트가 전역 상태·API를 직접 참조하지 않는다.
- **토큰 기반**: 색은 `@tokens/css` 시맨틱 유틸(`bg-primary`, `text-muted-foreground`, `bg-success-subtle` 등)만 쓴다. Tailwind 기본 팔레트·임의 색값·MaruBuri에 없는 굵기는 `pnpm lint`(`validateDesignTokens`)가 막는다. 간격은 shadcn에서 온 코드라 Tailwind 숫자 스케일(`p-6`, `gap-2`)을 쓴다.
- **함수 컴포넌트만**: `React.FC` 없이, props 타입은 파일 내에서 정의한다.
- 여러 앱에서 공통으로 쓰이는 컴포넌트만 이 패키지에 둔다. 앱 전용은 해당 앱 FSD 레이어에 둔다.
