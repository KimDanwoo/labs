'use client';

import { BackIcon } from '@shared/ui';
import { ThemeToggle } from '@ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AppHeaderProps = {
  // 없으면 홈 모드(브랜드 표시), 있으면 서브 모드(뒤로 + 타이틀).
  title?: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();

  // 직전 화면으로 — 진입 경로 그대로 뒤로. 히스토리가 없으면(직접 진입) 홈으로 폴백.
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-mobile items-center gap-sm px-lg">
        {title ? (
          <>
            <button
              type="button"
              onClick={handleBack}
              aria-label="뒤로"
              className="-ml-sm flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary-subtle hover:text-foreground"
            >
              <BackIcon className="size-5" />
            </button>
            <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
          </>
        ) : (
          <Link href="/" className="font-display text-xl font-bold text-foreground">
            gymlog
          </Link>
        )}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
