import { SIDE } from '@views/walls/config/board';
import { GAME_ACTION } from '@views/walls/config/game';
import { boardOf, createBoard, play } from '@views/walls/lib/board';
import { cellAt, rivalOf, sideAtPly } from '@views/walls/lib/grid';
import { legalMoves, moveTargets } from '@views/walls/lib/moves';
import { chooseMove } from '@views/walls/lib/search';
import { outcomeOf, surveyTerritory } from '@views/walls/lib/territory';
import { gameReducer, INITIAL_STATE } from '@views/walls/model/reducer/gameReducer';
import type { Move, Side } from '@views/walls/model/types/walls';
import { describe, expect, it } from 'vitest';

const LIMITS = { budgetMs: 60_000, maxDepth: 3 };

const playOut = (strong: Side): { winner: string; plies: number } => {
  const moves: Move[] = [];
  while (!surveyTerritory(boardOf(moves)).isOver) {
    const side = sideAtPly(moves.length);
    const move = chooseMove(moves, side, side === strong ? LIMITS : { budgetMs: 60_000, maxDepth: 2 });
    if (!move) break;
    moves.push(move);
  }
  return { winner: outcomeOf(surveyTerritory(boardOf(moves))), plies: moves.length };
};

describe('담쌓기', () => {
  it('말은 담과 다른 말을 넘지 못하고 꺾어서 최대 2칸 간다', () => {
    const board = createBoard();
    expect(moveTargets(board, 0).sort((a, b) => a - b)).toEqual(
      [
        cellAt(3, 1),
        cellAt(4, 0),
        cellAt(4, 1),
        cellAt(4, 2),
        cellAt(5, 0),
        cellAt(5, 1),
        cellAt(5, 2),
        cellAt(6, 0),
        cellAt(6, 1),
        cellAt(6, 2),
      ].sort((a, b) => a - b),
    );
    play(board, { pawn: 0, to: cellAt(5, 1), edge: cellAt(4, 1) * 2 });
    expect(moveTargets(board, 0)).not.toContain(cellAt(4, 1));
  });

  it('구역이 갈라지기 전에는 끝나지 않고 처음 예상 땅은 같다', () => {
    const territory = surveyTerritory(createBoard());
    expect(territory.isOver).toBe(false);
    expect(territory.scores[SIDE.ME]).toBe(territory.scores[SIDE.COMPUTER]);
    expect(territory.settled.some(Boolean)).toBe(false);
  });

  it('차례가 아닌 수와 규칙에 없는 수는 무시한다', () => {
    const [first] = legalMoves(createBoard(), SIDE.ME);
    const play1 = { type: GAME_ACTION.PLAY, move: first!, side: SIDE.ME } as const;
    expect(gameReducer(INITIAL_STATE, { ...play1, side: SIDE.COMPUTER })).toBe(INITIAL_STATE);
    expect(gameReducer(INITIAL_STATE, { ...play1, move: { ...first!, to: 0 } })).toBe(INITIAL_STATE);
    expect(gameReducer(INITIAL_STATE, play1).moves).toHaveLength(1);
  });

  it.each([SIDE.ME, SIDE.COMPUTER] as const)(
    '세 수 앞을 보는 쪽(%i)이 두 수 보는 쪽을 이긴다',
    (strong) => {
      const { winner, plies } = playOut(strong);
      expect(plies).toBeGreaterThan(0);
      expect(winner).toBe(strong === SIDE.ME ? 'won' : 'lost');
      expect(rivalOf(strong)).not.toBe(strong);
    },
    60_000,
  );
});
