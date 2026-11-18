export const styles = {
  root: 'relative overflow-hidden',
  viewport:
    'focus-visible:ring-ring/50 size-full max-h-[inherit] rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1',
  scrollbar: {
    base: 'flex touch-none p-px transition-colors select-none',
    vertical: 'h-full w-2.5 border-l border-l-transparent',
    horizontal: 'h-2.5 flex-col border-t border-t-transparent',
  },
  thumb: 'bg-border relative flex-1 rounded-full',
} as const;
