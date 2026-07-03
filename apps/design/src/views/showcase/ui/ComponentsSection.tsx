import { Badge, Button, Card, Checkbox, Input, ThemeToggle } from '@ui/react';
import { BADGE_VARIANTS, BUTTON_VARIANTS } from '@views/showcase/model/constants';
import { Section } from './Section';

const GROUP_LABEL = 'text-xs font-semibold uppercase tracking-widest text-muted-foreground';

export function ComponentsSection() {
  return (
    <Section title="Components" description="@ui/react 공통 컴포넌트 전량과 변형.">
      <div className="flex flex-col gap-sm">
        <h3 className={GROUP_LABEL}>Button</h3>
        <div className="flex flex-wrap items-center gap-md">
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
          <Button disabled className="opacity-40">
            disabled
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <h3 className={GROUP_LABEL}>Badge</h3>
        <div className="flex flex-wrap items-center gap-sm">
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <h3 className={GROUP_LABEL}>Card</h3>
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-2">
          <Card>
            <Card.Header>
              <Card.Title>Card.Title</Card.Title>
              <Card.Action>
                <Badge variant="info">new</Badge>
              </Card.Action>
              <Card.Description>Card·Card.Header·Card.Title·Card.Description·Card.Content·Card.Footer dot-access 조합.</Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-foreground">Card.Content — 자유 구성.</p>
            </Card.Content>
            <Card.Footer>
              <Button size="sm" variant="outline">
                Card.Footer 액션
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <h3 className={GROUP_LABEL}>Form</h3>
        <div className="flex max-w-content flex-col gap-md">
          <Input placeholder="Input — 텍스트 입력" />
          <Input placeholder="disabled" disabled />
          <Input aria-invalid placeholder="aria-invalid — error 링" />
          <label className="flex items-center gap-sm text-sm text-foreground">
            <Checkbox defaultChecked />
            Checkbox — radix 기반, 토큰 색상
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <h3 className={GROUP_LABEL}>ThemeToggle</h3>
        <div className="flex items-center gap-md">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">라이트/다크 전환 — 위 색 토큰이 실시간 반응한다.</span>
        </div>
      </div>
    </Section>
  );
}
