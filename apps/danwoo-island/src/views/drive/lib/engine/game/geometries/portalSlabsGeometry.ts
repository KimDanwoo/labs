import * as THREE from 'three/webgpu';

const SLAB_POSITIONS = [
  [-1, 0, -1],
  [-1, 0, -1],
  [1, 0, -1],
  [1, 0, -1],
  [1, 0, 1],
  [1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
] as const;
const SLAB_EDGES = [0, 1, 0, 1, 0, 1, 0, 1] as const;
const SLAB_INDICES = [0, 3, 2, 3, 0, 1, 2, 5, 4, 5, 2, 3, 4, 7, 6, 7, 4, 5, 6, 1, 0, 1, 6, 7] as const;
const VERTICES = SLAB_POSITIONS.length;

export class PortalSlabsGeometry extends THREE.BufferGeometry {
  constructor(size = 1, columnsCount = 5) {
    super();
    const slabsCount = columnsCount * columnsCount;
    const positions = new Float32Array(VERTICES * slabsCount * 3);
    const centers = new Float32Array(VERTICES * slabsCount * 2);
    const edges = new Float32Array(VERTICES * slabsCount);
    const randoms = new Float32Array(VERTICES * slabsCount);
    const distanceToCenters = new Float32Array(VERTICES * slabsCount);
    const indices = new Uint16Array(SLAB_INDICES.length * slabsCount);
    const offset = (columnsCount - 1) * 0.5;

    for (let x = 0; x < columnsCount; x += 1) {
      for (let z = 0; z < columnsCount; z += 1) {
        const slabX = (x - offset) * size;
        const slabZ = (z - offset) * size;
        const random = Math.random();
        const slab = z + x * columnsCount;
        const firstVertex = slab * VERTICES;

        for (const [index, [cornerX, cornerY, cornerZ]] of SLAB_POSITIONS.entries()) {
          const vertex = firstVertex + index;
          positions.set([(cornerX * size) / 2 + slabX, cornerY, (cornerZ * size) / 2 + slabZ], vertex * 3);
          centers.set([slabX, slabZ], vertex * 2);
          edges[vertex] = SLAB_EDGES[index] ?? 0;
          randoms[vertex] = random;
          distanceToCenters[vertex] = Math.hypot(slabX, slabZ);
        }
        indices.set(
          SLAB_INDICES.map((index) => firstVertex + index),
          slab * SLAB_INDICES.length,
        );
      }
    }

    this.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.setAttribute('center', new THREE.Float32BufferAttribute(centers, 2));
    this.setAttribute('edge', new THREE.Float32BufferAttribute(edges, 1));
    this.setAttribute('random', new THREE.Float32BufferAttribute(randoms, 1));
    this.setAttribute('distanceToCenter', new THREE.Float32BufferAttribute(distanceToCenters, 1));
    this.setIndex(new THREE.Uint16BufferAttribute(indices, 1));
  }
}
