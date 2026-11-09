import type { GameRecord } from '../types/record';

export function getRecordPoint(record: GameRecord): number {
  return record.point ?? record.score ?? 0;
}
