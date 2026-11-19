import * as THREE from 'three';
import { catchCelebration, catchHeart } from './catchCelebration';
import { CAST_SECONDS, FISHING_PHASE, type FishingFrame } from './fishing';
import { FISH, FISH_RARITY, FISH_SHAPE, isRareFish } from './fishTable';
import type { PierFishingParts } from './pierFishingParts';

export function poseFishing(
  {
    group,
    rods,
    line,
    lineGeometry,
    linePoints,
    bobber,
    ripple,
    ringMaterial,
    hearts,
    stars,
    fish,
    fishMaterial,
    reel,
  }: PierFishingParts,
  age: number,
  frame: FishingFrame | null,
  origin: THREE.Vector3,
  size: number,
  reducedMotion: boolean,
) {
  group.visible = frame !== null;
  if (!frame) return;
  const phase = frame.phase;
  const celebration = catchCelebration(age, reducedMotion);
  const species = FISH.find((item) => item.id === frame.caught?.id);
  const isLegendary = species?.rarity === FISH_RARITY.legendary;
  const isRare = species ? isRareFish(species.id) : false;
  group.position.copy(origin);
  group.scale.setScalar(size);
  const casting = phase === FISHING_PHASE.casting;
  const fighting = phase === FISHING_PHASE.fighting;
  const caught = phase === FISHING_PHASE.caught;
  const missed = phase === FISHING_PHASE.missed;
  const bite = phase === FISHING_PHASE.bite;
  const cast = Math.min(1, age / CAST_SECONDS);
  const hook = fighting ? Math.max(0, 1 - age / 0.4) : 0;
  const angle = casting ? 2.5 - Math.sin((cast * Math.PI) / 2) * 2.05 : 0.45 + hook * 0.9 + (caught ? 0.7 : 0);
  const grip = new THREE.Vector3(1.8, 4.5, 0.2);
  const bend = fighting
    ? (frame.tension / 100) * 3.5 + (frame.isSurging && !reducedMotion ? Math.sin(age * 22) * 0.35 : 0)
    : 0.3;
  const tip = new THREE.Vector3();
  let previous = grip.clone();
  for (let i = 0; i < rods.length; i++) {
    const t = (i + 1) / rods.length;
    const next = new THREE.Vector3(
      grip.x + Math.cos(angle) * 12 * t,
      grip.y + Math.sin(angle) * 12 * t - bend * t * t,
      0.2,
    );
    const rod = rods[i]!;
    rod.position.copy(previous).add(next).multiplyScalar(0.5);
    rod.scale.set(1 - t * 0.5, previous.distanceTo(next), 1 - t * 0.5);
    rod.rotation.z = Math.atan2(next.y - previous.y, next.x - previous.x) - Math.PI / 2;
    previous = next;
    tip.copy(next);
  }
  reel.position.copy(grip).add(new THREE.Vector3(0.4, -0.45, 0));
  const wobble = reducedMotion ? 0 : Math.sin(age * (bite ? 24 : 3)) * (bite ? 0.5 : 0.1);
  const reach = fighting ? 19 - frame.progress * 0.08 : 19;
  const water = new THREE.Vector3(reach, -2.2 + wobble - (bite ? 0.55 : 0), 0.2);
  if (casting) {
    water.lerpVectors(grip, water, cast);
    water.y += Math.sin(cast * Math.PI) * 7;
  }
  if (missed) water.lerp(tip.clone().add(new THREE.Vector3(0, -3, 0)), Math.min(1, age * 2));
  if (caught) water.set(celebration.fishX, celebration.fishY - celebration.childLift, 0.2);
  if (fighting && !reducedMotion) water.x += Math.sin(age * (frame.isSurging ? 12 : 6)) * (frame.isSurging ? 1.2 : 0.4);
  bobber.position.copy(water);
  bobber.visible = !caught && !missed;
  fish.visible = caught;
  fish.position.copy(water);
  const fishScale =
    species && frame.caught ? 1.2 + ((frame.caught.size - species.min) / (species.max - species.min)) * 0.5 : 1.2;
  let fishWidth = 0.8;
  let fishHeight = 1.7;
  if (species?.shape === FISH_SHAPE.round) {
    fishWidth = 1.25;
    fishHeight = 1.45;
  }
  if (species?.shape === FISH_SHAPE.flat) {
    fishWidth = 1.55;
    fishHeight = 1.2;
  }
  fish.scale.set(fishWidth * fishScale, fishHeight * fishScale, 1);
  fishMaterial.color.setHex(species?.color ?? 0xa3cfcb);
  fish.rotation.z = reducedMotion ? 0 : celebration.fishTurn + Math.sin(age * 12) * 0.12;
  let heartCount = 3;
  if (isRare) heartCount = 5;
  if (isLegendary) heartCount = 7;
  hearts.forEach((heart, index) => {
    const pose = catchHeart(age, index, reducedMotion);
    heart.visible = caught && index < heartCount && pose.isVisible;
    heart.position.set(pose.x, pose.y - celebration.childLift, 0.4);
    heart.scale.setScalar(pose.scale);
    heart.material.opacity = pose.opacity;
    heart.material.color.setHex(isLegendary ? 0xffc878 : 0xf197ad);
  });
  stars.forEach((star, index) => {
    const t = Math.max(0, age - 0.45);
    const angle = (index * Math.PI) / 3 + (reducedMotion ? 0 : t * 0.8);
    const radius = reducedMotion ? 2.7 : 1.7 + t * 1.4;
    star.visible = caught && isRare && age >= 0.45 && age < 2.4;
    star.position.set(water.x + Math.cos(angle) * radius, water.y + Math.sin(angle) * radius, 0.3);
    star.material.opacity = Math.max(0, Math.sin(Math.min(1, t / 1.95) * Math.PI));
    star.scale.setScalar(isLegendary ? 1.4 : 1);
  });
  ripple.visible = (!casting && !caught && !missed) || (caught && celebration.splash > 0);
  ripple.position.copy(water);
  if (caught) ripple.position.set(11, -2.2 - celebration.childLift, 0.2);
  const wave = reducedMotion ? 1 : 0.8 + (age % 1.4);
  ripple.scale.set(wave * (bite ? 1.8 : 1), wave * 0.35, 1);
  ringMaterial.opacity = reducedMotion ? 0.4 : Math.max(0, 0.65 - (age % 1.4) * 0.4);
  if (caught) {
    ripple.scale.set(1 + age * 6, 0.35 + age * 2, 1);
    ringMaterial.opacity = celebration.splash;
  }
  for (let i = 0; i < 25; i++) {
    const t = i / 24;
    linePoints[i * 3] = THREE.MathUtils.lerp(tip.x, water.x, t);
    linePoints[i * 3 + 1] = THREE.MathUtils.lerp(tip.y, water.y, t) - Math.sin(t * Math.PI) * (fighting ? 0.2 : 1.3);
    linePoints[i * 3 + 2] = 0.2;
  }
  lineGeometry.attributes.position!.needsUpdate = true;
  line.visible = !missed || age < 0.4;
}
