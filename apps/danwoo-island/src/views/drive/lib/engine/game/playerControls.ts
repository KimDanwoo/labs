import { getGame } from '@views/drive/lib/engine/game/gameContext';
import type { Player } from '@views/drive/lib/engine/game/player';
import {
  LANDING_SOUND_WHEELS,
  NIPPLE_ACCELERATION_POWER,
  NIPPLE_TRACKING_DELAY_FRAMES,
  SPEED_LINES_SPEED,
} from '@views/drive/lib/engine/game/playerConfig';

export function readNipple(): { accelerating: number; steering: number } | null {
  const { inputs, view, ticker } = getGame();
  const { nipple } = inputs;
  if (!nipple.active || nipple.progress <= 0) return null;

  if (!view.focusPoint.isTracking) {
    ticker.wait(NIPPLE_TRACKING_DELAY_FRAMES, () => {
      if (nipple.active) view.focusPoint.isTracking = true;
    });
  }
  let accelerating = nipple.progress ** NIPPLE_ACCELERATION_POWER;

  const halfReverseArc = (Math.PI * 2 - nipple.forwardAmplitude) / 2;
  const normalizedAngle = Math.abs(nipple.smallestAngle) / halfReverseArc;
  let steering = -Math.min(normalizedAngle, 1) * Math.sign(nipple.smallestAngle);
  if (!nipple.forward) {
    accelerating *= -1;
    steering *= -1;
  }
  return { accelerating, steering };
}

export function syncAfterPhysics(player: Player): void {
  const { physicalVehicle: vehicle, view, tracks, inputs } = getGame();
  player.position.copy(vehicle.position);
  player.position2.set(player.position.x, player.position.z);
  view.focusPoint.trackedPosition.copy(player.position);

  const isSpeeding = Boolean(player.boosting && player.accelerating) && vehicle.speed > SPEED_LINES_SPEED;
  view.speedLines.strength = isSpeeding ? 1 : 0;
  view.speedLines.worldTarget.copy(player.position);
  tracks.focusPoint.set(player.position.x, player.position.z);

  player.rotationY = Math.atan2(vehicle.forward.z, vehicle.forward.x);
  inputs.nipple.setCoordinates(player.position, player.rotationY);

  const { justTouchedCount } = vehicle.wheels;
  if (justTouchedCount > LANDING_SOUND_WHEELS) {
    player.sounds.spring1.play(justTouchedCount);
    player.sounds.spring2.play(justTouchedCount);
  }
}
