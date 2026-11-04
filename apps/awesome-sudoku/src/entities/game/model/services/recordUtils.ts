import type { GameRecord } from '@entities/game/model/types';

export function getRecordPoint(record: GameRecord): number {
  return record.point ?? record.score ?? 0;
}
