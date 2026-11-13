import type { KeptFish } from './companions';
import { FISH, FISH_SHAPE } from './fishing';

export const AQUARIUM_ART = '/art/aquarium-painted-v2.webp';
export function aquariumFishArt(id: string) {
  const fish = FISH.find((item) => item.id === id)!;
  if (fish.shape === FISH_SHAPE.flat) return { src: '/art/aquarium-flounder-v2.webp', ratio: 320 / 167 };
  if (['goby', 'greenling', 'rockfish', 'black-rockfish', 'grouper'].includes(id))
    return { src: '/art/aquarium-grouper-v2.webp', ratio: 320 / 156 };
  if (fish.shape === FISH_SHAPE.round) return { src: '/art/aquarium-bream-v2.webp', ratio: 320 / 188 };
  return { src: '/art/aquarium-mackerel-v2.webp', ratio: 320 / 122 };
}
export function aquariumPose(fish: KeptFish, elapsed: number, feedAge: number, reducedMotion: boolean) {
  let hash = 0;
  for (const char of fish.uid) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
  const phase = ((hash % 997) / 997) * Math.PI * 2;
  const time = phase + (reducedMotion ? 0 : elapsed * (0.22 + (hash % 7) * 0.025));
  const attraction = reducedMotion ? 0 : Math.max(0, Math.min(1, feedAge / 0.6, (3 - feedAge) / 0.6));
  const species = FISH.find((item) => item.id === fish.id)!;
  return {
    x: 0.48 + Math.sin(time) * (0.27 - attraction * 0.18),
    y: (0.34 + Math.sin(time * 0.7 + phase) * 0.075) * (1 - attraction) + (0.25 + (hash % 4) * 0.013) * attraction,
    width: 0.085 + Math.min(1, fish.size / species.max) * 0.045,
    facing: Math.tanh(Math.cos(time) * 5),
    tilt: reducedMotion ? 0 : Math.sin(time * 2) * 0.035,
    phase,
  };
}
