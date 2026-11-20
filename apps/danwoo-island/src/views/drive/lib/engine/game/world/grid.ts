import { Fn, positionWorld, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { gridColorNode } from '@views/drive/lib/engine/game/materials/gridColor';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { isTideLoading, tideSeaMaterial } from '@views/drive/lib/engine/game/world/tideLoading';

const PLANE_SIZE = 100;
const GRID_COLOR = {
  color: 0x1b191f,
  scale: 0.001,
  lines: [
    { color: '#8d55ff', scale: 10, thickness: 0.02, cross: 0.2 },
    { color: '#675369', scale: 100, thickness: 0.002, cross: 1 },
  ],
} as const;

function revealGridMaterial(): THREE.NodeMaterial {
  const { reveal } = getGame();
  const shaded = new MeshDefaultMaterial({
    colorNode: vec4(gridColorNode(GRID_COLOR), 1).rgb,
    hasWater: false,
    hasReveal: false,
    hasLightBounce: false,
  });
  const { shadedOutput } = shaded;

  const material = new THREE.NodeMaterial();
  material.side = THREE.DoubleSide;
  material.outputNode = Fn(() => {
    positionWorld.xz.sub(reveal.position2Uniform).length().lessThan(reveal.distance).discard();
    return shadedOutput;
  })();
  return material;
}

export class Grid {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.Material>;

  constructor() {
    const material = isTideLoading ? tideSeaMaterial() : revealGridMaterial();
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE), material);
    this.mesh.rotation.x = -Math.PI * 0.5;
    const { position } = getGame().respawns.getDefault();
    this.mesh.position.set(position.x, 0, position.z);
    this.show();
  }

  show(): void {
    getGame().scene.add(this.mesh);
  }

  destroy(): void {
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
    this.mesh.removeFromParent();
  }
}
