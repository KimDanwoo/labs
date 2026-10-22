/** Quiet wind and distant birds, synthesized locally; no remote audio assets. */
export function createAmbience() {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.22;
  master.connect(context.destination);
  const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
  const data = noise.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < data.length; i++) {
    previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
    data[i] = previous;
  }
  const wind = context.createBufferSource();
  wind.buffer = noise;
  wind.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 650;
  wind.connect(filter);
  filter.connect(master);
  wind.start();
  const bird = () => {
    if (context.state !== 'running') return;
    for (let i = 0; i < 3; i++) {
      const now = context.currentTime + i * 0.19;
      const tone = context.createOscillator(),
        gain = context.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(1800 + Math.random() * 500, now);
      tone.frequency.exponentialRampToValueAtTime(3100, now + 0.07);
      tone.frequency.exponentialRampToValueAtTime(1700, now + 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      tone.connect(gain);
      gain.connect(master);
      tone.start(now);
      tone.stop(now + 0.18);
      tone.onended = () => {
        tone.disconnect();
        gain.disconnect();
      };
    }
  };
  const timer = window.setInterval(bird, 6500);
  bird();
  void context.resume();
  return {
    dispose() {
      clearInterval(timer);
      wind.stop();
      wind.disconnect();
      filter.disconnect();
      master.disconnect();
      void context.close();
    },
  };
}
