import { SURFACE, type Surface } from '@shared/world/surfaces';
import type { Region } from '@shared/world/world';
import { ambienceMix, type AmbienceMix } from './ambienceMix';

const MASTER_VOLUME = 0.22;
const LAYER_VOLUME = { water: 0.5, waves: 0.9, cicadas: 0.012 } as const;
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

  let mix: AmbienceMix = ambienceMix('village', false);
  const callTimer = window.setInterval(() => {
    if (context.state !== 'running') return;
    if (mix.birds) call(context, master, { pitch: 1_800, count: 3, gap: 0.19 });
    if (mix.crickets) call(context, master, { pitch: 4_200, count: 6, gap: 0.09 });
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

  return {
    step,
    setScene(region: Region, isEvening: boolean) {
      mix = ambienceMix(region, isEvening);
      const now = context.currentTime;
      for (const [{ gain, volume }, level] of [
        [water, mix.water],
        [waves, mix.waves],
        [cicadas, mix.cicadas],
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
