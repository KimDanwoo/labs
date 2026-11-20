import { getGame } from '@views/drive/lib/engine/game/gameContext';
import {
  easeRate,
  easeToward,
  numberOrZero,
  WHEEL_COUNT,
  WHEELS_ON_FLOOR_ELEVATION,
  type PlayerSounds,
} from '@views/drive/lib/engine/game/playerConfig';
import { clamp, remapClamp } from '@views/drive/lib/engine/game/utilities/maths';

import type { Player } from '@views/drive/lib/engine/game/player';

export function registerPlayerSounds(): PlayerSounds {
  const { audio, inputs } = getGame();
  return {
    suspensions: audio.register({
      path: 'sounds/vehicle/suspensions/Robotic_Lifeforms_2_-_Air_Source_-_Piston_Studio_Chair_07.mp3',
      autoplay: false,
      loop: false,
      volume: 0.4,
      antiSpam: 0.1,
      onPlay: (item, count) => {
        item.volume = 0.3 + numberOrZero(count) * 0.08;
        item.rate = 0.9 + Math.random() * 0.2;
      },
    }),
    honk: audio.register({
      path: 'sounds/vehicle/honk/Car Horn Long 4.mp3',
      autoplay: true,
      loop: true,
      volume: 0.4,
      antiSpam: 0.1,
      onPlaying: (item) => {
        item.volume = inputs.actions.get('honk')?.active ? 0.5 : 0;
      },
    }),
    spring1: audio.register({
      path: 'sounds/vehicle/springs/HandleSqueak_BW.60329.mp3',
      autoplay: false,
      loop: false,
      volume: 0.4,
      antiSpam: 1,
      onPlay: (item, count) => {
        item.volume = 0.05 + numberOrZero(count) * 0.02;
        item.rate = 1 + Math.random() * 0.1;
      },
    }),
    spring2: audio.register({
      path: 'sounds/vehicle/springs/SpringMetalMovements_1u54Y_01.mp3',
      autoplay: false,
      loop: false,
      volume: 0.4,
      antiSpam: 0.2,
      onPlay: (item, count) => {
        item.volume = 0.05 + numberOrZero(count) * 0.1;
        item.rate = 0.9 + Math.random() * 0.4;
      },
    }),
  };
}

export function registerDrivingSounds(player: Player): void {
  const { audio, physicalVehicle: vehicle, ticker } = getGame();
  audio.register({
    group: 'wheelsOnFloor',
    path: 'sounds/vehicle/floor/wheels-on-pebbles-road.mp3',
    autoplay: true,
    loop: true,
    volume: 0,
    onPlaying: (item) => {
      const inAirEffect = remapClamp(Math.abs(vehicle.position.y - WHEELS_ON_FLOOR_ELEVATION), [0, 2], [1, 0]);
      const speedEffect = Math.min(1, vehicle.xzSpeed * 0.1);
      item.volume = inAirEffect * speedEffect * 0.25;
    },
  });
  audio.register({
    group: 'wheelsOnFloor',
    path: 'sounds/vehicle/floor/Source Stone Loop Small Rubbing Pebbles On Concrete 02.mp3',
    autoplay: true,
    loop: true,
    volume: 0,
    onPlaying: (item) => {
      const directionRatio = (1 - Math.abs(vehicle.forwardRatio)) * 0.6;
      const brakeEffect = clamp(
        (Math.max(directionRatio, player.braking) * vehicle.xzSpeed * 0.15 * vehicle.wheels.inContactCount) /
          WHEEL_COUNT,
        0,
        1,
      );
      const delta = brakeEffect * 0.4 - item.volume;
      item.volume += delta * ticker.deltaScaled * (delta > 0 ? 20 : 5);
      item.rate = 0.8;
    },
  });
  audio.register({
    path: 'sounds/vehicle/engine/muscle car engine loop idle.mp3',
    autoplay: true,
    loop: true,
    volume: 0,
    onPlaying: (item) => {
      const accelerating = Math.abs(player.accelerating) * 0.5;
      const boosting = player.boosting + 1;
      easeToward(item, Math.max(0.05, accelerating * boosting * 0.8), { rising: 10, falling: 2.5 });
      easeRate(item, remapClamp(accelerating * boosting, [0, 1], [0.6, 1.1]));
    },
  });
  audio.register({
    path: 'sounds/vehicle/spin/41051 Glass stone turning loop 09-full.mp3',
    autoplay: true,
    loop: true,
    volume: 0,
    onPlaying: (item) => {
      const speedEffect = clamp(vehicle.xzSpeed * 0.1, 0, 1);
      easeToward(item, speedEffect * 0.3, { rising: 10, falling: 2.5 });
      easeRate(item, remapClamp(speedEffect, [0, 1], [1, 2]));
    },
  });
  audio.register({
    path: 'sounds/vehicle/energy/Energy_-_force_field_8_loop.mp3',
    autoplay: true,
    loop: true,
    volume: 0,
    onPlaying: (item) => {
      const accelerating = 0.5 + Math.abs(player.accelerating) * 0.5;
      easeToward(item, accelerating * player.boosting * 0.3, { rising: 10, falling: 1 });
      easeRate(item, 0.95 + Math.abs(player.accelerating) * 2);
    },
  });
}
