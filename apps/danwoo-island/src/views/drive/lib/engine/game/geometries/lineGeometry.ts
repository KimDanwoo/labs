import * as THREE from 'three/webgpu';

const VERTICES_PER_POINT = 2;
const INDICES_PER_SEGMENT = 6;

export class LineGeometry extends THREE.BufferGeometry {
  constructor(points: readonly THREE.Vector3[] = []) {
    super();
    const count = points.length;
    const positions = new Float32Array(count * 3 * VERTICES_PER_POINT);
    const directions = new Float32Array(count * 3 * VERTICES_PER_POINT);
    const ratios = new Float32Array(count * VERTICES_PER_POINT);
    const indices = new Uint16Array((count - 1) * INDICES_PER_SEGMENT);

    for (const [index, point] of points.entries()) {
      const next = points[Math.min(index + 1, count - 1)] ?? point;
      const direction = next.clone().sub(point).normalize();
      const vertex = index * VERTICES_PER_POINT;
      const ratio = index / (count - 1);
      for (let side = 0; side < VERTICES_PER_POINT; side += 1) {
        positions.set([point.x, point.y, point.z], (vertex + side) * 3);
        directions.set([direction.x, direction.y, direction.z], (vertex + side) * 3);
        ratios[vertex + side] = ratio;
      }
      const isLastPoint = index === count - 1;
      if (!isLastPoint) {
        indices.set([vertex + 2, vertex, vertex + 1, vertex + 1, vertex + 3, vertex + 2], index * INDICES_PER_SEGMENT);
      }
    }

    this.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.setAttribute('direction', new THREE.Float32BufferAttribute(directions, 3));
    this.setAttribute('ratio', new THREE.Float32BufferAttribute(ratios, 1));
    this.setIndex(new THREE.Uint16BufferAttribute(indices, 1));
  }
}
