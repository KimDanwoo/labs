import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

// 바깥 비행깃·안쪽 비행깃·덮깃을 겹친다. 모든 깃털을 같은 점에 모으면 밑동이 겹쳐 깜빡인다.
export function makeWingGeometry(span: number, feathers: number): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const rings = 8;
  const sides = 6;
  const count = Math.ceil(feathers * 0.6);
  for (let layer = 0; layer < 3; layer += 1) {
    for (let feather = 0; feather < count; feather += 1) {
      const fan = feather / (count - 1);
      const root = new Vector3(0.9 + (1 - fan) * 1.2, 0, -0.1 - fan * 0.35);
      const tip = new Vector3(span * (1 - fan * 0.43), -0.08, -0.25 - fan * 2.1);
      if (layer === 1) {
        root.set(0.2 + (1 - fan) * 1.2, 0.055, -0.12);
        tip.set(span * 0.57 * (1 - fan * 0.82), -0.13, -2.15 + fan * 0.65);
      }
      if (layer === 2) {
        root.set(0.12 + (1 - fan) * 0.8, 0.14, 0);
        tip.set(span * 0.64 * (1 - fan * 0.85), 0.1, -0.85 + fan * 0.15);
      }
      const across = new Vector3(-(tip.z - root.z), 0, tip.x - root.x).normalize();
      const offset = positions.length / 3;
      for (let ring = 0; ring <= rings; ring += 1) {
        const t = ring / rings;
        const width = (layer === 2 ? 0.15 : 0.2) * Math.pow(Math.sin(Math.PI * t), 0.65) + 0.001;
        const center = root.clone().lerp(tip, t);
        center.y += Math.sin(t * Math.PI) * 0.18 + feather * 0.008;
        for (let side = 0; side < sides; side += 1) {
          const angle = (side / sides) * Math.PI * 2;
          positions.push(
            center.x + across.x * Math.cos(angle) * width,
            center.y + Math.sin(angle) * width * 0.18,
            center.z + across.z * Math.cos(angle) * width,
          );
        }
      }
      for (let ring = 0; ring < rings; ring += 1) {
        for (let side = 0; side < sides; side += 1) {
          const a = offset + ring * sides + side;
          const b = offset + ring * sides + ((side + 1) % sides);
          indices.push(a, a + sides, b, b, a + sides, b + sides);
        }
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
