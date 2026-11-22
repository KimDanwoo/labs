import { CELL_WEIGHT, MARGIN_CAP, SETTLED_SCALE } from '@views/walls/config/ai';
import { CELL_COUNT, SIDE } from '@views/walls/config/board';
import { OUTCOME } from '@views/walls/config/game';
import { pawnsOf, rivalOf, STEPS } from '@views/walls/lib/grid';
import type { Board, Outcome, Owner, Side, Territory } from '@views/walls/model/types/walls';

const UNREACHED = 99;
const QUEUE = new Uint8Array(CELL_COUNT);

const distances = (board: Board, side: Side): Uint8Array => {
  const dist = new Uint8Array(CELL_COUNT).fill(UNREACHED);
  let tail = 0;
  for (const pawn of pawnsOf(side)) {
    const cell = board.pawns[pawn]!;
    dist[cell] = 0;
    QUEUE[tail] = cell;
    tail += 1;
  }
  for (let head = 0; head < tail; head += 1) {
    const cell = QUEUE[head]!;
    for (const step of STEPS[cell]!) {
      const isNew = step !== null && board.walls[step.edge] === 0 && dist[step.to] === UNREACHED;
      if (!isNew) continue;
      dist[step.to] = dist[cell]! + 1;
      QUEUE[tail] = step.to;
      tail += 1;
    }
  }
  return dist;
};

const ownerOf = (mine: number, theirs: number): Owner => {
  if (mine === theirs) return null;
  return mine < theirs ? SIDE.ME : SIDE.COMPUTER;
};

export const surveyTerritory = (board: Board): Territory => {
  const mine = distances(board, SIDE.ME);
  const theirs = distances(board, SIDE.COMPUTER);
  const owners = Array.from(mine, (dist, cell) => ownerOf(dist, theirs[cell]!));
  const settled = Array.from(mine, (dist, cell) => {
    const isOneSided = (dist === UNREACHED) !== (theirs[cell] === UNREACHED);
    return isOneSided;
  });
  const count = (side: Side): number => owners.filter((owner) => owner === side).length;
  return {
    owners,
    settled,
    scores: { [SIDE.ME]: count(SIDE.ME), [SIDE.COMPUTER]: count(SIDE.COMPUTER) },
    isOver: !mine.some((dist, cell) => {
      const isContested = dist !== UNREACHED && theirs[cell] !== UNREACHED;
      return isContested;
    }),
  };
};

export const outcomeOf = ({ isOver, scores }: Territory): Outcome => {
  if (!isOver) return OUTCOME.PLAYING;
  if (scores[SIDE.ME] === scores[SIDE.COMPUTER]) return OUTCOME.DRAW;
  return scores[SIDE.ME] > scores[SIDE.COMPUTER] ? OUTCOME.WON : OUTCOME.LOST;
};

export const assess = (board: Board, side: Side): { value: number; isOver: boolean } => {
  const own = distances(board, side);
  const other = distances(board, rivalOf(side));
  let lead = 0;
  let margin = 0;
  let isContested = false;
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const near = own[cell]!;
    const far = other[cell]!;
    lead += Math.sign(far - near);
    margin += Math.max(-MARGIN_CAP, Math.min(MARGIN_CAP, far - near));
    const isShared = near !== UNREACHED && far !== UNREACHED;
    isContested ||= isShared;
  }
  return { value: isContested ? lead * CELL_WEIGHT + margin : lead * SETTLED_SCALE, isOver: !isContested };
};
