import { createCryptoRandom, type RandomInt } from '@shared/lib/random';
import { COMPUTER_DELAY_MS, GAME_ACTION, SIDE } from '@views/gostop/config/game';
import {
  GAME_ID_BOUND,
  GAME_ID_PARTS,
  GAME_ID_RADIX,
  MOTION,
  PLAYBACK_ACTION,
  SPEED_FACTOR,
} from '@views/gostop/config/playback';
import { boardView, type BoardView } from '@views/gostop/lib/board';
import { shuffleDealableDeck } from '@views/gostop/lib/deck';
import { flightPlanOf, type FlightPlan } from '@views/gostop/lib/flight';
import { useCapturedSheet, type CapturedSheetControl } from '@views/gostop/model/hooks/useCapturedSheet';
import { useComputerTurn } from '@views/gostop/model/hooks/useComputerTurn';
import { useCutIn, type ShownCutIn } from '@views/gostop/model/hooks/useCutIn';
import { useGameRecord } from '@views/gostop/model/hooks/useGameRecord';
import { useGameSound } from '@views/gostop/model/hooks/useGameSound';
import { useGostopSettings, type GostopSettingsControl } from '@views/gostop/model/hooks/useGostopSettings';
import { useHandFocusRequest, type HandFocusControl } from '@views/gostop/model/hooks/useHandFocusRequest';
import { usePlaybackClock } from '@views/gostop/model/hooks/usePlaybackClock';
import { useReducedMotion } from '@views/gostop/model/hooks/useReducedMotion';
import { INITIAL_PLAYBACK, playbackReducer } from '@views/gostop/model/reducer/playbackReducer';
import type { GameAction } from '@views/gostop/model/types/gostop';
import type { PlaybackStep } from '@views/gostop/model/types/playback';
import type { GameRecord } from '@views/gostop/model/types/record';
import { useCallback, useMemo, useReducer, useState } from 'react';

export interface GostopGame extends BoardView, GostopSettingsControl, CapturedSheetControl, HandFocusControl {
  announcement: string;
  cutIn: ShownCutIn | null;
  step: PlaybackStep | null;
  flight: FlightPlan | null;
  record: GameRecord;
  isReducedMotion: boolean;
  deal: () => void;
  play: (card: number) => void;
  choose: (pick: number) => void;
  go: () => void;
  stop: () => void;
}

const createGameId = (random: RandomInt): string =>
  Array.from({ length: GAME_ID_PARTS }, () => random(GAME_ID_BOUND).toString(GAME_ID_RADIX)).join('-');

export const useGostopGame = (): GostopGame => {
  const [playback, dispatch] = useReducer(playbackReducer, INITIAL_PLAYBACK);
  const [random] = useState(createCryptoRandom);
  const settings = useGostopSettings();
  const isReducedMotion = useReducedMotion();
  const speedFactor = SPEED_FACTOR[settings.speed];
  const motion = isReducedMotion ? MOTION.REDUCED : MOTION.FULL;
  const step = playback.steps[playback.cursor] ?? null;
  const isSettled = step === null;
  const board = useMemo(() => boardView(playback.game, step), [playback.game, step]);
  const isSheetBlocked = board.isDeciding || board.choice !== null || board.result !== null;
  const capturedSheet = useCapturedSheet(isSheetBlocked);
  const handFocus = useHandFocusRequest();

  const act = useCallback(
    (action: GameAction, gameId?: string) => dispatch({ type: PLAYBACK_ACTION.APPLY, action, motion, gameId }),
    [motion],
  );

  usePlaybackClock(playback, dispatch, speedFactor);
  useComputerTurn({ state: playback.game, isSettled, random, delayMs: COMPUTER_DELAY_MS * speedFactor }, act);
  useGameSound(step, settings.isMuted);
  const cutIn = useCutIn(step);
  const record = useGameRecord(playback.game, playback.gameId, isSettled);

  const actions = useMemo(
    () => ({
      deal: () => act({ type: GAME_ACTION.DEAL, deck: shuffleDealableDeck(random) }, createGameId(random)),
      play: (card: number) => act({ type: GAME_ACTION.PLAY, side: SIDE.ME, card }),
      choose: (pick: number) => act({ type: GAME_ACTION.CHOOSE, side: SIDE.ME, pick }),
      go: () => act({ type: GAME_ACTION.GO, side: SIDE.ME }),
      stop: () => act({ type: GAME_ACTION.STOP, side: SIDE.ME }),
    }),
    [act, random],
  );

  return useMemo(
    () => ({
      ...board,
      ...settings,
      ...capturedSheet,
      ...handFocus,
      ...actions,
      announcement: isSettled ? playback.announcement : '',
      cutIn,
      step,
      flight: flightPlanOf(step, speedFactor, isReducedMotion),
      record,
      isReducedMotion,
    }),
    [
      board,
      playback.announcement,
      step,
      settings,
      capturedSheet,
      handFocus,
      actions,
      isSettled,
      cutIn,
      speedFactor,
      isReducedMotion,
      record,
    ],
  );
};
