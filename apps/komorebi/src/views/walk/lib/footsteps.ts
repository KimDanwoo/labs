import { SURFACE, type Surface } from '../model/world/surfaces';

const STEP_VOLUME = 0.4;

/** Recorded footsteps (Kenney Impact Sounds, CC0), a few takes per ground so steps never repeat exactly. */
const STEP_TAKES = 5;
const STEP_SURFACES = Object.values(SURFACE);
const stepUrl = (surface: Surface, take: number) => `/sounds/steps/${surface}-${take}.m4a`;
/** Evens out the recordings: the soft dirt takes are about 8 dB quieter than the rest. */
const STEP_GAIN = { [SURFACE.dirt]: 2, [SURFACE.stone]: 1, [SURFACE.wood]: 1, [SURFACE.sand]: 1 } satisfies Record<
  Surface,
  number
>;
const STEP_PITCH_SPREAD = 0.16;

export function createFootsteps(context: AudioContext, master: AudioNode) {
  const steps = new Map<Surface, AudioBuffer[]>();
  STEP_SURFACES.forEach((surface) => {
    const takes = Array.from({ length: STEP_TAKES }, (_, take) =>
      fetch(stepUrl(surface, take))
        .then((response) => response.arrayBuffer())
        .then((data) => context.decodeAudioData(data)),
    );
    Promise.all(takes)
      .then((buffers) => steps.set(surface, buffers))
      .catch(() => undefined);
  });
  let lastTake = -1;

  const step = (surface: Surface, loudness: number) => {
    const takes = steps.get(surface);
    if (context.state !== 'running' || !takes) return;
    const take = (lastTake + 1 + Math.floor(Math.random() * (takes.length - 1))) % takes.length;
    lastTake = take;
    const source = context.createBufferSource();
    source.buffer = takes[take]!;
    source.playbackRate.value = 1 + (Math.random() - 0.5) * STEP_PITCH_SPREAD;
    const gain = context.createGain();
    gain.gain.value = STEP_VOLUME * STEP_GAIN[surface] * Math.min(loudness, 2) * (0.8 + Math.random() * 0.4);
    source.connect(gain);
    gain.connect(master);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  };
  return step;
}
