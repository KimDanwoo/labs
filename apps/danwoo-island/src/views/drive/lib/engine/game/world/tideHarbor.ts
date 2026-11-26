import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { COVE, coveBed, roadZ } from '@views/drive/lib/engine/game/world/layout/tideCove';
import { SnowHeadland } from '@views/drive/lib/engine/game/world/snowHeadland';
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

function marker(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  shade: string,
  point: readonly [number, number, number],
): THREE.Mesh {
  const material =
    shade === '#ffd786'
      ? new THREE.MeshBasicMaterial({ color: shade })
      : new MeshDefaultMaterial({ colorNode: uniform(new THREE.Color(shade)).rgb });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(...point);
  group.add(mesh);
  return mesh;
}

export class TideHarbor {
  readonly valve = new THREE.Group();
  readonly #buoy = new THREE.Group();
  constructor() {
    const harbor = new THREE.Group();
    const { towerX: x, towerZ: z } = COVE;
    const island = new THREE.Group();
    island.visible = false;
    harbor.add(island);
    const headland = new SnowHeadland(island);
    this.valve.position.set(8.8, 1.05, 84.3);
    marker(harbor, new THREE.CylinderGeometry(0.16, 0.22, 1.15, 8), '#466766', [8.8, 0.56, 84.3]);
    marker(this.valve, new THREE.TorusGeometry(0.42, 0.075, 6, 12), '#c65537', [0, 0, 0]);
    for (let spoke = 0; spoke < 3; spoke++) {
      const bar = marker(this.valve, new THREE.BoxGeometry(0.79, 0.075, 0.09), '#c65537', [0, 0, 0]);
      bar.rotation.z = (spoke * Math.PI) / 3;
    }
    harbor.add(this.valve);
    const tower = new THREE.Group();
    tower.position.set(x, 0, z);
    tower.scale.setScalar(1.45);
    island.add(tower);
    const stone = '#978b77';
    marker(tower, new THREE.CylinderGeometry(0.93, 1.25, 0.3, 10), stone, [0, 0.15, 0]);
    marker(tower, new THREE.CylinderGeometry(0.55, 0.84, 2.55, 10), '#f5e4bd', [0, 1.55, 0]);
    marker(tower, new THREE.CylinderGeometry(0.69, 0.74, 0.54, 10), '#c96248', [0, 1.5, 0]);
    marker(tower, new THREE.CylinderGeometry(0.49, 0.55, 0.48, 8), '#ffd786', [0, 3.04, 0]);
    marker(tower, new THREE.CylinderGeometry(0.72, 0.65, 0.13, 10), '#415958', [0, 2.82, 0]);
    for (let post = 0; post < 6; post++) {
      const angle = (post * Math.PI) / 3;
      marker(tower, new THREE.CylinderGeometry(0.038, 0.038, 0.48, 5), '#476765', [
        0.51 * Math.cos(angle),
        3.08,
        0.51 * Math.sin(angle),
      ]);
    }
    marker(tower, new THREE.CylinderGeometry(0.07, 0.09, 0.26, 6), stone, [0, 3.88, 0]);
    marker(tower, new THREE.ConeGeometry(0.78, 0.52, 8), '#3b6464', [0, 3.54, 0]);
    const physical = getGame().physics.getPhysical({
      type: 'kinematicPositionBased',
      enabled: false,
      colliders: [
        ...headland.colliders,
        { position: new THREE.Vector3(x, 2.03, z), shape: 'cylinder', parameters: [2.03, 1.16] },
      ],
    });
    for (let i = 10; i < COVE.islandX - COVE.islandRadiusX; i += 2.4) {
      const road = roadZ(i);
      const stripe = marker(island, new THREE.BoxGeometry(0.66, 0.045, 0.12), '#f8d593', [
        i,
        -COVE.floorScale * coveBed(i, road, 0) + 0.035,
        road,
      ]);
      stripe.rotation.y = -Math.atan2(roadZ(i + 0.1) - road, 0.1);
    }
    marker(this.#buoy, new THREE.CylinderGeometry(0.19, 0.32, 0.45, 8), '#dc6750', [0, 0.18, 0]);
    marker(this.#buoy, new THREE.CylinderGeometry(0.16, 0.19, 0.18, 8), '#fff0c7', [0, 0.48, 0]);
    this.#buoy.position.set(17, 0, 88.8);
    harbor.add(this.#buoy);
    getGame().scene.add(harbor);
    let previous = 0;
    getGame().ticker.events.on(
      'tick',
      () => {
        const progress = getGame().water.tide.value;
        if (progress === previous) return;
        previous = progress;
        island.visible = progress > 0;
        if (!island.visible) {
          physical.body.setEnabled(false);
          return;
        }
        island.position.y = -6.5 * (1 - progress) ** 2;
        if (!physical.body.isEnabled()) {
          physical.body.setTranslation(island.position, false);
          physical.body.setEnabled(true);
        }
        physical.body.setNextKinematicTranslation(island.position);
      },
      TICK_ORDER.scenery,
    );
    this.update();
  }
  update(): void {
    this.valve.rotation.z = getGame().water.tide.value * Math.PI;
    const { x, z } = this.#buoy.position;
    this.#buoy.position.y = getGame().water.surfaceAt(x, z);
  }
}
