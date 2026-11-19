import * as THREE from 'three/webgpu';

import { type AudioItem, moveSoundTo } from '../audioItem';
import { getGame } from '../gameContext';
import { remapClamp } from '../utilities/maths';
import { DISTANT_THUNDER, NEAR_THUNDER } from './lightningsConfig';

export function registerNearThunder(): AudioItem[] {
  const { audio, player } = getGame();
  return NEAR_THUNDER.map((path) =>
    audio.register({
      path,
      autoplay: false,
      loop: false,
      volume: 1,
      antiSpam: 0.2,
      positions: new THREE.Vector3(),
      onPlay: (item, coordinates) => {
        if (!(coordinates instanceof THREE.Vector3)) return;
        const distance = Math.hypot(coordinates.x - player.position2.x, coordinates.z - player.position2.y);
        moveSoundTo(item, coordinates);
        item.rate = 1.3 + Math.random() * 0.1 + remapClamp(distance, [0, 20], [0, -0.3]);
      },
    }),
  );
}

export function registerDistantThunder(): AudioItem[] {
  const { audio } = getGame();
  return DISTANT_THUNDER.map((path) =>
    audio.register({
      path,
      autoplay: false,
      loop: false,
      volume: 0.4,
      antiSpam: 7,
      onPlay: (item) => {
        item.volume = 1 + Math.random() * 0.3;
        item.rate = 1 + Math.random() * 0.3;
      },
    }),
  );
}
