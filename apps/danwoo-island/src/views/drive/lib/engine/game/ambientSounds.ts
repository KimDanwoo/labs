import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { BIRD_TWEETS, CRICKETS_VOLUME, FIRE_FADE_DISTANCE, randomNearbyPosition } from './audioConfig';
import { AudioItem } from './audioItem';
import { getGame } from './gameContext';
import { remapClamp } from './utilities/maths';

import type { Audio } from './audio';

export function registerAmbients(audio: Audio): void {
  const { dayCycles } = getGame();
  registerBirds(audio);
  registerOwl(audio);

  const rooster = randomlyPlaced(audio, 'rooster', 'sounds/rooster/rooster-crowing.mp3', 0.1, (item) => {
    item.volume = 0.1 + Math.random() * 0.2;
  });
  dayCycles.events.on('night', (isNight) => {
    if (!isNight) rooster.play();
  });

  const wolf = randomlyPlaced(
    audio,
    'wolf',
    'sounds/wolf/TimberWolvesGroupHowlingSomeWhimpering_S2h0E_04.mp3',
    0.1,
    (item) => {
      item.volume = 0.1 + Math.random() * 0.2;
    },
  );
  dayCycles.events.on('deepNight', (isDeepNight) => {
    if (isDeepNight) wolf.play();
  });

  const crickets = audio.register({
    group: 'crickets',
    path: 'sounds/crickets/Crickets.mp3',
    autoplay: true,
    loop: true,
    volume: dayCycles.isInInterval('night') ? CRICKETS_VOLUME : 0,
  });
  dayCycles.events.on('night', (isNight) => {
    gsap.to(crickets, { volume: isNight ? CRICKETS_VOLUME : 0, duration: 15, overwrite: true });
  });

  registerWeather(audio);
  registerFires(audio);
}

function randomlyPlaced(
  audio: Audio,
  group: string,
  path: string,
  volume: number,
  vary: (item: AudioItem) => void,
): AudioItem {
  return audio.register({
    group,
    path,
    autoplay: false,
    loop: false,
    volume,
    positions: new THREE.Vector3(),
    onPlay: (item) => {
      vary(item);
      item.firstPosition().copy(randomNearbyPosition());
    },
  });
}

export function registerBirds(audio: Audio): void {
  const { dayCycles } = getGame();
  const tweets = BIRD_TWEETS.map((path) =>
    randomlyPlaced(audio, 'birdTweet', path, 0.3, (item) => {
      item.volume = 0.2 + Math.random() * 0.3;
      item.rate = 1 + Math.random() * 0.7;
    }),
  );
  const tryPlay = (): void => {
    if (!dayCycles.isInInterval('night') && Math.random() < 0.5) {
      tweets[Math.floor(Math.random() * tweets.length)]?.play();
    }
    gsap.delayedCall(0.5 + Math.random() * 5, tryPlay);
  };
  tryPlay();
}

export function registerOwl(audio: Audio): void {
  const { dayCycles } = getGame();
  const owl = randomlyPlaced(audio, 'owl', 'sounds/owl/OwlHootingReverberantSeveral_Rik8a_03.mp3', 0.3, (item) => {
    item.volume = 0.2 + Math.random() * 0.25;
    item.rate = 1 + Math.random() * 0.3;
  });
  const delay = (): number => 30 + Math.random() * 60;
  const tryPlay = (): void => {
    if (dayCycles.isInInterval('night') && Math.random() < 0.5) owl.play();
    gsap.delayedCall(delay(), tryPlay);
  };
  gsap.delayedCall(delay(), tryPlay);
}

export function registerWeather(audio: Audio): void {
  const game = getGame();
  audio.register({
    group: 'rain',
    path: 'sounds/rain/soundjay_rain-on-leaves_main-01.mp3',
    autoplay: true,
    loop: true,
    volume: 0,
    onPlaying: (item) => {
      item.volume = remapClamp(game.weather.rain.value, [0.1, 0.6], [0, 1]);
    },
  });
  audio.register({
    group: 'wind',
    path: 'sounds/wind/13582-wind-in-forest-loop.mp3',
    autoplay: true,
    loop: true,
    volume: 0,
    onPlaying: (item) => {
      item.volume = remapClamp(game.weather.wind.value, [0.3, 1], [0, 1]) ** 3 * 0.7;
    },
  });
  audio.register({
    group: 'waves',
    path: 'sounds/waves/lake-waves.mp3',
    autoplay: true,
    loop: true,
    volume: 0,
    onPlaying: (item) => {
      const halfSize = game.terrain.size / 2;
      const distanceToSide = Math.min(
        halfSize - Math.abs(game.player.position.x),
        halfSize - Math.abs(game.player.position.z),
      );
      item.volume = remapClamp(distanceToSide, [0, 40], [1, 0.1]) ** 2 * 0.7;
    },
  });
}

export function registerFires(audio: Audio): void {
  const areas = getGame().world.areas;
  const ovens = [
    areas?.cookie?.references.items.get('spawner')?.[0]?.position,
    areas?.projects?.references.items.get('oven')?.[0]?.position,
  ].filter((position): position is THREE.Vector3 => position instanceof THREE.Vector3);
  if (ovens.length > 0) {
    audio.register({
      group: 'ovenFire',
      path: 'sounds/fire/Mountain Audio - Fire Burning in a Wood Stove 1.mp3',
      autoplay: true,
      loop: true,
      volume: 0.8,
      positions: ovens,
      distanceFade: FIRE_FADE_DISTANCE,
    });
  }

  const campfire = areas?.lab?.references.items.get('fire')?.[0]?.position;
  if (campfire instanceof THREE.Vector3) {
    audio.register({
      group: 'campfire',
      path: 'sounds/fire/Fire Burning.mp3',
      autoplay: true,
      loop: true,
      volume: 1,
      positions: [campfire],
      distanceFade: FIRE_FADE_DISTANCE,
    });
  }
}
