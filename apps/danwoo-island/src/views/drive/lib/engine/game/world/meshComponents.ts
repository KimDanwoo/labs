import * as THREE from 'three/webgpu';

export interface MeshComponent {
  offsets: number[];
  box: THREE.Box3;
}

function weldVertices(position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, index: number[]): number[] {
  const canonical = new Map<string, number>();
  const representative = (vertex: number): number => {
    const key = [position.getX(vertex), position.getY(vertex), position.getZ(vertex)]
      .map((value) => value.toFixed(3))
      .join();
    const existing = canonical.get(key);
    if (existing !== undefined) return existing;
    canonical.set(key, vertex);
    return vertex;
  };
  return index.map(representative);
}

function connectTriangles(vertexCount: number, roots: number[]): (start: number) => number {
  const parent = Array.from({ length: vertexCount }, (_, vertex) => vertex);
  const find = (start: number): number => {
    let vertex = start;
    while (parent[vertex] !== vertex) {
      const grandparent = parent[parent[vertex] ?? vertex] ?? vertex;
      parent[vertex] = grandparent;
      vertex = grandparent;
    }
    return vertex;
  };
  for (let offset = 0; offset < roots.length; offset += 3) {
    const first = roots[offset] ?? 0;
    for (const other of [roots[offset + 1], roots[offset + 2]]) {
      if (other !== undefined) parent[find(other)] = find(first);
    }
  }
  return find;
}

export function meshComponents(geometry: THREE.BufferGeometry): { index: number[]; components: MeshComponent[] } {
  const { position } = geometry.attributes;
  if (!position) throw new Error('Geometry has no positions');
  const index = geometry.index
    ? Array.from(geometry.index.array)
    : Array.from({ length: position.count }, (_, vertex) => vertex);
  const roots = weldVertices(position, index);
  const find = connectTriangles(position.count, roots);

  const components = new Map<number, MeshComponent>();
  const point = new THREE.Vector3();
  for (let offset = 0; offset < index.length; offset += 3) {
    const root = find(roots[offset] ?? 0);
    const component = components.get(root) ?? { offsets: [], box: new THREE.Box3() };
    components.set(root, component);
    component.offsets.push(offset);
    for (const vertex of index.slice(offset, offset + 3))
      component.box.expandByPoint(point.fromBufferAttribute(position, vertex));
  }
  return { index, components: [...components.values()] };
}

export function removeComponents(
  mesh: THREE.Mesh,
  shouldRemove: (component: MeshComponent) => boolean,
): MeshComponent[] {
  const { index, components } = meshComponents(mesh.geometry);
  const removed = components.filter(shouldRemove);
  const removedOffsets = new Set(removed.flatMap((component) => component.offsets));
  const kept: number[] = [];
  for (let offset = 0; offset < index.length; offset += 3) {
    if (!removedOffsets.has(offset)) kept.push(...index.slice(offset, offset + 3));
  }
  mesh.geometry.setIndex(kept);
  return removed;
}
