'use client';

import { BUBBLE_MS } from '@views/gostop/config/rival';
import { rivalReaction } from '@views/gostop/lib/rival';
import { bubbleCueOf, isEcho, isNewCue } from '@views/gostop/lib/rivalView';
import type { GameState } from '@views/gostop/model/types/gostop';
import type { PlaybackStep } from '@views/gostop/model/types/playback';
import type { BubbleCue, Mood, RivalReaction, ShownBubble } from '@views/gostop/model/types/rival';
import { useEffect, useMemo, useState } from 'react';

export interface RivalView {
  rival: RivalReaction;
  rivalMood: Mood;
  rivalBubble: ShownBubble | null;
}

export const useRival = (game: GameState, step: PlaybackStep | null): RivalView => {
  const rival = useMemo(() => rivalReaction(game, step), [game, step]);
  const [lastCue, setLastCue] = useState<BubbleCue | null>(null);
  const [bubble, setBubble] = useState<ShownBubble | null>(null);
  const cue = bubbleCueOf(game, rival);

  if (isNewCue(cue, lastCue)) {
    setLastCue(cue);
    if (!isEcho(cue, bubble)) setBubble({ id: (bubble?.id ?? 0) + 1, mood: cue.mood, line: cue.line });
  }

  useEffect(() => {
    if (!bubble) return undefined;
    const timer = setTimeout(() => setBubble(null), BUBBLE_MS);
    return () => clearTimeout(timer);
  }, [bubble]);

  return useMemo(() => ({ rival, rivalMood: bubble?.mood ?? rival.mood, rivalBubble: bubble }), [rival, bubble]);
};
