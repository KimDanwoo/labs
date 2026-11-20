import { TIME, type TimeOfDay, type Weather } from '@views/walk/config/walk';
import { createBeds } from '@views/walk/lib/ambienceBeds';
import { ambienceMix, type AmbienceMix } from '@views/walk/lib/ambienceMix';
import { brownNoise, call, createVoices } from '@views/walk/lib/audioSynth';
import { createFootsteps } from '@views/walk/lib/footsteps';
import { createCues } from '@views/walk/lib/placeCues';
import { type Region, REGION } from '@views/walk/model/world/world';

const MASTER_VOLUME = 0.22;
const FADE_SECONDS = 1.2;
const CALL_INTERVAL_MS = 6_500;

export function createAmbience() {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(context.destination);
  const noise = brownNoise(context, 4);
  const { water, waves, cicadas, rainfall, nodes, sources } = createBeds(context, master, noise);

  let mix: AmbienceMix = ambienceMix(REGION.village, TIME.day);
  const callTimer = window.setInterval(() => {
    if (context.state !== 'running') return;
    if (mix.birds > 0) call(context, master, { pitch: 1_800, count: 3, gap: 0.19, level: mix.birds });
    if (mix.crickets > 0) call(context, master, { pitch: 4_200, count: 6, gap: 0.09, level: mix.crickets });
  }, CALL_INTERVAL_MS);
  void context.resume();

  const step = createFootsteps(context, master);
  const { cue, fishingCue } = createCues(context, createVoices(context, master, noise));

  return {
    step,
    cue,
    fishingCue,
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
