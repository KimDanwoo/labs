import { PLACE_ACTION, type PlaceAction, type Point } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';

const RING_POOL = 6;
const MOTE_POOL = 24;
const RENDER_ORDER = 3.5;

type Mote = {
  delay: number;
  life: number;
  from: THREE.Vector2;
  velocity: THREE.Vector2;
  wobble: number;
  size: number;
  color: THREE.ColorRepresentation;
};
type Ring = { delay: number; at: Point };
type Burst = { motes: Mote[]; rings: Ring[] };

const toScene = (point: Point) => new THREE.Vector2(point.x * 1.2 - 60, 40 - point.z * 0.8);

let seed = 7;
const random = () => {
  seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
  return seed / 4_294_967_296;
};

function spray(at: Point, count: number, mote: (i: number, origin: THREE.Vector2) => Mote): Mote[] {
  const origin = toScene(at);
  return Array.from({ length: count }, (_, i) => mote(i, origin));
}

/** What each place does when its little action plays: stone rings on water, drifting leaves, rising sparkles. */
const BURSTS = {
  [PLACE_ACTION.skip]: () => ({
    motes: [],
    rings: [
      { delay: 0, at: { x: 54, z: 62 } },
      { delay: 0.3, at: { x: 58, z: 70 } },
      { delay: 0.55, at: { x: 61, z: 79 } },
    ],
  }),
  [PLACE_ACTION.gust]: (at: Point) => ({
    rings: [],
    motes: spray({ x: at.x - 14, z: at.z }, 14, (i, origin) => ({
      delay: i * 0.05,
      life: 1.6,
      from: new THREE.Vector2(origin.x + random() * 4, origin.y + random() * 8 - 2),
      velocity: new THREE.Vector2(14 + random() * 6, 1 + random() * 2),
      wobble: 1.2,
      size: 1.8,
      color: '#9fcf62',
    })),
  }),
  [PLACE_ACTION.shell]: (at: Point) => sparkle(at, '#fff4d6'),
  [PLACE_ACTION.bell]: (at: Point) => ({
    rings: [],
    motes: spray({ x: at.x, z: at.z - 14 }, 12, (i, origin) => ({
      delay: i * 0.08,
      life: 2,
      from: new THREE.Vector2(origin.x + random() * 16 - 8, origin.y + random() * 4),
      velocity: new THREE.Vector2(random() * 2 - 1, -3 - random() * 2),
      wobble: 1.6,
      size: 1.6,
      color: '#f6c1cf',
    })),
  }),
  [PLACE_ACTION.schoolBell]: (at: Point) => sparkle(at, '#fff0a8'),
  [PLACE_ACTION.windChime]: (at: Point) => sparkle(at, '#dff3f5'),
} satisfies Record<PlaceAction, (at: Point) => Burst>;

function sparkle(at: Point, color: string): Burst {
  return {
    rings: [],
    motes: spray(at, 10, (i, origin) => ({
      delay: i * 0.06,
      life: 1.2,
      from: new THREE.Vector2(origin.x + random() * 6 - 3, origin.y + 2 + random() * 3),
      velocity: new THREE.Vector2(random() * 2 - 1, 3 + random() * 2),
      wobble: 0.6,
      size: 1.5,
      color,
    })),
  };
}

const RING_LIFE = 0.9;

/** Short-lived scenery reactions in pooled sprites; only one action plays at a time. */
export function createPlaceEffects(scene: THREE.Scene) {
  const ringTexture = canvasTexture(64, 64, (c) => {
    c.strokeStyle = '#f4ffff';
    c.lineWidth = 7;
    c.beginPath();
    c.ellipse(32, 32, 26, 26, 0, 0, Math.PI * 2);
    c.stroke();
  });
  const moteTexture = canvasTexture(32, 32, (c) => {
    const glow = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, '#ffffffff');
    glow.addColorStop(1, '#ffffff00');
    c.fillStyle = glow;
    c.fillRect(0, 0, 32, 32);
  });
  const makePool = (count: number, texture: THREE.Texture) =>
    Array.from({ length: count }, () => {
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = RENDER_ORDER;
      sprite.visible = false;
      scene.add(sprite);
      return { sprite, material };
    });
  const ringPool = makePool(RING_POOL, ringTexture);
  const motePool = makePool(MOTE_POOL, moteTexture);
  let burst: Burst | null = null;
  let age = 0;

  const hideAll = () => {
    [...ringPool, ...motePool].forEach(({ sprite }) => {
      sprite.visible = false;
    });
  };
  const duration = (b: Burst) =>
    Math.max(0, ...b.rings.map((ring) => ring.delay + RING_LIFE), ...b.motes.map((mote) => mote.delay + mote.life));

  return {
    /** Returns false while an earlier action is still playing. */
    play(kind: PlaceAction, at: Point) {
      if (burst) return false;
      burst = BURSTS[kind](at);
      age = 0;
      return true;
    },
    get isPlaying() {
      return burst !== null;
    },
    update(dt: number) {
      if (!burst) return;
      age += dt;
      burst.rings.forEach((ring, i) => {
        const slot = ringPool[i];
        if (!slot) return;
        const t = (age - ring.delay) / RING_LIFE;
        slot.sprite.visible = t >= 0 && t < 1;
        if (!slot.sprite.visible) return;
        const centre = toScene(ring.at);
        slot.sprite.position.set(centre.x, centre.y, 1);
        slot.sprite.scale.set(1.2 + t * 6, (1.2 + t * 6) * 0.4, 1);
        slot.material.opacity = 1 - t * t;
      });
      burst.motes.forEach((mote, i) => {
        const slot = motePool[i];
        if (!slot) return;
        const life = age - mote.delay;
        const t = life / mote.life;
        slot.sprite.visible = t >= 0 && t < 1;
        if (!slot.sprite.visible) return;
        slot.material.color.set(mote.color);
        slot.sprite.position.set(
          mote.from.x + mote.velocity.x * life + Math.sin(life * 6 + i) * mote.wobble,
          mote.from.y + mote.velocity.y * life,
          1,
        );
        slot.sprite.scale.setScalar(mote.size);
        slot.material.opacity = Math.sin(Math.PI * t);
      });
      if (age >= duration(burst)) {
        burst = null;
        hideAll();
      }
    },
    /** Region changes and resets drop whatever was playing. */
    clear() {
      burst = null;
      hideAll();
    },
    dispose() {
      [...ringPool, ...motePool].forEach(({ sprite, material }) => {
        scene.remove(sprite);
        material.dispose();
      });
      ringTexture.dispose();
      moteTexture.dispose();
    },
  };
}
