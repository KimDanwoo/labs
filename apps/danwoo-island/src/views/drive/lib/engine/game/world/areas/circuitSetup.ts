import gsap from 'gsap';
import { color, Fn, uniform, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from '../../audioItem';
import type { Action } from '../../inputs/inputTypes';
import type { InteractivePoint } from '../../interactivePoint';
import { objectOf, type WorldObject } from '../../objectColliders';
import { layCircuitCourse, trackSideAt } from '../circuitCourse';
import { reshapeCircuitDecoration } from '../circuitDecoration';
import { rebuildPodium } from '../circuitPodiumProps';
import { rebuildCircuitObjects } from '../circuitProps';
import { rebuildTentCanopies } from '../circuitStands';
import { replaceAirDancers } from '../islandReskins';
import { Area } from './area';
import {
  BANNER,
  DOOR,
  OBSTACLE,
  PODIUM_CONFETTI_DELAY,
  PODIUM_FOCUS_OFFSET,
  requireMesh,
  RESTART_ACTION,
  TIMER_PLAYER_OFFSET,
  type Checkpoint,
  type CircuitSounds,
  type CircuitState,
  type Door,
  type Obstacle,
  type Podium,
} from './circuitConfig';

export function registerCircuitSounds(area: Area): CircuitSounds {
  const { audio } = area.game;
  const register = (path: string, onPlay?: (item: AudioItem, reachedCount: unknown) => void): AudioItem =>
    audio.register({ path, autoplay: false, loop: false, volume: 0.5, antiSpam: 0.1, onPlay });
  return {
    countdown: register('sounds/circuit/countdown/Game Start Countdown 31-1.mp3'),
    go: register('sounds/circuit/countdown/Game Start Countdown 31-2.mp3'),
    checkpoint: register('sounds/circuit/checkpoint/Win Score 1.mp3', (item, reachedCount) => {
      if (typeof reachedCount === 'number') item.rate = 1 + (reachedCount - 1) * 0.06;
    }),
    finish: register('sounds/circuit/finish/Big Win Fanfare 2.mp3'),
    applause: register('sounds/circuit/applause/huge win.mp3'),
  };
}

export function createDoor(area: Area, hex: string): Door {
  const scale = uniform(2);
  const doorColor = uniform(color(hex));
  const intensity = uniform(DOOR.intensity);
  const { ticker } = area.game;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide });
  material.outputNode = Fn(() => {
    const baseUv = uv();
    const stripeUv = baseUv.toVar();
    stripeUv.y.subAssign(ticker.elapsedScaledUniform.mul(DOOR.speed));
    stripeUv.mulAssign(vec2(scale, 1).mul(2));
    const stripes = stripeUv.x.add(stripeUv.y).fract().step(0.5);
    return vec4(doorColor.mul(intensity), baseUv.y.oneMinus().mul(stripes));
  })();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.size, DOOR.size), material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.visible = false;
  area.game.scene.add(mesh);
  return { mesh, scale };
}

export function placeDoor({ mesh, scale }: Door, checkpoint: Checkpoint): void {
  scale.value = checkpoint.scale;
  mesh.visible = true;
  mesh.position.copy(checkpoint.position);
  mesh.rotation.y = checkpoint.rotation;
  mesh.scale.x = checkpoint.scale;
}

export function createRails(area: Area): WorldObject {
  const mesh = requireMesh(area.requireReference('rails'));
  if (!Array.isArray(mesh.material)) {
    mesh.material = mesh.material.clone();
    mesh.material.side = THREE.DoubleSide;
  }
  const rails = objectOf(mesh);
  area.game.objects.disable(rails);
  return rails;
}

export function createStartPoint(area: Area, onRestart: () => void): InteractivePoint {
  const { interactiveButtons } = area.game.inputs;
  return area.game.interactivePoints.create({
    position: area.requireReference('interactivePoint').position,
    text: '출발!',
    align: 'right',
    state: 'concealed',
    onInteract: () => {
      area.game.audio.groups.get('click')?.play(true);
      onRestart();
    },
    onReveal: () => interactiveButtons.addItems(['interact']),
    onConceal: () => interactiveButtons.removeItems(['interact']),
    onHide: () => interactiveButtons.removeItems(['interact']),
  });
}

export function createPodium(area: Area): Podium {
  const respawn = area.game.respawns.getByName('circuit');
  const viewFocusPosition = respawn.position.clone().add(PODIUM_FOCUS_OFFSET);
  viewFocusPosition.y = 0;
  const podium: Podium = {
    object: objectOf(area.requireReference('podium')),
    confettiPositions: [
      area.requireReference('podiumConfettiA').position.clone(),
      area.requireReference('podiumConfettiB').position.clone(),
    ],
    viewFocusPosition,
    confettiIndex: 0,
  };
  area.game.objects.disable(podium.object);
  return podium;
}

function popPodiumConfetti(game: Area['game'], podium: Podium): void {
  const { world, view } = game;
  if (!world.confetti) return;
  const position = podium.confettiPositions[podium.confettiIndex % 2];
  if (position) world.confetti.pop(position);
  podium.confettiIndex += 1;
  if (view.focusPoint.isTracking) return;
  gsap.delayedCall(PODIUM_CONFETTI_DELAY.min + Math.random() * PODIUM_CONFETTI_DELAY.spread, () =>
    popPodiumConfetti(game, podium),
  );
}

export function showPodium(game: Area['game'], podium: Podium): void {
  const { objects, view } = game;
  objects.enable(podium.object);
  view.focusPoint.isTracking = false;
  view.focusPoint.position.copy(podium.viewFocusPosition);
  popPodiumConfetti(game, podium);
}

export function swayObstacles(obstacles: readonly Obstacle[], elapsedTime: number): void {
  for (const { object, basePosition, side, phase } of obstacles) {
    const sway = Math.sin(elapsedTime * OBSTACLE.frequency + phase) * OBSTACLE.amplitude;
    const position = basePosition.clone().addScaledVector(side, sway);
    object.physical?.body.setNextKinematicTranslation(position);
    object.needsUpdate = true;
  }
}

export function waveBanners(banners: readonly THREE.Object3D[], localTime: number): void {
  for (const [index, banner] of banners.entries()) {
    const time = localTime * BANNER.speed + index * BANNER.phase;
    const sway = Math.sin(time) + Math.sin(time * 2.34) * 0.5 + Math.sin(time * 3.45) * 0.25;
    banner.rotation.y = BANNER.base + sway * BANNER.amplitude;
  }
}

export function timerTarget(
  state: CircuitState,
  homePosition: THREE.Vector3,
  playerPosition: THREE.Vector3,
): THREE.Vector3 {
  if (state === 'pending') return homePosition;
  return new THREE.Vector3(playerPosition.x + TIMER_PLAYER_OFFSET.x, 0, playerPosition.z + TIMER_PLAYER_OFFSET.z);
}

export function createObstacles(references: THREE.Object3D[]): Obstacle[] {
  return references.map((reference, index) => {
    const object = objectOf(reference);
    const basePosition = (object.visual?.object3D ?? reference).position.clone();
    return { object, basePosition, side: trackSideAt(basePosition), phase: -index };
  });
}

export function listenRestartAction(game: Area['game'], onRestart: () => void): void {
  const { inputs } = game;
  inputs.addActions([RESTART_ACTION]);
  inputs.events.on(RESTART_ACTION.name, (action: Action) => {
    if (action.active) onRestart();
  });
}

export function rebuildCircuitModel(model: THREE.Object3D): void {
  rebuildCircuitObjects(model);
  rebuildPodium(model);
  reshapeCircuitDecoration(model);
  rebuildTentCanopies(model);
  replaceAirDancers(model);
  layCircuitCourse(model);
}
