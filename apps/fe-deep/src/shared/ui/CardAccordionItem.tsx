import type { ReactNode } from 'react';

import { AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui/Accordion';

interface CardAccordionItemProps {
  value: string;
  trigger: ReactNode;
  children: ReactNode;
}

export function CardAccordionItem({ value, trigger, children }: CardAccordionItemProps) {
  // 베이스의 last:border-b-0이 마지막 카드의 바텀 보더를 지우므로 복원한다 — 각 아이템이 독립 카드라서
  return (
    <AccordionItem value={value} className="border border-border/60 last:border-b rounded-xl px-4 shadow-sm">
      <AccordionTrigger className="hover:no-underline py-4">{trigger}</AccordionTrigger>
      <AccordionContent className="pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}
