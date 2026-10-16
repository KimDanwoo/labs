import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

// 깃털을 납작한 곡면 튜브로 만들어 뒤·옆에서도 두께와 겹침이 보이게 한다.
export function makeWingGeometry(span: number, feathers: number): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const rings = 8;
  const sides = 6;
  for (let feather = 0; feather < feathers; feather += 1) {
    const fan = feather / (feathers - 1);
    const root = new Vector3(0.1 + fan * 0.42, 0, -fan * 0.38);
    const tip = new Vector3(span * (1 - fan * 0.7), -0.12 - fan * 0.1, -0.15 - fan * 2.3);
    const across = new Vector3(-(tip.z - root.z), 0, tip.x - root.x).normalize();
    const offset = positions.length / 3;
    for (let ring = 0; ring <= rings; ring += 1) {
      const t = ring / rings;
      const width = (0.11 + fan * 0.08) * Math.pow(Math.sin(Math.PI * t), 0.6) + 0.001;
      const center = root.clone().lerp(tip, t);
      center.y += Math.sin(t * Math.PI) * 0.16 + feather * 0.003;
      for (let side = 0; side < sides; side += 1) {
        const angle = (side / sides) * Math.PI * 2;
        positions.push(
          center.x + across.x * Math.cos(angle) * width,
          center.y + Math.sin(angle) * width * 0.16,
          center.z + across.z * Math.cos(angle) * width,
        );
      }
    }
    for (let ring = 0; ring < rings; ring += 1) {
      for (let side = 0; side < sides; side += 1) {
        const a = offset + ring * sides + side;
        const b = offset + ring * sides + ((side + 1) % sides);
        const c = a + sides,
          d = b + sides;
        indices.push(a, c, b, b, c, d);
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
