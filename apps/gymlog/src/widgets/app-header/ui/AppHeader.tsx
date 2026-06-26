import { BackIcon } from '@shared/ui';
import Link from 'next/link';
import { HeaderNav } from './HeaderNav';

type AppHeaderProps = {
  // 없으면 홈 모드(브랜드 표시), 있으면 서브 모드(뒤로 + 타이틀).
  title?: string;
  // 우측 네비 노출 여부. 운동·편집 같은 집중 화면은 false.
  showNav?: boolean;
  backHref?: string;
};

export function AppHeader({ title, showNav = true, backHref = '/' }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-content items-center justify-between px-lg">
        <div className="flex min-w-0 items-center gap-sm">
          {title ? (
            <>
              <Link
                href={backHref}
                aria-label="뒤로"
                className="-ml-sm flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-subtle hover:text-foreground"
              >
                <BackIcon className="size-5" />
              </Link>
              <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
            </>
          ) : (
            <Link href="/" className="font-display text-xl font-bold text-foreground">
              gymlog
            </Link>
          )}
        </div>

        {showNav && <HeaderNav />}
      </div>
    </header>
  );
}
