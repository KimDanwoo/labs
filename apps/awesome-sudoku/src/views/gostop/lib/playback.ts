import { CUT_IN_COPY } from '@views/gostop/config/copy';
import { GAME_ACTION, PHASE, SIDE } from '@views/gostop/config/game';
import { REDUCED_STEP_MS, STEP_KIND, STEP_MS, TURN_MIN_MS } from '@views/gostop/config/playback';
import { without } from '@views/gostop/lib/cards';
import type { GameAction, GameResult, GameState, Side, Table, TurnReport } from '@views/gostop/model/types/gostop';
import type { CutIn, PlaybackStep, SoundName, StepKind } from '@views/gostop/model/types/playback';

type StepExtra = Partial<Omit<PlaybackStep, 'kind' | 'table'>>;

const step = (kind: StepKind, table: Table, extra: StepExtra = {}): PlaybackStep => ({
  kind,
  side: null,
  table,
  revealed: null,
  gathering: [],
  sound: null,
  cutIn: null,
  durationMs: STEP_MS[kind],
  ...extra,
});

const toneOf = (side: Side): CutIn['tone'] => (side === SIDE.ME ? 'mine' : 'rival');

function eventCutIn(report: TurnReport): CutIn | null {
  if (report.events.length === 0) return null;
  return { label: report.events.map((event) => CUT_IN_COPY.events[event]).join(' '), tone: toneOf(report.side) };
}

const RESULT_SOUND: Record<string, SoundName> = {
  [SIDE.ME]: 'win',
  [SIDE.COMPUTER]: 'lose',
};

const resultSound = (result: GameResult | null): SoundName => RESULT_SOUND[result?.winner ?? ''] ?? 'draw';

const playedTable = (prev: Table, side: Side, card: number): Table => ({
  ...prev,
  hands: { ...prev.hands, [side]: without(prev.hands[side], [card]) },
  floor: [...prev.floor, card],
});

function flipSteps(table: Table, report: TurnReport): PlaybackStep[] {
  const { flipped, side } = report;
  if (flipped === null) return [];
  const revealed = { ...table, deck: table.deck.slice(1) };
  return [
    step(STEP_KIND.REVEAL, revealed, { side, revealed: flipped, sound: 'flip' }),
    step(STEP_KIND.LAND, { ...revealed, floor: [...revealed.floor, flipped] }, { side, sound: 'place' }),
  ];
}

function captureSteps(table: Table, report: TurnReport, next: Table): PlaybackStep[] {
  const { side, taken, stolen } = report;
  if (taken.length === 0) return [];
  const captured = {
    ...table,
    floor: without(table.floor, taken),
    captured: { ...table.captured, [side]: [...table.captured[side], ...taken] },
  };
  const cutIn = eventCutIn(report);
  const gather = step(STEP_KIND.GATHER, table, { side, gathering: taken, cutIn, sound: cutIn ? 'cutIn' : 'match' });
  const capture = step(STEP_KIND.CAPTURE, captured, { side, sound: 'capture' });
  const steal = step(STEP_KIND.STEAL, next, { side, sound: 'steal' });
  return stolen.length > 0 ? [gather, capture, steal] : [gather, capture];
}

const lastTableOf = (steps: readonly PlaybackStep[], fallback: Table): Table => steps.at(-1)?.table ?? fallback;

function withPlainCutIn(steps: PlaybackStep[], report: TurnReport): PlaybackStep[] {
  const cutIn = eventCutIn(report);
  const hasCutInStep = steps.some((item) => item.cutIn !== null);
  const shouldAttach = cutIn !== null && !hasCutInStep;
  if (!shouldAttach) return steps;
  return steps.map((item, index) => (index === steps.length - 1 ? { ...item, cutIn, sound: 'cutIn' } : item));
}

function padToMinimum(steps: readonly PlaybackStep[], minimumMs: number): PlaybackStep[] {
  const total = steps.reduce((sum, item) => sum + item.durationMs, 0);
  const missing = minimumMs - total;
  if (missing <= 0) return [...steps];
  return steps.map((item, index) =>
    index === steps.length - 1 ? { ...item, durationMs: item.durationMs + missing } : item,
  );
}

export function turnSteps(prev: Table, report: TurnReport, next: Table): PlaybackStep[] {
  const { side, played } = report;
  const playTable = playedTable(prev, side, played);
  const play = step(STEP_KIND.PLAY, playTable, { side, sound: 'place' });
  const flips = flipSteps(playTable, report);
  const captures = captureSteps(lastTableOf(flips, playTable), report, next);
  const steps = withPlainCutIn([play, ...flips, ...captures], report);
  const settled = steps.map((item, index) => (index === steps.length - 1 ? { ...item, table: next } : item));
  return padToMinimum(settled, TURN_MIN_MS);
}

const resultStep = (next: GameState): PlaybackStep =>
  step(STEP_KIND.RESULT, next.table, { sound: resultSound(next.result) });

function callStep(prev: GameState, next: GameState, action: GameAction): PlaybackStep[] {
  const isGo = action.type === GAME_ACTION.GO;
  const side = prev.turn;
  const label = isGo ? `${next.goCount[side]}${CUT_IN_COPY.go}` : CUT_IN_COPY.stop;
  const call = step(STEP_KIND.CALL, next.table, {
    side,
    cutIn: { label, tone: toneOf(side) },
    sound: isGo ? 'go' : 'stop',
  });
  return isGo ? [call] : [call, resultStep(next)];
}

function playSteps(prev: GameState, next: GameState): PlaybackStep[] {
  if (!next.lastTurn) return [];
  const steps = turnSteps(prev.table, next.lastTurn, next.table);
  return next.phase === PHASE.OVER ? [...steps, resultStep(next)] : steps;
}

const dealSteps = (next: GameState): PlaybackStep[] => [step(STEP_KIND.DEAL, next.table, { sound: 'deal' })];

export function transitionSteps(prev: GameState, next: GameState, action: GameAction): PlaybackStep[] {
  if (action.type === GAME_ACTION.DEAL) return dealSteps(next);
  if (action.type === GAME_ACTION.PLAY) return playSteps(prev, next);
  if (action.type === GAME_ACTION.RESET) return [];
  return callStep(prev, next, action);
}

function mergedCutIn(steps: readonly PlaybackStep[]): CutIn | null {
  const cutIns = steps.flatMap((item) => (item.cutIn ? [item.cutIn] : []));
  const [first] = cutIns;
  if (!first) return null;
  return { label: cutIns.map((cutIn) => cutIn.label).join(' '), tone: first.tone };
}

function mergedSound(steps: readonly PlaybackStep[]): SoundName | null {
  const result = steps.find((item) => item.kind === STEP_KIND.RESULT);
  const cutIn = steps.find((item) => item.cutIn !== null);
  return result?.sound ?? cutIn?.sound ?? steps.at(-1)?.sound ?? null;
}

export function collapseSteps(steps: readonly PlaybackStep[]): PlaybackStep[] {
  const last = steps.at(-1);
  if (!last) return [];
  return [
    {
      ...last,
      revealed: null,
      gathering: [],
      cutIn: mergedCutIn(steps),
      sound: mergedSound(steps),
      durationMs: REDUCED_STEP_MS,
    },
  ];
}

export const totalDuration = (steps: readonly PlaybackStep[]): number =>
  steps.reduce((sum, item) => sum + item.durationMs, 0);
