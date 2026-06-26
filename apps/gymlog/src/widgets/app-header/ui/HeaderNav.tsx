'use client';

import { HistoryIcon, PlanIcon, RankingIcon, RoutineIcon, SettingsIcon } from '@shared/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/routines', label: '루틴', Icon: RoutineIcon },
  { href: '/plan', label: '플랜', Icon: PlanIcon },
  { href: '/history', label: '기록', Icon: HistoryIcon },
  { href: '/ranking', label: '랭킹', Icon: RankingIcon },
  { href: '/settings', label: '설정', Icon: SettingsIcon },
] as const;

// 모든 탐색 화면에서 동일하게 노출되는 아이콘 네비 — 현재 경로는 강조한다.
export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-xs">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex size-9 items-center justify-center rounded-md transition-colors ${
              isActive ? 'text-primary' : 'text-muted hover:bg-primary-subtle hover:text-foreground'
            }`}
          >
            <Icon className="size-5" />
          </Link>
        );
      })}
    </nav>
  );
}
