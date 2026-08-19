const OUTLINE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const SOLID = { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;

export function ShuffleIcon() {
  return (
    <svg {...OUTLINE} className="size-[19px]">
      <path d="M16 4h4.5v4.5M20.5 4L13 11.5M3.5 20.5L10 14M16 20h4.5v-4.5M14.5 14.5l6 6M3.5 3.5l5 5" />
    </svg>
  );
}

export function PrevIcon() {
  return (
    <svg {...SOLID} className="size-[19px]">
      <path d="M6.5 5.5h2.2v13H6.5zM20 5.5v13l-9.5-6.5z" />
    </svg>
  );
}

export function NextIcon() {
  return (
    <svg {...SOLID} className="size-[19px]">
      <path d="M15.3 5.5h2.2v13h-2.2zM4 5.5v13l9.5-6.5z" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...SOLID} className="size-[21px]">
      <path d="M8 5.2v13.6L19 12z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg {...SOLID} className="size-[21px]">
      <path d="M8 5.5h3v13H8zM13 5.5h3v13h-3z" />
    </svg>
  );
}

export function RepeatOneIcon() {
  return (
    <svg {...OUTLINE} className="size-[19px]">
      <path d="M17 3.5l2.8 2.8L17 9.1M19.8 6.3H7.6a4 4 0 00-4 4v1.2M7 20.5l-2.8-2.8L7 14.9M4.2 17.7h12.2a4 4 0 004-4v-1.2" />
      <path d="M11.1 10.9l1.3-.7v3.6" />
    </svg>
  );
}
