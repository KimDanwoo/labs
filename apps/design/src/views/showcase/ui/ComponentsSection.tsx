import { Badge, Button, Card, ThemeToggle } from '@ui/react';
import { Card as FlatCard } from '@ui/react/flat';
import { BADGE_TONES, BUTTON_VARIANTS } from '@views/showcase/model/constants';
import { Section } from './Section';

const GROUP_LABEL = 'text-xs font-semibold uppercase tracking-widest text-muted';

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
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <h3 className={GROUP_LABEL}>Card</h3>
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-2">
          <FlatCard title="Flat Card" description="title·description만으로 바로 쓰는 고빈도 카드." actionLabel="액션">
            <p className="text-sm text-muted">children 영역 — 본문 콘텐츠가 들어간다.</p>
          </FlatCard>
          <Card.Root>
            <Card.Header>
              <Card.Title>Compound Card</Card.Title>
              <Badge tone="info">new</Badge>
            </Card.Header>
            <Card.Description>Root·Header·Title·Description·Body·Footer 슬롯 조합.</Card.Description>
            <Card.Body>
              <p className="text-sm text-foreground">Body 슬롯 — 자유 구성.</p>
            </Card.Body>
            <Card.Footer>Footer 슬롯</Card.Footer>
          </Card.Root>
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <h3 className={GROUP_LABEL}>ThemeToggle</h3>
        <div className="flex items-center gap-md">
          <ThemeToggle />
          <span className="text-sm text-muted">라이트/다크 전환 — 위 색 토큰이 실시간 반응한다.</span>
        </div>
      </div>
    </Section>
  );
}
