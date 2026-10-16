import { SphereGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function makeFlowerGeometry() {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 5;
    const petal = new SphereGeometry(1, 6, 3);
    petal.scale(0.055, 0.018, 0.105);
    petal.translate(0, 0, 0.075);
    petal.rotateY(angle);
    return petal;
  });
  const center = new SphereGeometry(0.033, 6, 3);
  center.translate(0, 0.02, 0);
  const parts = [...petals, center];
  const geometry = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return geometry;
}
