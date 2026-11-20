import type { ReactNode } from 'react';

import { AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui/Accordion';

interface CardAccordionItemProps {
  value: string;
  trigger: ReactNode;
  children: ReactNode;
}

const KEEP_LAST_CARD_BOTTOM_BORDER = 'last:border-b';

export function CardAccordionItem({ value, trigger, children }: CardAccordionItemProps) {
  return (
    <AccordionItem
      value={value}
      className={`border border-border/60 ${KEEP_LAST_CARD_BOTTOM_BORDER} rounded-xl px-4 shadow-sm`}
    >
      <AccordionTrigger className="hover:no-underline py-4">{trigger}</AccordionTrigger>
      <AccordionContent className="pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}
