'use client';

import { HistoryIcon, HomeIcon, RankingIcon, RoutineIcon, SettingsIcon } from '@shared/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';

type Tab = { href: string; label: string; Icon: ComponentType<{ className?: string }> };

const LEFT: Tab[] = [
  { href: '/history', label: '기록', Icon: HistoryIcon },
  { href: '/ranking', label: '랭킹', Icon: RankingIcon },
];
const RIGHT: Tab[] = [
  { href: '/routines', label: '루틴', Icon: RoutineIcon },
  { href: '/settings', label: '설정', Icon: SettingsIcon },
];
const TAB_PATHS: readonly string[] = ['/', ...LEFT.map((t) => t.href), ...RIGHT.map((t) => t.href)];

// 모바일 하단 탭바 — 가운데 홈을 원형으로 도드라지게, 양옆에 세부 탭(벨트 모양).
// 핵심 화면에서만 노출(세션·빌더·약관 등 하위 화면은 숨김).
export function BottomNav() {
  const pathname = usePathname();
  if (!TAB_PATHS.includes(pathname)) {
    return null;
  }

  const sideTab = ({ href, label, Icon }: Tab) => {
    const isActive = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center gap-0.5 py-sm text-xs font-medium transition-colors ${
          isActive ? 'text-primary' : 'text-muted hover:text-foreground'
        }`}
      >
        <Icon className="size-6" />
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-card-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-content items-end justify-around px-sm">
        {LEFT.map(sideTab)}

        <Link
          href="/"
          aria-label="홈"
          aria-current={pathname === '/' ? 'page' : undefined}
          className="-mt-6 flex size-14 shrink-0 flex-col items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
        >
          <HomeIcon className="size-6" />
        </Link>

        {RIGHT.map(sideTab)}
      </div>
    </nav>
  );
}
