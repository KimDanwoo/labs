const LAYER_VOLUME = { water: 0.5, waves: 0.65, cicadas: 0.012, rain: 0.7 } as const;

export function createBeds(context: AudioContext, master: AudioNode, noise: AudioBuffer) {
  const surfNoise = context.createBuffer(1, context.sampleRate * 12, context.sampleRate);
  const surfSamples = surfNoise.getChannelData(0);
  for (let i = 0; i < surfSamples.length; i++) surfSamples[i] = (Math.random() * 2 - 1) * 0.35;
  const nodes: AudioNode[] = [master];
  const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];

  const layer = (volume: number) => {
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    nodes.push(gain);
    return { gain, volume };
  };
  const filteredNoise = (type: BiquadFilterType, frequency: number, output: AudioNode, buffer = noise) => {
    const source = context.createBufferSource();
    source.buffer = buffer;
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

  const wind = context.createGain();
  wind.gain.value = 0.35;
  wind.connect(master);
  const windLowCut = context.createBiquadFilter();
  windLowCut.type = 'highpass';
  windLowCut.frequency.value = 180;
  windLowCut.Q.value = 0.5;
  windLowCut.connect(wind);
  nodes.push(wind, windLowCut);
  filteredNoise('lowpass', 650, windLowCut);
  const water = layer(LAYER_VOLUME.water);
  filteredNoise('bandpass', 1_400, water.gain);
  const waves = layer(LAYER_VOLUME.waves);
  const swell = context.createGain();
  swell.gain.value = 0.55;
  swell.connect(waves.gain);
  nodes.push(swell);
  const surfSoftness = context.createBiquadFilter();
  surfSoftness.type = 'lowpass';
  surfSoftness.frequency.value = 2600;
  surfSoftness.Q.value = 0.5;
  surfSoftness.connect(swell);
  nodes.push(surfSoftness);
  filteredNoise('highpass', 240, surfSoftness, surfNoise);
  const swellDepth = context.createGain();
  swellDepth.gain.value = 0.22;
  swellDepth.connect(swell.gain);
  nodes.push(swellDepth);
  oscillator('sine', 1 / 7.2, swellDepth);
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
  return { water, waves, cicadas, rainfall, nodes, sources };
}
