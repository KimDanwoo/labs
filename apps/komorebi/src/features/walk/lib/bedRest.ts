import { sleepingPortrait, type CharacterTemplate } from '@shared/world/appearance';
import type { Point } from '@shared/world/world';
import * as THREE from 'three';
import { lightSprite } from './nightLights';
import { preparePaintingTexture } from './regionPlates';

export const SLEEP_TIMING = { wake: 2800, finish: 4500 } as const;
const smooth = (value: number) => THREE.MathUtils.smoothstep(value, 0, 1);

/** The pillow keeps the sleeping head behind the original painted quilt, in the same scene and lighting. */
export function createBedRest(scene: THREE.Scene, painting: THREE.ShaderMaterial) {
  const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false });
  const head = new THREE.Sprite(material);
  head.renderOrder = 4.02;
  head.visible = false;
  material.rotation = 0.2;
  scene.add(head);
  const shape = new THREE.Shape(
    [
      [1102, 690],
      [1135, 683],
      [1167, 682],
      [1202, 686],
      [1244, 746],
      [1130, 757],
    ].map(([x, y]) => new THREE.Vector2(x! / 12.8 - 60, 40 - y! / 12.8)),
  );
  const geometry = new THREE.ShapeGeometry(shape);
  const vertices = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < vertices.count; i++) uv.setXY(i, (vertices.getX(i) + 60) / 120, (vertices.getY(i) + 40) / 80);
  const quilt = new THREE.Mesh(geometry, painting);
  quilt.renderOrder = 4.06;
  quilt.visible = false;
  scene.add(quilt);
  let disposed = false;
  const portraits = new Map<CharacterTemplate, THREE.Texture>();
  const pending = new Map<CharacterTemplate, Promise<boolean>>();
  let clock = 0;
  let startedAt = 0;
  let origin: Point | null = null;
  return {
    prepare(character: CharacterTemplate) {
      const cached = portraits.get(character);
      if (cached) {
        material.map = cached;
        material.needsUpdate = true;
        return Promise.resolve(true);
      }
      const request = pending.get(character);
      if (request) return request;
      const loading = new THREE.TextureLoader()
        .loadAsync(sleepingPortrait(character))
        .then((texture) => {
          if (disposed) {
            texture.dispose();
            return false;
          }
          material.map = preparePaintingTexture(texture);
          material.map.generateMipmaps = true;
          material.map.minFilter = THREE.LinearMipmapLinearFilter;
          portraits.set(character, material.map);
          material.needsUpdate = true;
          return true;
        })
        .catch(() => false)
        .finally(() => {
          pending.delete(character);
        });
      pending.set(character, loading);
      return loading;
    },
    start(position: Point) {
      origin = { ...position };
      clock = 0;
      startedAt = performance.now();
    },
    update(darkness: number, glow: number, isStill: boolean) {
      if (!origin) return null;
      clock = (performance.now() - startedAt) / 1000;
      const enter = smooth(clock / 0.75);
      const bedside = origin.x > 76 ? { x: 82, z: 69 } : { x: 69.5, z: 68.5 };
      const leave = smooth((clock - 3.85) / 0.65);
      const tucked = smooth((clock - 0.55) / 0.35) * (1 - smooth((clock - 3.6) / 0.3));
      const breath = isStill ? 0 : Math.sin(clock * 2.2) * 0.012;
      head.visible = tucked > 0.001;
      quilt.visible = head.visible;
      material.opacity = tucked;
      lightSprite(material.color, darkness, glow);
      head.position.set(1139 / 12.8 - 60, 40 - 667 / 12.8 + breath, 2);
      head.scale.set(5.8, 4.8 + breath, 1);
      const amount = isStill ? 1 : enter * (1 - leave);
      return {
        point: {
          x: THREE.MathUtils.lerp(origin.x, bedside.x, amount),
          z: THREE.MathUtils.lerp(origin.z, bedside.z, amount),
        },
        opacity: 1 - tucked,
        heading: Math.atan2(bedside.x - origin.x, bedside.z - origin.z) + (clock > 3.6 ? Math.PI : 0),
        walking: (clock < 0.75 || clock > 3.85) && !isStill,
        tucked,
      };
    },
    finish() {
      origin = null;
      head.visible = false;
      quilt.visible = false;
    },
    dispose() {
      disposed = true;
      scene.remove(head, quilt);
      portraits.forEach((texture) => texture.dispose());
      material.dispose();
      geometry.dispose();
    },
  };
}
