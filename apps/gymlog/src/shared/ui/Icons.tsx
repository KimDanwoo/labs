import type { ReactNode } from 'react';

type IconProps = { className?: string };

// 라인 스타일 SVG 공통 래퍼 — currentColor로 색 상속.
function LineIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <polyline points="15 18 9 12 15 6" />
    </LineIcon>
  );
}

export function PlanIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </LineIcon>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <line x1="6" y1="20" x2="6" y2="13" />
      <line x1="12" y1="20" x2="12" y2="6" />
      <line x1="18" y1="20" x2="18" y2="10" />
    </LineIcon>
  );
}

export function RoutineIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4.5" cy="6" r="1.2" />
      <circle cx="4.5" cy="12" r="1.2" />
      <circle cx="4.5" cy="18" r="1.2" />
    </LineIcon>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    </LineIcon>
  );
}

export function RankingIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </LineIcon>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <line x1="4" y1="8" x2="20" y2="8" />
      <circle cx="9" cy="8" r="2.2" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="15" cy="16" r="2.2" />
    </LineIcon>
  );
}
