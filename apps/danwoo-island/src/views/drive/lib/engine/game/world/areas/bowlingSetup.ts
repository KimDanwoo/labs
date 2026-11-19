import * as THREE from 'three/webgpu';

import { type AudioItem, moveSoundTo } from '../../audioItem';
import { InstancedGroup } from '../../instancedGroup';
import type { InteractivePoint } from '../../interactivePoint';
import { objectOf } from '../../objectColliders';
import { remapClamp } from '../../utilities/maths';
import { Area } from './area';
import { type Ball, type Pin, PIN_MASS, requireBody, worldPose } from './bowlingConfig';

export function registerBowlingSounds(area: Area, getBall: () => Ball): { strike: AudioItem; pin: AudioItem } {
  const { audio } = area.game;
  const sounds = {
    strike: audio.register({
      path: 'sounds/achievements/Money Reward 2.mp3',
      autoplay: false,
      loop: false,
      volume: 0.4,
      antiSpam: 1,
    }),
    pin: audio.register({
      path: 'sounds/hits/pins/ComedyCrash 6115_16_4.mp3',
      autoplay: false,
      volume: 0.5,
      antiSpam: 0.05,
      positions: new THREE.Vector3(),
      distanceFade: 35,
      onPlay: (item, force, position) => {
        moveSoundTo(item, position);
        const strength = remapClamp(typeof force === 'number' ? force : 0, [3, 10], [0, 1]);
        item.volume = strength * 0.5;
        item.rate = 1.2 - strength * 0.2;
      },
    }),
  };
  registerRollingSound(area, getBall);
  return sounds;
}

function registerRollingSound(area: Area, getBall: () => Ball): void {
  area.game.audio.register({
    path: 'sounds/rolling/06290 medium ball rolling lp.mp3',
    autoplay: true,
    loop: true,
    volume: 0.5,
    rate: 0.8,
    positions: new THREE.Vector3(),
    distanceFade: 25,
    onPlaying: (item) => {
      item.firstPosition().copy(getBall().position);
      item.volume = remapClamp(getBall().speed, [0, 5], [0, 0.6]);
    },
  });
}

export function createPins(area: Area, pinSound: AudioItem): { pins: Pin[]; group: InstancedGroup } {
  const pinPositions = area.requireReference('pinPositions');
  pinPositions.updateMatrixWorld(true);
  const references = InstancedGroup.getReferencesFromChildren(pinPositions.children.map(worldPose));
  const basePin = area.requireReference('pinPhysicalDynamic');
  basePin.castShadow = true;
  basePin.receiveShadow = true;
  basePin.position.set(0, 0, 0);
  basePin.rotation.set(0, 0, 0);
  area.game.materials.updateObject(basePin);
  const colliders = area.game.objects.getFromModel(basePin)[1]?.colliders ?? [];

  const pins = references.map((group, index): Pin => {
    const object = area.game.objects.add(
      { model: group, updateMaterials: false, parent: null },
      {
        type: 'dynamic',
        position: group.position,
        rotation: group.quaternion,
        friction: 0.5,
        linearDamping: 0.1,
        angularDamping: 0.5,
        sleeping: true,
        colliders,
        waterGravityMultiplier: -1,
        mass: PIN_MASS,
        contactThreshold: 5,
        onCollision: (force, position) => pinSound.play(force, position),
      },
    );
    return {
      index,
      group,
      object,
      body: requireBody(object),
      basePosition: group.position.clone(),
      baseRotation: group.quaternion.clone(),
      isDown: false,
      isSleeping: true,
    };
  });
  return { pins, group: new InstancedGroup(references, basePin) };
}

export function createBall(area: Area): Ball {
  const reference = area.requireReference('ball');
  const body = requireBody(objectOf(reference));
  return {
    body,
    basePosition: reference.position.clone(),
    position: new THREE.Vector3().copy(body.translation()),
    isSleeping: true,
    speed: 0,
  };
}

export function createRestartPoint(area: Area, onRestart: () => void): InteractivePoint {
  const { interactiveButtons } = area.game.inputs;
  return area.game.interactivePoints.create({
    position: area.requireReference('restartInteractivePoint').position,
    text: '다시 하기',
    align: 'right',
    state: 'hidden',
    onInteract: () => onRestart(),
    onReveal: () => interactiveButtons.addItems(['interact']),
    onConceal: () => interactiveButtons.removeItems(['interact']),
    onHide: () => interactiveButtons.removeItems(['interact']),
  });
}
