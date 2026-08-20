'use client';

import { useAtom } from 'jotai';
import { isPlaylistCollapsedAtom } from '../model/store';

const CHEVRON = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/**
 * 접히는 방향이 브레이크포인트마다 다르다 — 모바일은 아래로 줄고 데스크톱은 왼쪽으로 사라진다.
 * 화살표가 "누르면 일어날 일"을 가리키도록 회전을 따로 준다. 기본 path는 '‹'.
 */
const ARROW = {
  expanded: '-rotate-90 min-[820px]:rotate-0',
  collapsed: 'rotate-90 min-[820px]:rotate-180',
} as const;

type PlaylistToggleProps = {
  className?: string;
};

export function PlaylistToggle({ className = '' }: PlaylistToggleProps) {
  const [isCollapsed, setIsCollapsed] = useAtom(isPlaylistCollapsedAtom);
  const label = isCollapsed ? '재생목록 펼치기' : '재생목록 접기';

  return (
    <button
      type="button"
      aria-expanded={!isCollapsed}
      aria-controls="playlist"
      aria-label={label}
      title={label}
      onClick={() => setIsCollapsed((collapsed) => !collapsed)}
      className={`text-dim hover:text-paper hover:bg-hairline-soft focus-visible:text-paper focus-visible:bg-hairline-soft grid size-[30px] shrink-0 place-items-center rounded-full transition-colors duration-200 outline-none ${className}`}
    >
      <svg
        {...CHEVRON}
        className={`size-[17px] transition-transform duration-300 ${isCollapsed ? ARROW.collapsed : ARROW.expanded}`}
      >
        <path d="M14.5 6.5L9 12l5.5 5.5" />
      </svg>
    </button>
  );
}
