import type { Voices } from '@views/walk/lib/audioSynth';
import { PLACE_ACTION, type PlaceAction } from '@views/walk/model/world/world';

export type FishingCue = 'cast' | 'waiting' | 'bite' | 'hook' | 'success' | 'rare' | 'miss';

export function createCues(context: AudioContext, { tone, whoosh }: Voices) {
  const CUES = {
    [PLACE_ACTION.skip]: () =>
      [0, 0.3, 0.55].forEach((at, i) => tone(620 - i * 60, { at, seconds: 0.12, glideTo: 180 })),
    [PLACE_ACTION.gust]: () => whoosh(1.6, 400, 1_600, 1.4),
    [PLACE_ACTION.shell]: () => {
      whoosh(1.8, 300, 160, 1.6);
      tone(2_600, { at: 0.5, seconds: 0.25, volume: 0.05 });
    },
    [PLACE_ACTION.bell]: () =>
      [1_180, 2_470, 3_180].forEach((f, i) => tone(f, { seconds: 2.2 - i * 0.5, volume: 0.07 / (i + 1) })),
    [PLACE_ACTION.schoolBell]: () => {
      tone(784, { seconds: 0.9, volume: 0.1 });
      tone(659, { at: 0.55, seconds: 1.2, volume: 0.1 });
    },
    [PLACE_ACTION.windChime]: () =>
      [0, 0.12, 0.27, 0.36, 0.55].forEach((at) =>
        tone(2_000 + Math.random() * 1_600, { at, seconds: 0.9, volume: 0.04 }),
      ),
    [PLACE_ACTION.book]: () => {
      whoosh(0.35, 2_400, 900, 0.5);
      tone(1_480, { at: 0.45, seconds: 0.5, volume: 0.035 });
    },
  } satisfies Record<PlaceAction, () => void>;
  const cue = (kind: PlaceAction) => {
    if (context.state === 'running') CUES[kind]();
  };
  const fishingCue = (kind: FishingCue) => {
    if (context.state !== 'running') return;
    if (kind === 'cast') whoosh(0.35, 400, 1400, 0.3);
    else if (kind === 'waiting') tone(420, { seconds: 0.18, glideTo: 100 });
    else if (kind === 'bite') [0, 0.14].forEach((at) => tone(880, { at, seconds: 0.15 }));
    else if (kind === 'hook') tone(520, { seconds: 0.22, glideTo: 1040 });
    else if (kind === 'miss') tone(330, { seconds: 0.3, glideTo: 160, volume: 0.06 });
    else
      (kind === 'rare' ? [523, 659, 784, 1047, 1319] : [523, 659, 784]).forEach((frequency, index) =>
        tone(frequency, { at: index * 0.12, seconds: 0.55, volume: 0.09 }),
      );
  };
  return { cue, fishingCue };
}
