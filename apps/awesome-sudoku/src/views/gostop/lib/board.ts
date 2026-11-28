import { DECK_SIZE } from '@views/gostop/config/cards';
import { PHASE, SIDE } from '@views/gostop/config/game';
import { isSameMonth } from '@views/gostop/lib/cards';
import { bakRisks } from '@views/gostop/lib/risk';
import { scoreOf } from '@views/gostop/lib/score';
import { choiceStage, type TableStage } from '@views/gostop/lib/stage';
import { stopPreviewOf, type StopPreview } from '@views/gostop/lib/stopPreview';
import type {
  FloorChoice,
  GameResult,
  GameState,
  Phase,
  ScoreBreakdown,
  Side,
  Table,
} from '@views/gostop/model/types/gostop';
import type { PlaybackStep } from '@views/gostop/model/types/playback';
import type { BakRisk } from '@views/gostop/model/types/view';

export interface BoardView {
  phase: Phase;
  turn: Side;
  activeSide: Side | null;
  isPlaying: boolean;
  isMyTurn: boolean;
  isDeciding: boolean;
  myHand: readonly number[];
  rivalHandCount: number;
  floor: readonly number[];
  deckCount: number;
  held: number | null;
  revealed: number | null;
  choice: FloorChoice | null;
  gathering: ReadonlySet<number>;
  captured: Record<Side, readonly number[]>;
  scores: Record<Side, ScoreBreakdown>;
  goCount: Record<Side, number>;
  risks: readonly BakRisk[];
  matchable: ReadonlySet<number>;
  result: GameResult | null;
  preview: StopPreview;
}

const ACTIVE_PHASES: ReadonlySet<Phase> = new Set([PHASE.PLAY, PHASE.CHOOSE, PHASE.DECIDE]);

type TurnView = Pick<BoardView, 'phase' | 'turn' | 'activeSide' | 'isPlaying' | 'isMyTurn' | 'isDeciding' | 'result'>;
type TableView = Omit<BoardView, keyof TurnView | 'held' | 'revealed' | 'choice' | 'gathering' | 'goCount' | 'preview'>;

function turnView(game: GameState, step: PlaybackStep | null): TurnView {
  const isPlaying = step !== null;
  const phase = isPlaying ? PHASE.PLAY : game.phase;
  const turn = step?.side ?? game.turn;
  const isMine = !isPlaying && game.turn === SIDE.ME;
  return {
    phase,
    turn,
    activeSide: ACTIVE_PHASES.has(phase) ? turn : null,
    isPlaying,
    isMyTurn: isMine && game.phase === PHASE.PLAY,
    isDeciding: isMine && game.phase === PHASE.DECIDE,
    result: isPlaying ? null : game.result,
  };
}

function tableView({ hands, floor, deck, captured }: Table): TableView {
  return {
    myHand: hands.me,
    rivalHandCount: hands.computer.length,
    floor,
    deckCount: deck.length,
    captured,
    scores: { [SIDE.ME]: scoreOf(captured.me), [SIDE.COMPUTER]: scoreOf(captured.computer) },
    risks: bakRisks(captured.me, captured.computer),
    matchable: new Set(hands.me.filter((card) => floor.some((id) => isSameMonth(id, card)))),
  };
}

const shownDeckCount = (phase: Phase, deckLength: number): number => (phase === PHASE.READY ? DECK_SIZE : deckLength);

function settledStage(game: GameState): TableStage {
  if (!game.pending) return { table: game.table, held: null, revealed: null };
  return choiceStage(game.table, game.turn, game.pending);
}

const myChoiceOf = (game: GameState): FloorChoice | null =>
  game.turn === SIDE.ME ? (game.pending?.choice ?? null) : null;

export function boardView(game: GameState, step: PlaybackStep | null): BoardView {
  const { table, held, revealed } = step ?? settledStage(game);
  return {
    ...turnView(game, step),
    ...tableView(table),
    deckCount: shownDeckCount(game.phase, table.deck.length),
    held,
    revealed,
    choice: step ? null : myChoiceOf(game),
    gathering: new Set(step?.gathering ?? []),
    goCount: game.goCount,
    preview: stopPreviewOf(game, table),
  };
}
