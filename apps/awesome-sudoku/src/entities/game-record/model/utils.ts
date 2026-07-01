import { GameRecord } from "./types";

export function getRecordPoint(record: GameRecord): number {
  return record.point ?? record.score ?? 0;
}
