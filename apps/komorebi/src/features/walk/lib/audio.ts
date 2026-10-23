import { TIME, type TimeOfDay, type Weather } from '@features/walk/model/constants';
import { SURFACE, type Surface } from '@shared/world/surfaces';
import { PLACE_ACTION, type PlaceAction, type Region } from '@shared/world/world';
import { ambienceMix, type AmbienceMix } from './ambienceMix';

const MASTER_VOLUME = 0.22;
const LAYER_VOLUME = { water: 0.5, waves: 0.9, cicadas: 0.012, rain: 0.7 } as const;
const FADE_SECONDS = 1.2;
const CALL_INTERVAL_MS = 6_500;
const STEP_VOLUME = 0.55;

type StepSound = { filter: BiquadFilterType; frequency: number; q: number; seconds: number; knock?: number };
/** Each ground answers a footfall differently: crunch, click, hollow knock or soft hiss. */
const STEP_SOUNDS = {
  [SURFACE.dirt]: { filter: 'lowpass', frequency: 900, q: 0.7, seconds: 0.09 },
  [SURFACE.stone]: { filter: 'bandpass', frequency: 2_300, q: 1.4, seconds: 0.05 },
  [SURFACE.wood]: { filter: 'bandpass', frequency: 420, q: 2.5, seconds: 0.11, knock: 170 },
  [SURFACE.sand]: { filter: 'highpass', frequency: 2_800, q: 0.5, seconds: 0.12 },
} satisfies Record<Surface, StepSound>;

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
  { pitch, count, gap }: { pitch: number; count: number; gap: number },
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
    gain.gain.linearRampToValueAtTime(0.07, now + 0.025);
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
    if (mix.birds) call(context, master, { pitch: 1_800, count: 3, gap: 0.19 });
    if (mix.crickets > 0.5) call(context, master, { pitch: 4_200, count: 6, gap: 0.09 });
  }, CALL_INTERVAL_MS);
  void context.resume();

  const whiteNoise = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
  const whiteData = whiteNoise.getChannelData(0);
  for (let i = 0; i < whiteData.length; i++) whiteData[i] = Math.random() * 2 - 1;

  const step = (surface: Surface, loudness: number) => {
    if (context.state !== 'running') return;
    const sound: StepSound = STEP_SOUNDS[surface];
    const now = context.currentTime;
    const peak = STEP_VOLUME * Math.min(loudness, 2) * (0.8 + Math.random() * 0.4);
    const source = context.createBufferSource();
    source.buffer = whiteNoise;
    source.playbackRate.value = 0.85 + Math.random() * 0.3;
    const filter = context.createBiquadFilter();
    filter.type = sound.filter;
    filter.frequency.value = sound.frequency;
    filter.Q.value = sound.q;
    const gain = context.createGain();
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + sound.seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + sound.seconds);
    const parts: AudioNode[] = [source, filter, gain];
    if (sound.knock) {
      const knock = context.createOscillator();
      knock.frequency.setValueAtTime(sound.knock, now);
      knock.frequency.exponentialRampToValueAtTime(sound.knock * 0.7, now + sound.seconds);
      knock.connect(gain);
      knock.start(now);
      knock.stop(now + sound.seconds);
      parts.push(knock);
    }
    source.onended = () => parts.forEach((part) => part.disconnect());
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
