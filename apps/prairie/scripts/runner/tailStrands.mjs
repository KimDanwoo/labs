import { blendWeights } from './skin.mjs';

export function addTailStrands({ vertices, faces }, tailSource) {
  for (let strand = 0; strand < 18; strand += 1) {
    const phase = strand * 2.39996;
    const spread = Math.sqrt((strand + 1) / 18);
    const offset = vertices.length;
    const rings = 12,
      sides = 6;
    for (let ring = 0; ring <= rings; ring += 1) {
      const t = ring / rings;
      const y = 0.0145 + 0.012 * t - 0.003 * t * t;
      const z = 0.031 - 0.003 * t - (0.017 + 0.003 * Math.sin(phase)) * t * t;
      const x = Math.cos(phase) * spread * (0.00045 + 0.0011 * t) + Math.sin(t * 4 + phase) * 0.0004 * t;
      const radius = 0.00038 * Math.pow(1 - t, 0.65) + 0.000015;
      const dy = 0.012 - 0.006 * t,
        dz = -0.003 - (0.034 + 0.006 * Math.sin(phase)) * t;
      const tangentLength = Math.hypot(dy, dz);
      for (let side = 0; side < sides; side += 1) {
        const angle = (side / sides) * Math.PI * 2;
        const position = [
          x + Math.cos(angle) * radius,
          y - (dz / tangentLength) * Math.sin(angle) * radius,
          z + (dy / tangentLength) * Math.sin(angle) * radius,
        ];
        const nearby = tailSource
          .map((v, i) => [i, 1 / (1e-10 + v.position.reduce((sum, n, axis) => sum + (n - position[axis]) ** 2, 0))])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4);
        const sum = nearby.reduce((n, [, weight]) => n + weight, 0);
        vertices.push({
          position,
          skin: blendWeights(
            tailSource,
            nearby.map(([i, weight]) => [i, weight / sum]),
          ),
        });
      }
    }
    for (let ring = 0; ring < rings; ring += 1)
      for (let side = 0; side < sides; side += 1) {
        const a = offset + ring * sides + side,
          b = offset + ring * sides + ((side + 1) % sides);
        faces.push({ ids: [a, a + sides, b], material: 1 }, { ids: [b, a + sides, b + sides], material: 1 });
      }
  }
}
