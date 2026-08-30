const OUTLINE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/** 목록(줄) + 재생 삼각형 — 재생목록 화면으로 가는 버튼. */
export function QueueIcon() {
  return (
    <svg {...OUTLINE} className="size-[20px]">
      <path d="M4 6.5h11M4 12h11M4 17.5h7" />
      <path d="M17.5 13.5l4 2.5-4 2.5z" />
    </svg>
  );
}
