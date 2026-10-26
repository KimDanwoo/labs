import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { lightSprite } from './nightLights';
import { sceneX, sceneY } from './perspective';

// Sparse leaves start beside actual trees, rather than raining over the entire screen.
const SOURCES: Record<Region, readonly [number, number][]> = {
  home: [],
  village: [
    [9, 25],
    [76, 53],
    [18, 67],
    [90, 24],
  ],
  river: [
    [28, 24],
    [70, 28],
    [15, 59],
    [81, 61],
  ],
  coast: [
    [8, 20],
    [18, 67],
  ],
  forest: [
    [17, 24],
    [73, 17],
    [25, 45],
    [78, 49],
    [12, 67],
    [84, 70],
  ],
  school: [
    [24, 28],
    [71, 31],
    [9, 71],
  ],
  shops: [
    [12, 30],
    [65, 28],
    [84, 67],
  ],
};

export function createDriftingLeaves(scene: THREE.Scene) {
  const texture = canvasTexture(48, 32, (c) => {
    c.fillStyle = '#9ba854';
    c.beginPath();
    c.moveTo(5, 24);
    c.bezierCurveTo(10, 4, 28, 3, 43, 6);
    c.bezierCurveTo(39, 26, 18, 30, 5, 24);
    c.fill();
    c.strokeStyle = '#cbd18a';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(6, 24);
    c.quadraticCurveTo(24, 15, 40, 8);
    c.stroke();
  });
  const leaves = Array.from({ length: 12 }, (_, i) => {
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 3.7;
    sprite.visible = false;
    scene.add(sprite);
    return { sprite, material, phase: i * 2.399, period: 15 + i * 1.37 };
  });
  let clock = 0;
  return {
    update(region: Region, dt: number, darkness: number, rain: number, still: boolean) {
      if (!still) clock += dt;
      const sources = SOURCES[region];
      leaves.forEach(({ sprite, material, phase, period }, i) => {
        sprite.visible = !still && i < sources.length * 2;
        if (!sprite.visible) return;
        const source = sources[Math.floor(i / 2)]!;
        const cycle = (clock / period + phase) % 1;
        // A long quiet interval separates each fall, and the endpoints fade away.
        const progress = cycle / 0.68;
        sprite.visible = progress < 1;
        if (!sprite.visible) return;
        const drift = progress * (7 + rain * 5) + Math.sin(progress * 9 + phase) * 1.3;
        const x = source[0] + drift;
        const z = source[1] + progress * 16;
        sprite.position.set(sceneX(x), sceneY(z), 1);
        const size = 0.3 + z * 0.003;
        sprite.scale.set(size * (0.25 + 0.75 * Math.abs(Math.cos(clock * 2.4 + phase))), size * 0.65, 1);
        material.rotation = Math.sin(clock * 1.6 + phase) * 0.7 + progress * 2;
        material.opacity = Math.min(progress * 9, (1 - progress) * 7, 0.8) * (1 - darkness * 0.7);
        lightSprite(material.color, darkness, 0);
      });
    },
    dispose() {
      leaves.forEach(({ sprite, material }) => {
        scene.remove(sprite);
        material.dispose();
      });
      texture.dispose();
    },
  };
}
