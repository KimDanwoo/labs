import * as THREE from 'three/webgpu';

import { type AudioItem, moveSoundTo } from '@views/drive/lib/engine/game/audioItem';
import type { InteractivePoint } from '@views/drive/lib/engine/game/interactivePoint';
import { remapClamp } from '@views/drive/lib/engine/game/utilities/maths';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import { BALL, type Ball, requireBody } from '@views/drive/lib/engine/game/world/areas/beachGoalConfig';
import { PITCH } from '@views/drive/lib/engine/game/world/areas/beachGoalRules';
import { findChildMatching } from '@views/drive/lib/engine/game/world/structureKit';

const BALL_REFERENCE = 'ballPhysicalDynamic';
const BALL_COLLIDER = /^ball/i;
const GOAL_SOUND = { volume: 0.4, antiSpam: 1 } as const;
const BUMP_SOUND = { antiSpam: 0.12, distanceFade: 30, rate: [1.25, 0.95] } as const;

export function registerBeachGoalSounds(area: Area): { goal: AudioItem; bump: AudioItem } {
  const { audio } = area.game;
  return {
    goal: audio.register({
      path: 'sounds/achievements/Money Reward 2.mp3',
      autoplay: false,
      loop: false,
      volume: GOAL_SOUND.volume,
      antiSpam: GOAL_SOUND.antiSpam,
    }),
    bump: audio.register({
      path: 'sounds/hits/defaults/Impact Soft 02.mp3',
      autoplay: false,
      volume: BALL.bumpVolume,
      antiSpam: BUMP_SOUND.antiSpam,
      positions: new THREE.Vector3(),
      distanceFade: BUMP_SOUND.distanceFade,
      onPlay: (item, force, position) => {
        moveSoundTo(item, position);
        const strength = remapClamp(typeof force === 'number' ? force : 0, BALL.bumpForce, [0, 1]);
        item.volume = strength * BALL.bumpVolume;
        item.rate = remapClamp(strength, [0, 1], BUMP_SOUND.rate);
      },
    }),
  };
}

function toWorld(area: Area, local: THREE.Vector3): THREE.Vector3 {
  return local.applyQuaternion(area.model.quaternion).add(area.model.position);
}

export function createBall(area: Area, bumpSound: AudioItem): Ball {
  const model = area.requireReference(BALL_REFERENCE);
  const radius = findChildMatching(model, BALL_COLLIDER).scale.y / 2;
  const kickoff = toWorld(area, new THREE.Vector3(PITCH.halfwayX, PITCH.groundY + radius, PITCH.centerZ));
  model.position.copy(kickoff);
  model.quaternion.premultiply(area.model.quaternion);
  const object = area.game.objects.add(
    { model },
    {
      type: 'dynamic',
      position: kickoff,
      rotation: model.quaternion,
      mass: BALL.mass,
      restitution: BALL.restitution,
      friction: BALL.friction,
      frictionRule: BALL.frictionRule,
      linearDamping: BALL.linearDamping,
      angularDamping: BALL.angularDamping,
      sleeping: true,
      colliders: [{ shape: 'ball', parameters: [radius] }],
      contactThreshold: BALL.contactThreshold,
      onCollision: (force, position) => bumpSound.play(force, position),
    },
  );
  return { object, body: requireBody(object), radius, kickoff: kickoff.clone(), isSleeping: true };
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
