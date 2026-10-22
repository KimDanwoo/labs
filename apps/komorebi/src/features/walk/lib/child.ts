import * as THREE from 'three';
import { childFacing, extractChildFrames } from './atlas';
import { advanceMotion, createMotion } from './motion';

/** Authored 4-direction artwork with idle, six walk poses and an airborne pose. Identity never morphs when turning. */
export function createChild(atlas: THREE.Texture) {
  const group = new THREE.Group();
  const source = atlas.image as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(source, 0, 0);
  const extracted = extractChildFrames(
    context.getImageData(0, 0, source.width, source.height).data,
    source.width,
    source.height,
  );
  // Source cells are about 150 x 250: larger canvases only upscale the same pixels.
  const width = 160,
    height = 256,
    baseline = 249.5;
  // One shared scale preserves proportions and avoids frame-by-frame size pulsing.
  const maxRadius = Math.max(...extracted.map((f) => Math.max(f.anchorX, f.width - f.anchorX)));
  const scale = Math.min(
    height / (source.height / 4),
    (width / 2 - 6) / maxRadius,
    (baseline - 6) / Math.max(...extracted.map((f) => f.height)),
  );
  const frames = extracted.map((f, index) => {
    const cell = document.createElement('canvas');
    cell.width = f.width;
    cell.height = f.height;
    cell.getContext('2d')!.putImageData(new ImageData(f.pixels, f.width, f.height), 0, 0);
    const aligned = document.createElement('canvas');
    aligned.width = width;
    aligned.height = height;
    const ctx = aligned.getContext('2d')!;
    const x = width / 2 - f.anchorX * scale;
    const y = baseline - f.height * scale;
    // The sheet's front/back hoods overlap their neighbours. Keep the complete
    // idle hood for that direction and animate the independently drawn body.
    // Side profiles do not overlap and retain their original arm/face motion.
    const row = Math.floor(index / 8);
    if ((row === 0 || row === 2) && index % 8 !== 0) {
      const idle = extracted[row * 8]!;
      const head = document.createElement('canvas');
      head.width = idle.width;
      head.height = idle.height;
      head.getContext('2d')!.putImageData(new ImageData(idle.pixels, idle.width, idle.height), 0, 0);
      const cut = Math.round(f.height * 0.6);
      const headCut = Math.round(idle.height * 0.6);
      ctx.drawImage(
        cell,
        0,
        cut,
        f.width,
        f.height - cut,
        x,
        y + cut * scale,
        f.width * scale,
        (f.height - cut) * scale,
      );
      ctx.drawImage(
        head,
        0,
        0,
        idle.width,
        headCut,
        width / 2 - idle.anchorX * scale,
        y,
        idle.width * scale,
        cut * scale,
      );
    } else {
      ctx.drawImage(cell, x, y, f.width * scale, f.height * scale);
    }
    const texture = new THREE.CanvasTexture(aligned);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  });
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
      // Discrete artwork must follow the requested direction immediately. Smoothing
      // a 180-degree turn displays unrelated side frames while walking backwards.
      facing = childFacing(facing, heading);
      const column =
        jumpHeight > 0 ? 7 : !walking || reducedMotion ? 0 : 1 + (Math.floor((m.phase / (Math.PI * 2)) * 6) % 6);
      const nextFrame = facing * 8 + column;
      if (frame !== nextFrame) {
        material.map = frames[nextFrame]!;
        frame = nextFrame;
      }
      // The drawings carry the gait. Only subtle whole-body secondary motion is added.
      material.rotation = reducedMotion ? 0 : -Math.sin((facing * Math.PI) / 2) * m.run * m.energy * 0.045;
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
