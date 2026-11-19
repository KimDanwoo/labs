export function brownNoise(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < data.length; i++) {
    previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
    data[i] = previous;
  }
  return buffer;
}

export function call(
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

export function createVoices(context: AudioContext, master: AudioNode, noise: AudioBuffer) {
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
  return { tone, whoosh };
}

export type Voices = ReturnType<typeof createVoices>;
