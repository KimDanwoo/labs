import * as THREE from 'three/webgpu';
import type { Audio } from './audio';
import { HIT_FADE_DISTANCE, HIT_GROUPS, HIT_SOUNDS, HIT_VOLUME, hitHandler } from './audioConfig';
import { DEFAULT_ANTI_SPAM } from './audioItem';

export function registerOneOffs(audio: Audio): void {
  audio.register({
    group: 'discChange',
    path: 'sounds/jukebox/DVDPlayerChangeDisc_BW.49824.mp3',
    autoplay: false,
    loop: false,
    volume: 0.3,
  });
  audio.register({ group: 'slide', path: 'sounds/mecanism/slide.mp3', autoplay: false, volume: 0.18 });
  audio.register({
    group: 'click',
    path: 'sounds/mecanism/click.mp3',
    autoplay: false,
    volume: 0.25,
    onPlay: (item, isOpen = true) => {
      item.rate = isOpen ? 1 : 0.6;
    },
  });
  audio.register({ group: 'assemble', path: 'sounds/mecanism/assemble.mp3', autoplay: false, volume: 0.3 });

  for (const group of HIT_GROUPS) {
    const volumeOf = HIT_VOLUME[group];
    for (const [path, baseVolume] of HIT_SOUNDS[group]) {
      audio.register({
        group,
        path,
        autoplay: false,
        volume: baseVolume,
        antiSpam: DEFAULT_ANTI_SPAM,
        positions: new THREE.Vector3(),
        distanceFade: HIT_FADE_DISTANCE,
        onPlay: hitHandler(baseVolume, volumeOf),
      });
    }
  }
}
