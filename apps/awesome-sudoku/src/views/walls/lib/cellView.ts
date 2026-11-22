import {
  EMPTY_LABEL,
  LEANING_CLASS,
  NEUTRAL_CLASS,
  SETTLED_CLASS,
  SIDE_LABEL,
  TARGET_LABEL,
} from '@views/walls/config/cellStyle';
import { colOf, rowOf, sideOfPawn } from '@views/walls/lib/grid';
import type { Owner } from '@views/walls/model/types/walls';

interface CellInput {
  pawns: readonly number[];
  owners: readonly Owner[];
  settled: readonly boolean[];
  targets: ReadonlySet<number>;
}

const tintOf = (owner: Owner, isSettled: boolean): string => {
  if (owner === null) return NEUTRAL_CLASS;
  return isSettled ? SETTLED_CLASS[owner] : LEANING_CLASS[owner];
};

export const cellView = ({ pawns, owners, settled, targets }: CellInput, cell: number) => {
  const pawn = pawns.indexOf(cell);
  const hasPawn = pawn >= 0;
  const isTarget = targets.has(cell);
  const parts = [
    `${rowOf(cell) + 1}행 ${colOf(cell) + 1}열`,
    hasPawn ? SIDE_LABEL[sideOfPawn(pawn)] : EMPTY_LABEL,
    ...(isTarget ? [TARGET_LABEL] : []),
  ];
  return {
    label: parts.join(' '),
    tintClass: tintOf(owners[cell] ?? null, settled[cell] ?? false),
    isTarget: isTarget && !hasPawn,
  };
};
