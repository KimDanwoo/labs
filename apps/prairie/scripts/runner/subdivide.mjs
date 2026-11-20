import { interpolate } from './skin.mjs';

export function loopSubdivide({ vertices, faces: source }) {
  let faces = source;
  const edges = new Map();
  const neighbors = vertices.map(() => new Set());
  const keyFor = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  for (const {
    ids: [a, b, c],
  } of faces) {
    for (const [u, v, opposite] of [
      [a, b, c],
      [b, c, a],
      [c, a, b],
    ]) {
      const key = keyFor(u, v);
      if (!edges.has(key)) edges.set(key, { a: u, b: v, opposite: [] });
      edges.get(key).opposite.push(opposite);
      neighbors[u].add(v);
      neighbors[v].add(u);
    }
  }
  const boundaries = vertices.map(() => []);
  for (const e of edges.values())
    if (e.opposite.length === 1) {
      boundaries[e.a].push(e.b);
      boundaries[e.b].push(e.a);
    }
  const next = vertices.map((v, i) => {
    const border = boundaries[i];
    if (border.length === 2)
      return interpolate(vertices, [
        [i, 0.75],
        [border[0], 0.125],
        [border[1], 0.125],
      ]);
    if (border.length > 0) return v;
    if (neighbors[i].size < 3) return v;
    const n = neighbors[i].size;
    const beta = n === 3 ? 3 / 16 : 3 / (8 * n);
    return interpolate(vertices, [[i, 1 - n * beta], ...[...neighbors[i]].map((j) => [j, beta])]);
  });
  for (const edge of edges.values()) {
    edge.index = next.length;
    const { a, b, opposite } = edge;
    const stencil =
      opposite.length === 2
        ? [
            [a, 3 / 8],
            [b, 3 / 8],
            [opposite[0], 1 / 8],
            [opposite[1], 1 / 8],
          ]
        : [
            [a, 0.5],
            [b, 0.5],
          ];
    next.push(interpolate(vertices, stencil));
  }
  faces = faces.flatMap(({ ids: [a, b, c], material }) => {
    const ab = edges.get(keyFor(a, b)).index,
      bc = edges.get(keyFor(b, c)).index,
      ca = edges.get(keyFor(c, a)).index;
    return [
      [a, ab, ca],
      [b, bc, ab],
      [c, ca, bc],
      [ab, bc, ca],
    ].map((ids) => ({ ids, material }));
  });
  return { vertices: next, faces };
}
