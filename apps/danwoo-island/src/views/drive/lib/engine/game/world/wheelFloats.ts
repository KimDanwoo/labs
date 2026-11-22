import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { BOAT_FLOAT_ELEVATION } from '@views/drive/lib/engine/game/physics/vehicleBoat';
import { BoatSplash } from '@views/drive/lib/engine/game/world/boatSplash';
import { islandMaterial } from '@views/drive/lib/engine/game/world/islandMaterials';
import {
  Deployment,
  overshoot,
  smooth,
  type Stage,
  staged,
} from '@views/drive/lib/engine/game/world/vehicleDeployment';
import type { VisualWheel } from '@views/drive/lib/engine/game/world/visualVehicleParts';

const TUBE = { radius: 0.64, thickness: 0.27, radialSegments: 18, arcSegments: 10, bands: 6, bandShare: 0.66 } as const;
const SHINE = { radius: 0.74, thickness: 0.035, lift: 0.235, arc: 1.1, turn: 0.5, segments: 12 } as const;
const BAND_ARC = (Math.PI * 2) / TUBE.bands;
const JET = {
  radius: 0.17,
  length: 0.7,
  segments: 14,
  stowed: -1,
  deployed: -1.7,
  height: -0.35,
  spread: 0.45,
} as const;
const SOUND = {
  deploy: { path: 'sounds/mecanism/assemble.mp3', volume: 0.45 },
  rush: { path: 'sounds/swoosh/Swoosh 05.mp3', volume: 0.35 },
  stow: { path: 'sounds/mecanism/slide.mp3', volume: 0.3 },
} as const;
const WATERLINE = -0.2;
const OUTREACH = 0.3;
const FLAT = Math.PI / 2;
const HIDDEN_SCALE = 0.01;
const DEPLOY = { duration: 1.1, ease: 'none' } as const;
const STAGE = {
  reach: [0, 0.3],
  fold: [0.15, 0.6],
  jets: [0.3, 0.7],
  inflate: [0.5, 0.9],
} as const satisfies Record<string, Stage>;

function tubeArcs(from: number, to: number): THREE.BufferGeometry {
  const arcs = Array.from({ length: TUBE.bands }, (_, index) =>
    new THREE.TorusGeometry(
      TUBE.radius,
      TUBE.thickness,
      TUBE.radialSegments,
      TUBE.arcSegments,
      (to - from) * BAND_ARC,
    ).rotateZ((index + from) * BAND_ARC),
  );
  const merged = mergeGeometries(arcs);
  if (!merged) throw new Error('튜브 형상을 합치지 못했어요.');
  return merged;
}

function bothFaces(geometry: THREE.BufferGeometry, offset: number, material: THREE.Material): THREE.Mesh[] {
  return [0, Math.PI].map((turn) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = turn;
    mesh.position.z = Math.cos(turn) * offset;
    return mesh;
  });
}

interface Float {
  readonly wheel: VisualWheel;
  readonly pontoon: THREE.Group;
}

export class WheelFloats {
  readonly #floats: Float[];
  readonly #jets = new THREE.Group();
  readonly #geometries: THREE.BufferGeometry[];
  readonly #splash = new BoatSplash();
  readonly #sounds: Record<keyof typeof SOUND, { play: () => void }>;
  readonly #chassis: THREE.Object3D;
  readonly #stern = new THREE.Vector3();
  readonly #backward = new THREE.Vector3();
  readonly #deployment = new Deployment(DEPLOY);

  constructor(wheels: readonly VisualWheel[], chassis: THREE.Object3D) {
    const { audio } = getGame();
    this.#chassis = chassis;
    const sound = (name: keyof typeof SOUND): { play: () => void } =>
      audio.register({ ...SOUND[name], autoplay: false, loop: false });
    this.#sounds = { deploy: sound('deploy'), rush: sound('rush'), stow: sound('stow') };
    const bands = tubeArcs(0, TUBE.bandShare);
    const stripes = tubeArcs(TUBE.bandShare, 1);
    const shine = new THREE.TorusGeometry(
      SHINE.radius,
      SHINE.thickness,
      SHINE.segments,
      SHINE.segments,
      SHINE.arc,
    ).rotateZ(SHINE.turn);
    const nozzle = new THREE.CylinderGeometry(JET.radius, JET.radius, JET.length, JET.segments).rotateZ(FLAT);
    this.#geometries = [bands, stripes, shine, nozzle];

    this.#floats = wheels.map((wheel) => {
      const ring = new THREE.Group().add(
        new THREE.Mesh(bands, islandMaterial('lagoon')),
        new THREE.Mesh(stripes, islandMaterial('bunting4')),
        ...bothFaces(shine, SHINE.lift, islandMaterial('glass')),
      );
      for (const part of ring.children) part.castShadow = true;
      wheel.container.add(ring);
      return { wheel, pontoon: ring };
    });

    for (const side of [-1, 1]) {
      const body = new THREE.Mesh(nozzle, islandMaterial('iron'));
      body.position.set(0, JET.height, side * JET.spread);
      body.castShadow = true;
      this.#jets.add(body);
    }
    chassis.add(this.#jets);
    this.#pose(0);
  }

  update(): void {
    const isBoating = getGame().physicalVehicle.boat.isActive;
    if (this.#deployment.follow(isBoating)) this.#announce(isBoating);
    this.#pose(this.#deployment.progress);
    if (isBoating) this.#churn();
    this.#splash.update();
  }

  #churn(): void {
    const { physicalVehicle, ticker } = getGame();
    const travelled = Math.abs(physicalVehicle.forwardSpeed) * ticker.deltaScaled;
    this.#jets.getWorldPosition(this.#stern);
    this.#backward.set(-Math.sign(physicalVehicle.forwardSpeed), 0, 0).transformDirection(this.#chassis.matrixWorld);
    this.#splash.trail(this.#stern, this.#backward, travelled);
  }

  #announce(isBoating: boolean): void {
    if (!isBoating) {
      this.#sounds.stow.play();
      return;
    }
    this.#splash.burst(getGame().physicalVehicle.position);
    this.#sounds.deploy.play();
    this.#sounds.rush.play();
  }

  #pose(progress: number): void {
    const reach = smooth(staged(progress, STAGE.reach));
    const sink = smooth(staged(progress, STAGE.fold));
    const inflate = overshoot(staged(progress, STAGE.inflate));
    const jets = smooth(staged(progress, STAGE.jets));
    const isAfloat = progress > 0;

    for (const { wheel, pontoon } of this.#floats) {
      const { container } = wheel;
      const side = Math.sign(container.position.z);
      container.position.z += side * OUTREACH * reach;
      container.position.y += (WATERLINE - BOAT_FLOAT_ELEVATION - container.position.y) * sink;
      container.rotation.x = side * FLAT * sink;
      pontoon.visible = isAfloat;
      pontoon.scale.setScalar(Math.max(HIDDEN_SCALE, inflate));
      if (wheel.suspension) wheel.suspension.visible = !isAfloat;
    }

    this.#jets.visible = isAfloat;
    this.#jets.position.x = JET.stowed + (JET.deployed - JET.stowed) * jets;
  }

  dispose(): void {
    for (const geometry of this.#geometries) geometry.dispose();
    for (const { pontoon } of this.#floats) pontoon.removeFromParent();
    this.#jets.removeFromParent();
    this.#splash.dispose();
  }
}
