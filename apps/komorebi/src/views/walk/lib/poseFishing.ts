import * as THREE from 'three';
import { catchCelebration, catchHeart } from './catchCelebration';
import { CAST_SECONDS, FISHING_PHASE, type FishingFrame } from './fishing';
import { FISH, FISH_RARITY, FISH_SHAPE, isRareFish } from './fishTable';
import type { PierFishingParts } from './pierFishingParts';

type Celebration = ReturnType<typeof catchCelebration>;
type Species = (typeof FISH)[number];

interface Pose {
  parts: PierFishingParts;
  frame: FishingFrame;
  age: number;
  reducedMotion: boolean;
  celebration: Celebration;
  species: Species | undefined;
  isLegendary: boolean;
  isRare: boolean;
  casting: boolean;
  fighting: boolean;
  caught: boolean;
  missed: boolean;
  bite: boolean;
}

function createPose(parts: PierFishingParts, frame: FishingFrame, age: number, reducedMotion: boolean): Pose {
  const { phase } = frame;
  const species = FISH.find((item) => item.id === frame.caught?.id);
  return {
    parts,
    frame,
    age,
    reducedMotion,
    celebration: catchCelebration(age, reducedMotion),
    species,
    isLegendary: species?.rarity === FISH_RARITY.legendary,
    isRare: species ? isRareFish(species.id) : false,
    casting: phase === FISHING_PHASE.casting,
    fighting: phase === FISHING_PHASE.fighting,
    caught: phase === FISHING_PHASE.caught,
    missed: phase === FISHING_PHASE.missed,
    bite: phase === FISHING_PHASE.bite,
  };
}

function castProgress(age: number) {
  return Math.min(1, age / CAST_SECONDS);
}

function rodAngle({ age, casting, fighting, caught }: Pose) {
  const hook = fighting ? Math.max(0, 1 - age / 0.4) : 0;
  if (casting) return 2.5 - Math.sin((castProgress(age) * Math.PI) / 2) * 2.05;
  return 0.45 + hook * 0.9 + (caught ? 0.7 : 0);
}

function rodBend({ fighting, frame, reducedMotion, age }: Pose) {
  if (!fighting) return 0.3;
  const surge = frame.isSurging && !reducedMotion ? Math.sin(age * 22) * 0.35 : 0;
  return (frame.tension / 100) * 3.5 + surge;
}

function poseRod(pose: Pose, grip: THREE.Vector3) {
  const { rods, reel } = pose.parts;
  const angle = rodAngle(pose);
  const bend = rodBend(pose);
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
  return tip;
}

function surgeSway({ frame, age, fighting, reducedMotion }: Pose) {
  if (!fighting || reducedMotion) return 0;
  return Math.sin(age * (frame.isSurging ? 12 : 6)) * (frame.isSurging ? 1.2 : 0.4);
}

function waterPoint(pose: Pose, grip: THREE.Vector3, tip: THREE.Vector3) {
  const { age, bite, casting, missed, caught, fighting, frame, reducedMotion, celebration } = pose;
  const wobble = reducedMotion ? 0 : Math.sin(age * (bite ? 24 : 3)) * (bite ? 0.5 : 0.1);
  const reach = fighting ? 19 - frame.progress * 0.08 : 19;
  const water = new THREE.Vector3(reach, -2.2 + wobble - (bite ? 0.55 : 0), 0.2);
  if (casting) {
    water.lerpVectors(grip, water, castProgress(age));
    water.y += Math.sin(castProgress(age) * Math.PI) * 7;
  }
  if (missed) water.lerp(tip.clone().add(new THREE.Vector3(0, -3, 0)), Math.min(1, age * 2));
  if (caught) water.set(celebration.fishX, celebration.fishY - celebration.childLift, 0.2);
  water.x += surgeSway(pose);
  return water;
}

function fishProportions(shape: Species['shape'] | undefined) {
  if (shape === FISH_SHAPE.round) return { width: 1.25, height: 1.45 };
  if (shape === FISH_SHAPE.flat) return { width: 1.55, height: 1.2 };
  return { width: 0.8, height: 1.7 };
}

function fishSizeScale({ species, frame }: Pose) {
  if (!species || !frame.caught) return 1.2;
  return 1.2 + ((frame.caught.size - species.min) / (species.max - species.min)) * 0.5;
}

function poseFish(pose: Pose, water: THREE.Vector3) {
  const { fish, fishMaterial } = pose.parts;
  const { caught, species, reducedMotion, celebration, age } = pose;
  fish.visible = caught;
  fish.position.copy(water);
  const scale = fishSizeScale(pose);
  const { width, height } = fishProportions(species?.shape);
  fish.scale.set(width * scale, height * scale, 1);
  fishMaterial.color.setHex(species?.color ?? 0xa3cfcb);
  fish.rotation.z = reducedMotion ? 0 : celebration.fishTurn + Math.sin(age * 12) * 0.12;
}

function heartTotal({ isRare, isLegendary }: Pose) {
  if (isLegendary) return 7;
  return isRare ? 5 : 3;
}

function poseHearts(pose: Pose) {
  const { age, reducedMotion, caught, celebration, isLegendary } = pose;
  const count = heartTotal(pose);
  pose.parts.hearts.forEach((heart, index) => {
    const heartPose = catchHeart(age, index, reducedMotion);
    heart.visible = caught && index < count && heartPose.isVisible;
    heart.position.set(heartPose.x, heartPose.y - celebration.childLift, 0.4);
    heart.scale.setScalar(heartPose.scale);
    heart.material.opacity = heartPose.opacity;
    heart.material.color.setHex(isLegendary ? 0xffc878 : 0xf197ad);
  });
}

function poseStars(pose: Pose, water: THREE.Vector3) {
  const { age, reducedMotion, caught, isRare, isLegendary } = pose;
  pose.parts.stars.forEach((star, index) => {
    const t = Math.max(0, age - 0.45);
    const angle = (index * Math.PI) / 3 + (reducedMotion ? 0 : t * 0.8);
    const radius = reducedMotion ? 2.7 : 1.7 + t * 1.4;
    star.visible = caught && isRare && age >= 0.45 && age < 2.4;
    star.position.set(water.x + Math.cos(angle) * radius, water.y + Math.sin(angle) * radius, 0.3);
    star.material.opacity = Math.max(0, Math.sin(Math.min(1, t / 1.95) * Math.PI));
    star.scale.setScalar(isLegendary ? 1.4 : 1);
  });
}

function poseRipple(pose: Pose, water: THREE.Vector3) {
  const { ripple, ringMaterial } = pose.parts;
  const { casting, caught, missed, bite, age, reducedMotion, celebration } = pose;
  ripple.visible = (!casting && !caught && !missed) || (caught && celebration.splash > 0);
  ripple.position.copy(water);
  if (caught) ripple.position.set(11, -2.2 - celebration.childLift, 0.2);
  const wave = reducedMotion ? 1 : 0.8 + (age % 1.4);
  ripple.scale.set(wave * (bite ? 1.8 : 1), wave * 0.35, 1);
  ringMaterial.opacity = reducedMotion ? 0.4 : Math.max(0, 0.65 - (age % 1.4) * 0.4);
  if (!caught) return;
  ripple.scale.set(1 + age * 6, 0.35 + age * 2, 1);
  ringMaterial.opacity = celebration.splash;
}

function poseLine(pose: Pose, tip: THREE.Vector3, water: THREE.Vector3) {
  const { line, lineGeometry, linePoints } = pose.parts;
  const sag = pose.fighting ? 0.2 : 1.3;
  for (let i = 0; i < 25; i++) {
    const t = i / 24;
    linePoints[i * 3] = THREE.MathUtils.lerp(tip.x, water.x, t);
    linePoints[i * 3 + 1] = THREE.MathUtils.lerp(tip.y, water.y, t) - Math.sin(t * Math.PI) * sag;
    linePoints[i * 3 + 2] = 0.2;
  }
  lineGeometry.attributes.position!.needsUpdate = true;
  line.visible = !pose.missed || pose.age < 0.4;
}

export function poseFishing(
  parts: PierFishingParts,
  age: number,
  frame: FishingFrame | null,
  origin: THREE.Vector3,
  size: number,
  reducedMotion: boolean,
) {
  const { group, bobber } = parts;
  group.visible = frame !== null;
  if (!frame) return;
  const pose = createPose(parts, frame, age, reducedMotion);
  group.position.copy(origin);
  group.scale.setScalar(size);
  const grip = new THREE.Vector3(1.8, 4.5, 0.2);
  const tip = poseRod(pose, grip);
  const water = waterPoint(pose, grip, tip);
  bobber.position.copy(water);
  bobber.visible = !pose.caught && !pose.missed;
  poseFish(pose, water);
  poseHearts(pose);
  poseStars(pose, water);
  poseRipple(pose, water);
  poseLine(pose, tip, water);
}
