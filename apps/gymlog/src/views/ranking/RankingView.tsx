'use client';

import { firebaseUserAtom } from '@entities/user/model/store';
import { useLeaderboard } from '@features/ranking/model/hooks';
import { formatVolume } from '@shared/lib';
import { AppHeader } from '@widgets/app-header/ui';
import { useAtomValue } from 'jotai';

const RANK_BADGE = ['🥇', '🥈', '🥉'];

export function RankingView() {
  const { entries, loading } = useLeaderboard();
  const user = useAtomValue(firebaseUserAtom);

  return (
    <>
      <AppHeader title="랭킹" />
      <main className="mx-auto flex w-full max-w-content flex-col gap-md px-lg pb-28 pt-lg">
        <p className="text-sm text-muted">누적 볼륨 · 레벨 · 주간 볼륨을 합산한 종합 점수 순위예요.</p>

        {!user && (
          <p className="rounded-lg border border-card-border bg-glass p-md text-sm text-muted">
            로그인하면 랭킹에 참여할 수 있어요.
          </p>
        )}

        {loading && <p className="text-muted">불러오는 중…</p>}

        {!loading && entries.length === 0 && (
          <p className="rounded-lg border border-card-border bg-glass p-lg text-sm text-muted">
            아직 랭킹이 없어요. 첫 기록의 주인공이 되어보세요.
          </p>
        )}

        {!loading &&
          entries.map((entry, index) => {
            const isMe = entry.uid === user?.uid;
            return (
              <div
                key={entry.uid}
                className={`flex items-center gap-md rounded-lg border p-md ${
                  isMe ? 'border-primary bg-primary-subtle' : 'border-card-border bg-glass'
                }`}
              >
                <span className="w-8 shrink-0 text-center text-base font-bold text-foreground">
                  {RANK_BADGE[index] ?? index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-foreground">{entry.displayName}</span>
                  <span className="text-xs text-muted">
                    Lv.{entry.level} · {formatVolume(entry.totalVolume)}
                  </span>
                </div>
                <span className="shrink-0 font-display text-lg font-bold text-primary">{entry.score}</span>
              </div>
            );
          })}
      </main>
    </>
  );
}
