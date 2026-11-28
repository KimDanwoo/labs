import { PHASE, SIDE, TURN_EVENT } from '@views/gostop/config/game';
import { STEP_KIND } from '@views/gostop/config/playback';
import { REACTION, REACTION_LINES, REACTION_MOOD } from '@views/gostop/config/rival';
import { scoreOf } from '@views/gostop/lib/score';
import type { GameResult, GameState, Side, TurnReport } from '@views/gostop/model/types/gostop';
import type { PlaybackStep } from '@views/gostop/model/types/playback';
import type { Reaction, RivalReaction } from '@views/gostop/model/types/rival';

const RESULT_REACTION: Record<string, Reaction> = {
  [SIDE.COMPUTER]: REACTION.RIVAL_WON,
  [SIDE.ME]: REACTION.RIVAL_LOST,
};

const resultReaction = (result: GameResult | null): Reaction => RESULT_REACTION[result?.winner ?? ''] ?? REACTION.DRAW;

const isBlunder = (turn: TurnReport | null): boolean =>
  turn !== null && turn.events.length > 0 && turn.events.every((event) => event === TURN_EVENT.PPUK);

function eventReaction(isRival: boolean, turn: TurnReport | null): Reaction {
  if (isBlunder(turn)) return isRival ? REACTION.RIVAL_BLUNDER : REACTION.MY_BLUNDER;
  const hasRobbed = !isRival && turn !== null && turn.stolen.length > 0;
  if (hasRobbed) return REACTION.ROBBED;
  return isRival ? REACTION.RIVAL_EVENT : REACTION.MY_EVENT;
}

function stepReaction(step: PlaybackStep, game: GameState): Reaction {
  if (!step.cutIn) return REACTION.QUIET;
  const isRival = step.cutIn.tone === 'rival';
  if (step.kind !== STEP_KIND.CALL) return eventReaction(isRival, game.lastTurn);
  if (game.phase === PHASE.OVER) return REACTION.QUIET;
  return isRival ? REACTION.RIVAL_GO : REACTION.MY_GO;
}

function isWaitingAfterGo(game: GameState, side: Side): boolean {
  const hasGone = game.goCount[side] > 0;
  const isSameScore = scoreOf(game.table.captured[side]).total === game.goScore[side];
  return hasGone && isSameScore;
}

function turnReaction(game: GameState): Reaction {
  const { lastTurn } = game;
  if (!lastTurn) return REACTION.QUIET;
  const isQuiet = lastTurn.events.length === 0 || isWaitingAfterGo(game, lastTurn.side);
  if (isQuiet) return REACTION.QUIET;
  return eventReaction(lastTurn.side === SIDE.COMPUTER, lastTurn);
}

function settledReaction(game: GameState): Reaction {
  if (game.phase === PHASE.OVER) return resultReaction(game.result);
  const isMyDecision = game.phase === PHASE.DECIDE && game.turn === SIDE.ME;
  if (isMyDecision) return REACTION.MY_DECIDING;
  const isWaiting = game.phase === PHASE.READY || game.phase === PHASE.CHOOSE;
  return isWaiting ? REACTION.QUIET : turnReaction(game);
}

const turnCount = (game: GameState): number => game.table.captured.me.length + game.table.captured.computer.length;

function lineOf(reaction: Reaction, seed: number): string | null {
  const lines = REACTION_LINES[reaction];
  return lines[seed % lines.length] ?? null;
}

export function rivalReaction(game: GameState, step: PlaybackStep | null): RivalReaction {
  const reaction = step ? stepReaction(step, game) : settledReaction(game);
  return { reaction, mood: REACTION_MOOD[reaction], line: lineOf(reaction, turnCount(game)) };
}
