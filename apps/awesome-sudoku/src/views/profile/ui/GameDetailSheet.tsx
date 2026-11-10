'use client';
import { GAME_LEVEL_LABELS, GAME_MODE, formatTime, getRecordPoint, type GameRecord } from '@entities/game';
import { cn } from '@shared/lib/cn';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { memo } from 'react';

import { DetailRow } from './DetailRow';
interface GameDetailSheetProps {
  game: GameRecord | null;
  isOpen: boolean;
  onClose: () => void;
}
export const GameDetailSheet = memo<GameDetailSheetProps>(({ game, isOpen, onClose }) => {
  if (!game) return null;

  const point = getRecordPoint(game);
  const diffLabel = GAME_LEVEL_LABELS[game.difficulty as keyof typeof GAME_LEVEL_LABELS] || game.difficulty;
  const isKiller = game.gameMode === GAME_MODE.KILLER;
  const dateStr = game.createdAt?.toDate?.() ? new Date(game.createdAt.toDate()).toLocaleDateString('ko-KR') : '-';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="게임 결과">
      <div className="space-y-4">
        {/* Point display */}
        <div className="text-center py-4">
          <p className={cn('text-sm', 'text-[rgb(var(--color-text-secondary))]')}>획득 포인트</p>
          <p
            className={cn(
              'text-5xl font-bold font-tabular',
              'bg-gradient-to-r',
              'from-amber-500 to-orange-500',
              'bg-clip-text text-transparent',
            )}
          >
            +{point}
          </p>
        </div>

        {/* Detail rows */}
        <div className={cn('rounded-2xl p-4 space-y-3', 'bg-[rgb(var(--color-bg-tertiary))]')}>
          <DetailRow label="난이도" value={diffLabel} />
          <DetailRow label="모드" value={isKiller ? '킬러' : '클래식'} />
          <DetailRow label="완료 시간" value={formatTime(game.completionTime)} />
          <DetailRow label="힌트 사용" value={`${game.hintsUsed}회`} />
          <DetailRow label="오답" value={`${game.mistakesCount ?? 0}회`} />
          <DetailRow label="날짜" value={dateStr} />
        </div>
      </div>
    </BottomSheet>
  );
});

GameDetailSheet.displayName = 'GameDetailSheet';
