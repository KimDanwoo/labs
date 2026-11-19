export function blendWeights(vertices, stencil) {
  const combined = new Map();
  for (const [index, amount] of stencil) {
    for (const [joint, weight] of vertices[index].skin)
      combined.set(joint, (combined.get(joint) ?? 0) + weight * amount);
  }
  const skin = [...combined]
    .filter(([, w]) => w > 1e-8)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const sum = skin.reduce((n, [, w]) => n + w, 0);
  return skin.map(([j, w]) => [j, w / sum]);
}

export function interpolate(vertices, stencil) {
  const position = [0, 0, 0];
  for (const [index, amount] of stencil)
    vertices[index].position.forEach((v, axis) => {
      position[axis] += v * amount;
    });
  return { position, skin: blendWeights(vertices, stencil) };
}
