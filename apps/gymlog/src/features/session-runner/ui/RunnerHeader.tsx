'use client';

import { BackIcon } from '@shared/ui';

type RunnerHeaderProps = {
  routineName: string;
  doneCount: number;
  total: number;
  onExit: () => void;
};

// 운동 화면 상단 바 — 다른 화면과 같은 sticky 앱바 틀. 좌측 나가기 + 루틴명, 우측 진행도.
export function RunnerHeader({ routineName, doneCount, total, onExit }: RunnerHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-mobile items-center justify-between gap-md px-lg">
        <div className="flex min-w-0 items-center gap-sm">
          <button
            type="button"
            onClick={onExit}
            aria-label="나가기"
            className="-ml-sm flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary-subtle hover:text-foreground"
          >
            <BackIcon className="size-5" />
          </button>
          <span className="truncate text-base font-semibold text-foreground">{routineName}</span>
        </div>
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          완료 {doneCount}/{total}
        </span>
      </div>
    </header>
  );
}
