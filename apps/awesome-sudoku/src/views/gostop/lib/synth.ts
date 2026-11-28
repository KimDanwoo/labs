import {
  ATTACK_SECONDS,
  MASTER_GAIN,
  NOISE_SECONDS,
  SILENT_GAIN,
  SOUND_RECIPES,
  VOICE_TAIL_SECONDS,
  type SoundFilter,
  type SoundVoice,
} from '@views/gostop/config/sound';
import type { SoundName } from '@views/gostop/model/types/playback';

interface WebkitWindow {
  webkitAudioContext?: typeof AudioContext;
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

export function createAudioContext(): AudioContext | null {
  const Context = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Context) return null;
  try {
    return new Context();
  } catch {
    return null;
  }
}

function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  const cached = noiseBuffers.get(context);
  if (cached) return cached;
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * NOISE_SECONDS), context.sampleRate);
  const samples = buffer.getChannelData(0);
  samples.forEach((_, index) => {
    samples[index] = Math.random() * 2 - 1;
  });
  noiseBuffers.set(context, buffer);
  return buffer;
}

function sourceOf(context: BaseAudioContext, voice: SoundVoice, startAt: number): AudioScheduledSourceNode {
  if (voice.wave === 'noise') {
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer(context);
    return noise;
  }
  const oscillator = context.createOscillator();
  oscillator.type = voice.wave;
  oscillator.frequency.setValueAtTime(voice.frequency, startAt);
  if (voice.endFrequency)
    oscillator.frequency.exponentialRampToValueAtTime(voice.endFrequency, startAt + voice.duration);
  return oscillator;
}

function envelopeOf(context: BaseAudioContext, voice: SoundVoice, startAt: number): GainNode {
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(SILENT_GAIN, startAt);
  envelope.gain.exponentialRampToValueAtTime(voice.gain, startAt + ATTACK_SECONDS);
  envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, startAt + voice.duration);
  return envelope;
}

function filterOf(context: BaseAudioContext, spec: SoundFilter): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = spec.type;
  filter.frequency.value = spec.frequency;
  return filter;
}

function playVoice(context: BaseAudioContext, output: AudioNode, voice: SoundVoice): void {
  const startAt = context.currentTime + voice.startAt;
  const source = sourceOf(context, voice, startAt);
  const envelope = envelopeOf(context, voice, startAt);
  const filter = voice.filter ? filterOf(context, voice.filter) : null;
  source.connect(filter ?? envelope);
  filter?.connect(envelope);
  envelope.connect(output);
  source.start(startAt);
  source.stop(startAt + voice.duration + VOICE_TAIL_SECONDS);
}

export function playSound(context: AudioContext, name: SoundName): boolean {
  try {
    if (context.state === 'suspended') context.resume().catch(() => undefined);
    const master = context.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(context.destination);
    SOUND_RECIPES[name].forEach((voice) => playVoice(context, master, voice));
    return true;
  } catch {
    return false;
  }
}
