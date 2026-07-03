'use client';

import { SET_STATUS, type SetLog } from '@entities/session/model/types';

type SetHistoryListProps = {
  sets: SetLog[];
  currentSetIndex: number;
};

const STATUS_LABEL: Record<string, string> = {
  [SET_STATUS.done]: '완료',
  [SET_STATUS.partial]: '부분',
  [SET_STATUS.skipped]: '건너뜀',
  [SET_STATUS.pending]: '대기',
};

const STATUS_COLOR: Record<string, string> = {
  [SET_STATUS.done]: 'text-success',
  [SET_STATUS.partial]: 'text-warning',
  [SET_STATUS.skipped]: 'text-muted-foreground',
  [SET_STATUS.pending]: 'text-muted-foreground',
};

// 현재 세트 이전까지 완료된 세트들을 컴팩트하게 표시한다.
export function SetHistoryList({ sets, currentSetIndex }: SetHistoryListProps) {
  const resolvedSets = sets.slice(0, currentSetIndex);

  if (resolvedSets.length === 0) return null;

  return (
    <ul className="flex flex-col gap-xs">
      {resolvedSets.map((set, i) => {
        const statusColor = STATUS_COLOR[set.status] ?? 'text-muted-foreground';
        const statusLabel = STATUS_LABEL[set.status] ?? set.status;

        return (
          <li key={i} className="flex items-center justify-between rounded-md px-lg py-sm bg-primary-subtle">
            <span className="text-sm text-muted-foreground">{i + 1}세트</span>
            <span className="text-sm font-medium text-foreground">
              {set.weight}kg × {set.reps}회
            </span>
            <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
          </li>
        );
      })}
    </ul>
  );
}
