import { Color, Float32BufferAttribute, SphereGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function makeFlowerGeometry() {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 5;
    const petal = new SphereGeometry(1, 8, 4);
    petal.scale(0.06, 0.015, 0.11);
    petal.rotateX(-0.22);
    petal.translate(0, 0, 0.075);
    petal.rotateY(angle);
    return petal;
  });
  const center = new SphereGeometry(0.033, 6, 3);
  center.translate(0, 0.02, 0);
  const parts = [...petals, center];
  for (const part of parts) {
    const position = part.getAttribute('position');
    const colors: number[] = [];
    for (let i = 0; i < position.count; i += 1) {
      const color =
        part === center
          ? new Color('#d8a548')
          : new Color('#e5caa7').lerp(
              new Color('#ffffff'),
              Math.min(1, Math.hypot(position.getX(i), position.getZ(i)) / 0.13),
            );
      colors.push(color.r, color.g, color.b);
    }
    part.setAttribute('color', new Float32BufferAttribute(colors, 3));
  }
  const geometry = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return geometry;
}
