import * as THREE from 'three';
import { advanceMotion, angleDelta, createMotion } from './motion';

/** Authored 4-direction artwork with idle, six walk poses and an airborne pose. Identity never morphs when turning. */
export function createChild(atlas: THREE.Texture) {
  const group = new THREE.Group();
  const source = atlas.image as HTMLImageElement;
  const cellHeight = source.height / 4;
  const frames: THREE.CanvasTexture[] = [];
  // The artist sheet has small layout offsets. Extract each complete connected
  // silhouette, not a rigid grid slice that can cut off a hood or include a neighbour.
  const width = 320,
    height = 512;
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 8; column++) {
      const cell = document.createElement('canvas');
      cell.width = width;
      cell.height = height;
      const ctx = cell.getContext('2d', { willReadFrequently: true })!;
      const cropWidth = source.width * 0.1435;
      const center = source.width * (0.0718 + column * 0.1235);
      const renderedWidth = (cropWidth * height) / cellHeight;
      ctx.drawImage(
        source,
        center - cropWidth / 2,
        row * cellHeight,
        cropWidth,
        cellHeight,
        (width - renderedWidth) / 2,
        0,
        renderedWidth,
        height,
      );
      const pixels = ctx.getImageData(0, 0, width, height);
      const n = width * height;
      const foreground = new Uint8Array(n),
        seen = new Uint8Array(n);
      const queue = new Int32Array(n);
      for (let i = 0; i < n; i++) {
        const r = pixels.data[i * 4]!,
          g = pixels.data[i * 4 + 1]!,
          b = pixels.data[i * 4 + 2]!;
        const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 18 && Math.max(r, g, b) > 110;
        if (!neutral && pixels.data[i * 4 + 3]! > 80) foreground[i] = 1;
      }
      let biggest: number[] = [];
      const neighbours = (i: number) => [
        i % width ? i - 1 : -1,
        i % width < width - 1 ? i + 1 : -1,
        i - width,
        i + width,
      ];
      for (let seed = 0; seed < n; seed++) {
        if (!foreground[seed] || seen[seed]) continue;
        let read = 0,
          write = 1;
        queue[0] = seed;
        seen[seed] = 1;
        const component: number[] = [];
        while (read < write) {
          const i = queue[read++]!;
          component.push(i);
          for (const j of neighbours(i))
            if (j >= 0 && j < n && foreground[j] && !seen[j]) {
              seen[j] = 1;
              queue[write++] = j;
            }
        }
        if (component.length > biggest.length) biggest = component;
      }
      // Keep enclosed highlights intact; only the exterior matte is transparent.
      const body = new Uint8Array(n),
        exterior = new Uint8Array(n);
      for (const i of biggest) body[i] = 1;
      let read = 0,
        write = 0;
      const seedExterior = (i: number) => {
        if (!body[i] && !exterior[i]) {
          exterior[i] = 1;
          queue[write++] = i;
        }
      };
      for (let x = 0; x < width; x++) {
        seedExterior(x);
        seedExterior((height - 1) * width + x);
      }
      for (let y = 0; y < height; y++) {
        seedExterior(y * width);
        seedExterior(y * width + width - 1);
      }
      while (read < write) {
        const i = queue[read++]!;
        for (const j of neighbours(i)) if (j >= 0 && j < n) seedExterior(j);
      }
      for (let i = 0; i < n; i++) if (exterior[i]) pixels.data[i * 4 + 3] = 0;
      ctx.putImageData(pixels, 0, 0);
      let top = height,
        bottom = 0;
      for (const i of biggest) {
        top = Math.min(top, Math.floor(i / width));
        bottom = Math.max(bottom, Math.floor(i / width));
      }
      let left = width,
        right = 0;
      for (const i of biggest)
        if (Math.floor(i / width) < top + 150) {
          left = Math.min(left, i % width);
          right = Math.max(right, i % width);
        }
      const aligned = document.createElement('canvas');
      aligned.width = width;
      aligned.height = height;
      aligned.getContext('2d')!.drawImage(cell, width / 2 - (left + right) / 2, 499 - bottom);
      const texture = new THREE.CanvasTexture(aligned);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      frames.push(texture);
    }
  }
  const material = new THREE.SpriteMaterial({ map: frames[0]!, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 12 / 512);
  sprite.scale.set(6.5, 10.4, 1);
  group.add(sprite);
  const motion = createMotion();
  let facing = 0;
  let time = 0;
  let frame = -1;
  return {
    group,
    update(
      dt: number,
      travel: number,
      heading: number,
      walking: boolean,
      running: boolean,
      reducedMotion: boolean,
      jumpHeight = 0,
      jumpVelocity = 0,
      landing = 0,
    ) {
      time += dt;
      const m = advanceMotion(motion, dt, travel, heading, running, walking);
      // A small dead band prevents direction flicker along diagonals.
      if (Math.abs(angleDelta(facing, m.heading)) > Math.PI / 4 + 0.12)
        facing = Math.round(m.heading / (Math.PI / 2)) * (Math.PI / 2);
      const quadrant = ((Math.round(facing / (Math.PI / 2)) % 4) + 4) % 4;
      const column =
        jumpHeight > 0
          ? 7
          : !walking || reducedMotion
            ? 0
            : 1 + (Math.floor((m.phase / (Math.PI * 2)) * 6) % 6);
      const nextFrame = quadrant * 8 + column;
      if (frame !== nextFrame) {
        material.map = frames[nextFrame]!;
        frame = nextFrame;
      }
      // The drawings carry the gait. Only subtle whole-body secondary motion is added.
      material.rotation = reducedMotion ? 0 : -Math.sin(facing) * m.run * m.energy * 0.045;
      const squash = reducedMotion ? 0 : landing * 0.045;
      sprite.scale.set(6.5 * (1 + squash * 0.4), 10.4 * (1 - squash), 1);
      sprite.position.y = reducedMotion ? 0 : Math.sin(time * 2.2) * 0.015 * (1 - m.energy);
      void jumpVelocity;
    },
    dispose() {
      frames.forEach((texture) => texture.dispose());
      material.dispose();
    },
  };
}
