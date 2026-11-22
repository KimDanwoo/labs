import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { tideSeaMaterial } from '@views/drive/lib/engine/game/world/tideLoading';

const PLANE_SIZE = 100;

export class Grid {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.Material>;

  constructor() {
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE), tideSeaMaterial());
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
