import gsap from 'gsap';
import { objectOf } from '../../objectColliders';
import { Area } from './area';
import {
  type Bumpers,
  type Screen,
  BUMPER_DURATION,
  isMesh,
  LANE_AXIS,
  pinIndicatorMaterial,
  requireBody,
  screenTexture,
  strikeLabelMaterial,
} from './bowlingConfig';

export function createScreen(area: Area): Screen {
  const group = area.requireReference('screen');
  const { pinStates, dataTexture } = screenTexture();
  const discs = area.requireReference('discs');
  const crosses = area.requireReference('crosses');
  if (isMesh(discs)) discs.material = pinIndicatorMaterial(dataTexture, { hex: '#ffffff', strength: 2, threshold: 0 });
  if (isMesh(crosses)) {
    crosses.material = pinIndicatorMaterial(dataTexture, { hex: '#ff2b11', strength: 6, threshold: 0.5 });
  }

  const labelStrike = area.requireReference('labelStrike');
  if (isMesh(labelStrike)) labelStrike.material = strikeLabelMaterial(labelStrike);
  labelStrike.visible = false;

  return {
    group,
    object: objectOf(group),
    home: group.position.clone(),
    lane: LANE_AXIS.clone().applyQuaternion(area.model.quaternion),
    labelStrike,
    pinStates,
    dataTexture,
    travel: 0,
  };
}

export function createBumpers(area: Area): void {
  const mesh = area.requireReference('bumpers');
  const object = objectOf(mesh);
  const body = requireBody(object);
  for (const index of [0, 1]) {
    body.collider(index).setRestitution(1);
    body.collider(index).setFriction(0);
  }
  const bumpers: Bumpers = { mesh, body, object, height: Math.abs(mesh.position.y), progress: 0, isActive: false };

  const { interactiveButtons } = area.game.inputs;
  area.game.interactivePoints.create({
    position: area.requireReference('bumpersInteractivePoint').position,
    text: '범퍼',
    align: 'left',
    state: 'concealed',
    onInteract: () => toggleBumpers(area, bumpers),
    onReveal: () => interactiveButtons.addItems(['interact']),
    onConceal: () => interactiveButtons.removeItems(['interact']),
    onHide: () => interactiveButtons.removeItems(['interact']),
  });
}

function toggleBumpers(area: Area, bumpers: Bumpers): void {
  bumpers.isActive = !bumpers.isActive;
  gsap.to(bumpers, {
    progress: bumpers.isActive ? 1 : 0,
    duration: BUMPER_DURATION,
    overwrite: true,
    onUpdate: () => {
      bumpers.body.setNextKinematicTranslation({
        x: bumpers.mesh.position.x,
        y: -(1 - bumpers.progress) * bumpers.height,
        z: bumpers.mesh.position.z,
      });
      bumpers.object.needsUpdate = true;
    },
  });
  area.game.player.sounds.suspensions.play();
}
