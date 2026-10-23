import { TIME, type TimeOfDay, type Weather } from '@features/walk/model/constants';
import { SURFACE, type Surface } from '@shared/world/surfaces';
import { PLACE_ACTION, type PlaceAction, type Region } from '@shared/world/world';
import { ambienceMix, type AmbienceMix } from './ambienceMix';

const MASTER_VOLUME = 0.22;
const LAYER_VOLUME = { water: 0.5, waves: 0.9, cicadas: 0.012, rain: 0.7 } as const;
const FADE_SECONDS = 1.2;
const CALL_INTERVAL_MS = 6_500;
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
/** Each step plays a touch faster or slower, as real strides do. */
const STEP_PITCH_SPREAD = 0.16;

function brownNoise(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < data.length; i++) {
    previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
    data[i] = previous;
  }
  return buffer;
}

/** Short pitched calls: a falling bird phrase by day, a high cricket trill at dusk. */
function call(
  context: AudioContext,
  output: AudioNode,
  { pitch, count, gap, level }: { pitch: number; count: number; gap: number; level: number },
) {
  for (let i = 0; i < count; i++) {
    const now = context.currentTime + i * gap;
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(pitch + Math.random() * 500, now);
    tone.frequency.exponentialRampToValueAtTime(pitch * 1.7, now + 0.07);
    tone.frequency.exponentialRampToValueAtTime(pitch * 0.95, now + 0.15);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07 * level, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    tone.connect(gain);
    gain.connect(output);
    tone.start(now);
    tone.stop(now + 0.18);
    tone.onended = () => {
      tone.disconnect();
      gain.disconnect();
    };
  }
}

/** Wind with place-specific water, waves and insects, synthesized locally; no remote audio assets. */
export function createAmbience() {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(context.destination);
  const noise = brownNoise(context, 4);
  const nodes: AudioNode[] = [master];
  const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];

  const layer = (volume: number) => {
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    nodes.push(gain);
    return { gain, volume };
  };
  const filteredNoise = (type: BiquadFilterType, frequency: number, output: AudioNode) => {
    const source = context.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    source.connect(filter);
    filter.connect(output);
    source.start();
    sources.push(source);
    nodes.push(source, filter);
  };
  const oscillator = (type: OscillatorType, frequency: number, output: AudioNode) => {
    const source = context.createOscillator();
    source.type = type;
    source.frequency.value = frequency;
    source.connect(output);
    source.start();
    sources.push(source);
    nodes.push(source);
    return source;
  };

  filteredNoise('lowpass', 650, master);
  const water = layer(LAYER_VOLUME.water);
  filteredNoise('bandpass', 1_400, water.gain);
  const waves = layer(LAYER_VOLUME.waves);
  const swell = context.createGain();
  swell.gain.value = 0.5;
  swell.connect(waves.gain);
  nodes.push(swell);
  filteredNoise('lowpass', 380, swell);
  const swellDepth = context.createGain();
  swellDepth.gain.value = 0.45;
  swellDepth.connect(swell.gain);
  nodes.push(swellDepth);
  oscillator('sine', 0.09, swellDepth);
  const cicadas = layer(LAYER_VOLUME.cicadas);
  const buzz = context.createGain();
  buzz.gain.value = 0.5;
  buzz.connect(cicadas.gain);
  nodes.push(buzz);
  oscillator('sawtooth', 4_300, buzz);
  const pulseDepth = context.createGain();
  pulseDepth.gain.value = 0.5;
  pulseDepth.connect(buzz.gain);
  nodes.push(pulseDepth);
  oscillator('square', 28, pulseDepth);

  const rainfall = layer(LAYER_VOLUME.rain);
  filteredNoise('highpass', 1_800, rainfall.gain);

  let mix: AmbienceMix = ambienceMix('village', TIME.day);
  const callTimer = window.setInterval(() => {
    if (context.state !== 'running') return;
    if (mix.birds > 0) call(context, master, { pitch: 1_800, count: 3, gap: 0.19, level: mix.birds });
    if (mix.crickets > 0) call(context, master, { pitch: 4_200, count: 6, gap: 0.09, level: mix.crickets });
  }, CALL_INTERVAL_MS);
  void context.resume();

  // Footsteps stay silent until their recordings have loaded; a failed one just leaves that ground quiet.
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

  /** A single decaying sine, the building block of plops, bells and chimes. */
  const tone = (frequency: number, { at = 0, seconds = 0.6, volume = 0.12, glideTo = frequency } = {}) => {
    const start = context.currentTime + at;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0005, start + seconds);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + seconds);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  };
  const whoosh = (seconds: number, from: number, to: number, volume: number) => {
    const start = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + seconds);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + seconds * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
    source.stop(start + seconds);
    source.onended = () => [source, filter, gain].forEach((node) => node.disconnect());
  };
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
  } satisfies Record<PlaceAction, () => void>;
  const cue = (kind: PlaceAction) => {
    if (context.state === 'running') CUES[kind]();
  };

  return {
    step,
    cue,
    setScene(region: Region, time: TimeOfDay, weather: Weather) {
      mix = ambienceMix(region, time, weather);
      const now = context.currentTime;
      for (const [{ gain, volume }, level] of [
        [water, mix.water],
        [waves, mix.waves],
        [cicadas, mix.cicadas],
        [rainfall, mix.rain],
      ] as const) {
        gain.gain.setTargetAtTime(volume * level, now, FADE_SECONDS / 3);
      }
    },
    dispose() {
      clearInterval(callTimer);
      sources.forEach((source) => source.stop());
      nodes.forEach((node) => node.disconnect());
      void context.close();
    },
  };
}
