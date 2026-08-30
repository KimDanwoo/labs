import { CELL_MARK, STAR_ICON, X_ICON } from '@entities/stardoku/model/constants';
import type { CellMark } from '@entities/stardoku/model/types';
import { cn } from '@shared/model/utils';
import { memo } from 'react';

/** iOS 롱프레스 콜아웃·회색 탭 플래시 제거 — 둘 다 드래그 도중 끼어들어 제스처를 끊는다 */
const IOS_TOUCH_RESET = { WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' } as const;

interface StardokuCellProps {
  row: number;
  col: number;
  mark: CellMark;
  colorClass: string;
  hasRegionBorderTop: boolean;
  hasRegionBorderLeft: boolean;
  /** 별도쿠 규칙(행·열·구역 중복 / 인접)을 어긴 별 */
  isViolating: boolean;
  /** 클리어 연출 중 — 별이 순차로 팝한다 */
  popDelayMs: number | null;
  onKeyboardTap: (row: number, col: number, time: number) => void;
}

export const StardokuCell = memo<StardokuCellProps>(
  ({ row, col, mark, colorClass, hasRegionBorderTop, hasRegionBorderLeft, isViolating, popDelayMs, onKeyboardTap }) => (
    <button
      type="button"
      data-stardoku-cell
      data-row={row}
      data-col={col}
      aria-label={`${row + 1}행 ${col + 1}열${isViolating ? ' — 규칙 위반' : ''}`}
      onClick={(event) => {
        // 포인터 탭은 보드 제스처가 처리 — 키보드(Enter/Space, detail 0)만 여기서
        if (event.detail === 0) onKeyboardTap(row, col, event.timeStamp);
      }}
      style={IOS_TOUCH_RESET}
      className={cn(
        'relative flex items-center justify-center overflow-hidden touch-none select-none',
        'border-r border-b border-black/10 dark:border-white/10',
        colorClass,
        hasRegionBorderTop && 'border-t-2 border-t-[rgb(var(--color-text-primary))]/85',
        hasRegionBorderLeft && 'border-l-2 border-l-[rgb(var(--color-text-primary))]/85',
        'focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:-outline-offset-2',
      )}
    >
      {mark === CELL_MARK.STAR && (
        <span
          className={cn(
            'pointer-events-none text-base leading-none sm:text-xl',
            popDelayMs !== null && 'animate-star-pop',
          )}
          style={popDelayMs !== null ? { animationDelay: `${popDelayMs}ms` } : undefined}
        >
          {STAR_ICON}
        </span>
      )}
      {mark === CELL_MARK.X && (
        <span className="pointer-events-none text-sm font-bold leading-none text-[rgb(var(--color-text-secondary))] opacity-70">
          {X_ICON}
        </span>
      )}
      {isViolating && (
        <span className="pointer-events-none absolute inset-0.5 animate-pulse rounded-md border-2 border-rose-500 bg-rose-500/25" />
      )}
    </button>
  ),
);

StardokuCell.displayName = 'StardokuCell';
