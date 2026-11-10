import * as THREE from 'three';

const DROPS = 320;
const FALL_SPEED = 70;
const DRIFT = 0.18;

/** A shower of short slanted streaks that wraps around the camera view; one draw call for every drop. */
export function createRain(scene: THREE.Scene) {
  let seed = 31;
  const random = () => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };
  const drops = Array.from({ length: DROPS }, () => ({
    x: random() * 120 - 60,
    y: random() * 80 - 40,
    speed: 0.8 + random() * 0.4,
    depth: random(),
  }));
  const positions = new Float32Array(DROPS * 6);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const colors = new Float32Array(DROPS * 6);
  drops.forEach((drop, i) => {
    const light = 0.32 + drop.depth * 0.45;
    colors.set([light * 0.85, light * 0.93, light, light * 0.85, light * 0.93, light], i * 6);
  });
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthTest: false });
  const lines = new THREE.LineSegments(geometry, material);
  lines.renderOrder = 5.5;
  lines.frustumCulled = false;
  lines.visible = false;
  scene.add(lines);

  return {
    update(dt: number, level: number, camera: THREE.Vector3, isStill: boolean, darkness = 0) {
      lines.visible = level > 0.01 && !isStill;
      if (!lines.visible) return;
      material.opacity = level * (0.52 - darkness * 0.2);
      drops.forEach((drop, i) => {
        const speed = FALL_SPEED * drop.speed * (0.45 + drop.depth * 0.55);
        drop.y -= speed * dt;
        drop.x -= speed * DRIFT * dt;
        if (drop.y < -40) drop.y += 80;
        if (drop.x < -60) drop.x += 120;
        const x = camera.x + drop.x;
        const y = camera.y + drop.y;
        const streak = 0.55 + drop.depth * 1.35;
        positions.set([x, y, 4, x + streak * DRIFT, y + streak, 4], i * 6);
      });
      geometry.attributes.position!.needsUpdate = true;
    },
    dispose() {
      scene.remove(lines);
      geometry.dispose();
      material.dispose();
    },
  };
}
