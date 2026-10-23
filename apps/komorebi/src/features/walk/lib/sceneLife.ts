import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { characterScale } from './perspective';

const CAT_URL = '/art/cat-sleeping.webp';
const FLYER_ORDER = 3.6;
const CAT_ORDER = 2.5;

const CREATURE = { butterfly: 'butterfly', dragonfly: 'dragonfly', gull: 'gull' } as const;
type Creature = (typeof CREATURE)[keyof typeof CREATURE];

/** Where each kind of small life wanders, in painting percent (x across, z down). */
type Haunt = { kind: Creature; x: number; z: number; spreadX: number; spreadZ: number };
const HAUNTS: Record<Region, Haunt[]> = {
  village: [
    { kind: CREATURE.butterfly, x: 18, z: 54, spreadX: 9, spreadZ: 6 },
    { kind: CREATURE.butterfly, x: 26, z: 60, spreadX: 7, spreadZ: 5 },
    { kind: CREATURE.dragonfly, x: 70, z: 36, spreadX: 9, spreadZ: 4 },
  ],
  river: [
    { kind: CREATURE.dragonfly, x: 55, z: 66, spreadX: 8, spreadZ: 9 },
    { kind: CREATURE.dragonfly, x: 62, z: 78, spreadX: 7, spreadZ: 6 },
    { kind: CREATURE.butterfly, x: 15, z: 82, spreadX: 6, spreadZ: 5 },
  ],
  coast: [
    { kind: CREATURE.gull, x: 72, z: 22, spreadX: 18, spreadZ: 4 },
    { kind: CREATURE.gull, x: 58, z: 30, spreadX: 14, spreadZ: 3 },
  ],
  forest: [
    { kind: CREATURE.butterfly, x: 31, z: 38, spreadX: 5, spreadZ: 4 },
    { kind: CREATURE.butterfly, x: 79, z: 38, spreadX: 5, spreadZ: 4 },
  ],
  school: [
    { kind: CREATURE.butterfly, x: 9, z: 34, spreadX: 6, spreadZ: 5 },
    { kind: CREATURE.dragonfly, x: 40, z: 50, spreadX: 14, spreadZ: 8 },
  ],
  shops: [{ kind: CREATURE.butterfly, x: 33, z: 44, spreadX: 4, spreadZ: 3 }],
};
const CAT_SPOT = { region: 'village' as Region, x: 14.5, z: 35.5 };

const BODY_SIZE = { butterfly: 3.4, dragonfly: 3.6, gull: 3.2 } satisfies Record<Creature, number>;
const FLAP_RATE = { butterfly: 13, dragonfly: 40, gull: 2.2 } satisfies Record<Creature, number>;
const DRIFT_RATE = { butterfly: 0.35, dragonfly: 0.22, gull: 0.08 } satisfies Record<Creature, number>;

function drawWings(kind: Creature, c: CanvasRenderingContext2D) {
  if (kind === CREATURE.gull) {
    c.lineCap = 'round';
    for (const [style, width] of [
      ['#55606a', 9],
      ['#fbfcfa', 5],
    ] as const) {
      c.strokeStyle = style;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(4, 30);
      c.quadraticCurveTo(18, 12, 32, 28);
      c.quadraticCurveTo(46, 12, 60, 30);
      c.stroke();
    }
    return;
  }
  if (kind === CREATURE.dragonfly) {
    c.fillStyle = '#eef9ffd0';
    c.strokeStyle = '#6f97a3';
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(18, 22, 14, 5, -0.2, 0, Math.PI * 2);
    c.ellipse(46, 22, 14, 5, 0.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#c4542f';
    c.fillRect(29, 12, 6, 42);
    return;
  }
  c.fillStyle = '#ffd94a';
  c.strokeStyle = '#a5681f';
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(20, 24, 13, 15, -0.4, 0, Math.PI * 2);
  c.ellipse(44, 24, 13, 15, 0.4, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#5d5140';
  c.fillRect(30, 14, 4, 24);
}

type Scene = { region: Region; elapsed: number; darkness: number; isStill: boolean; isRaining: boolean };

/**
 * Small life in each painting: butterflies over gardens, dragonflies over water, gulls over the sea and a
 * sleeping cat. Flyers rest at night, in rain and with reduced motion; they never wake the 60 fps budget.
 */
export function createSceneLife(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const wings = (kind: Creature) => canvasTexture(64, 64, (c) => drawWings(kind, c));
  const textures = {
    butterfly: wings(CREATURE.butterfly),
    dragonfly: wings(CREATURE.dragonfly),
    gull: wings(CREATURE.gull),
  } satisfies Record<Creature, THREE.Texture>;
  const flyers = (Object.keys(HAUNTS) as Region[]).flatMap((region) =>
    HAUNTS[region].map((haunt, i) => {
      const material = new THREE.SpriteMaterial({ map: textures[haunt.kind], transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = FLYER_ORDER;
      sprite.visible = false;
      scene.add(sprite);
      return { region, haunt, sprite, material, phase: i * 1.7 + haunt.x };
    }),
  );
  const catMaterial = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
  const cat = new THREE.Sprite(catMaterial);
  cat.renderOrder = CAT_ORDER;
  cat.visible = false;
  cat.position.set(CAT_SPOT.x * 1.2 - 60, 40 - CAT_SPOT.z * 0.8, 1);
  scene.add(cat);
  let catTexture: THREE.Texture | null = null;
  let catWidth = 0;
  let catAspect = 1;
  let isDisposed = false;
  // The cat is a nicety: if its picture fails to load the walk simply goes on without it.
  loader
    .loadAsync(CAT_URL)
    .then((texture) => {
      if (isDisposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      catTexture = texture;
      catMaterial.map = texture;
      catMaterial.needsUpdate = true;
      const { width, height } = texture.image as HTMLImageElement;
      catAspect = height / width;
      catWidth = 4.6 * characterScale(CAT_SPOT.z) * 2.2;
    })
    .catch(() => undefined);

  return {
    update({ region, elapsed, darkness, isStill, isRaining }: Scene) {
      const isFlying = !isStill && !isRaining && darkness < 0.5;
      for (const flyer of flyers) {
        const { haunt, sprite, material, phase } = flyer;
        sprite.visible = isFlying && flyer.region === region;
        if (!sprite.visible) continue;
        const t = elapsed * DRIFT_RATE[haunt.kind] + phase;
        const x = haunt.x + Math.sin(t) * haunt.spreadX + Math.sin(t * 2.3) * haunt.spreadX * 0.25;
        const z = haunt.z + Math.sin(t * 1.7 + 1) * haunt.spreadZ;
        // Gulls fly far above the painted ground, so its depth scale would shrink them to specks.
        const depthScale = haunt.kind === CREATURE.gull ? 1 : characterScale(z) * 2.4;
        const size = BODY_SIZE[haunt.kind] * depthScale;
        const flap = 0.35 + 0.65 * Math.abs(Math.sin(elapsed * FLAP_RATE[haunt.kind] + phase));
        sprite.position.set(x * 1.2 - 60, 40 - z * 0.8 + (haunt.kind === CREATURE.gull ? 0 : 3), 1);
        sprite.scale.set(size, size * (haunt.kind === CREATURE.gull ? flap : 1), 1);
        if (haunt.kind === CREATURE.butterfly) sprite.scale.x = size * flap;
        material.opacity = 1 - darkness;
      }
      cat.visible = catTexture !== null && region === CAT_SPOT.region;
      if (!cat.visible) return;
      const breath = isStill ? 0 : Math.sin(elapsed * 1.6) * 0.025;
      cat.scale.set(catWidth, catWidth * catAspect * (1 + breath), 1);
      catMaterial.color.setRGB(1 - darkness * 0.5, 1 - darkness * 0.42, 1 - darkness * 0.2);
    },
    dispose() {
      isDisposed = true;
      for (const { sprite, material } of flyers) {
        scene.remove(sprite);
        material.dispose();
      }
      Object.values(textures).forEach((texture) => texture.dispose());
      scene.remove(cat);
      catMaterial.dispose();
      catTexture?.dispose();
    },
  };
}
