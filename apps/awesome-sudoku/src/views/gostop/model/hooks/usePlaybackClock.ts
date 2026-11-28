import { PLAYBACK_ACTION } from '@views/gostop/config/playback';
import type { PlaybackAction, PlaybackState } from '@views/gostop/model/types/playback';
import { useEffect, type Dispatch } from 'react';

export const usePlaybackClock = (
  state: PlaybackState,
  dispatch: Dispatch<PlaybackAction>,
  speedFactor: number,
): void => {
  const { steps, cursor } = state;
  const step = steps[cursor];

  useEffect(() => {
    if (!step) return undefined;
    const timer = setTimeout(() => dispatch({ type: PLAYBACK_ACTION.ADVANCE, steps }), step.durationMs * speedFactor);
    return () => clearTimeout(timer);
  }, [step, steps, dispatch, speedFactor]);
};
