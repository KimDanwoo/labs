export const styles = {
  // 베이스의 last:border-b-0이 마지막 카드의 바텀 보더를 지우므로 복원한다 — 각 아이템이 독립 카드라서
  item: 'border border-border/60 last:border-b rounded-xl px-4 shadow-sm',
  trigger: 'hover:no-underline py-4',
  summary: 'flex items-start gap-3 text-left flex-1 mr-4',
  number: 'text-muted-foreground/60 text-sm font-mono mt-0.5 shrink-0 tabular-nums',
  body: 'flex flex-col gap-1.5 min-w-0',
  question: 'font-normal text-sm leading-relaxed',
  content: 'pb-4',
  answer: 'pl-4 sm:pl-8 overflow-hidden',
} as const;
