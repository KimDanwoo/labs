import { mix, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { TICK_ORDER } from '../tickOrder';
import { Track } from '../tracks';
import { Trails } from '../trails';
import { clamp, remapClamp } from '../utilities/maths';
import { createBoxyVehicle } from './boxyVehicle';
import { bindBlinkers, createPaints } from './vehiclePaints';
import { createAntenna, createWheels, updateAntenna, updateWheels } from './vehicleWheels';
import {
  type Antenna,
  BOOST,
  type BoostTrails,
  findParts,
  MAIN_TRACK_MAX_ELEVATION,
  type PaintName,
  type PartName,
  STEERING_EASING,
  TRAIL_OFFSETS,
  trailAnchor,
  type VisualWheel,
} from './visualVehicleParts';

export class VisualVehicle {
  readonly screenPosition = new THREE.Vector2(0, 0);
  readonly #model: THREE.Object3D;
  readonly #dispose: (() => void) | null;
  readonly #parts: Map<string, THREE.Object3D>;
  readonly #chassis: THREE.Object3D;
  readonly #wheels: VisualWheel[];
  readonly #mainGroundTrack: Track;
  readonly #paints: Partial<Record<PaintName, THREE.Material>>;
  readonly #backLightMaterial = new THREE.MeshBasicNodeMaterial({ colorNode: vec3(2.2) });
  readonly #trails: BoostTrails;
  readonly #boostMix = uniform(0);
  readonly #antenna: Antenna | null;
  readonly #blinkerCallbacks: {
    left: (action: { active: boolean }) => void;
    right: (action: { active: boolean }) => void;
  } | null;
  readonly #tick = (): void => this.update();
  #steering = 0;
  #boost = 0;

  constructor(source: THREE.Object3D) {
    const game = getGame();
    const isDefaultVehicle = source === game.model('vehicle').scene;
    const boxy = isDefaultVehicle ? createBoxyVehicle(source) : null;
    this.#model = boxy?.model ?? source;
    this.#dispose = boxy?.dispose ?? null;

    this.#parts = findParts(this.#model);
    this.#chassis = this.#requirePart('chassis');
    this.#chassis.rotation.reorder('YXZ');
    game.materials.updateObject(this.#chassis);
    game.scene.add(this.#chassis);
    for (const name of ['blinkerLeft', 'blinkerRight', 'stopLights', 'backLights'] as const) {
      const part = this.#part(name);
      if (part) part.visible = false;
    }
    game.materials.updateObject(this.#requirePart('wheelContainer'));

    this.#mainGroundTrack = game.tracks.add(new Track(1.5, 'g'));
    this.#wheels = createWheels(this.#requirePart('wheelContainer'), this.#chassis);
    this.#blinkerCallbacks = bindBlinkers(this.#part('blinkerLeft'), this.#part('blinkerRight'));
    this.#antenna = createAntenna(this.#part('antenna'));
    this.#trails = this.#createTrails();
    this.#mixEnergyGlow();
    this.#paints = createPaints(this.#model);
    this.changePaint(game.options.paintName);

    game.ticker.events.on('tick', this.#tick, TICK_ORDER.visualVehicle);
  }

  #part(name: PartName): THREE.Object3D | undefined {
    return this.#parts.get(name);
  }

  #requirePart(name: PartName): THREE.Object3D {
    const part = this.#part(name);
    if (!part) throw new Error(`Vehicle part is missing: ${name}`);
    return part;
  }

  destroy(): void {
    const game = getGame();
    game.ticker.events.off('tick', this.#tick);
    if (this.#blinkerCallbacks) {
      game.inputs.events.off('left', this.#blinkerCallbacks.left);
      game.inputs.events.off('right', this.#blinkerCallbacks.right);
    }
    for (const part of this.#parts.values()) part.removeFromParent();
    this.#dispose?.();
    game.tracks.remove(this.#mainGroundTrack);
    for (const wheel of this.#wheels) game.tracks.remove(wheel.groundTrack);
  }

  #createTrails(): BoostTrails {
    const trails = new Trails();
    const leftAnchor = trailAnchor(this.#chassis, TRAIL_OFFSETS.left);
    const left = trails.create();
    leftAnchor.getWorldPosition(left.position);
    const rightAnchor = trailAnchor(this.#chassis, TRAIL_OFFSETS.right);
    const right = trails.create();
    rightAnchor.getWorldPosition(right.position);
    return { left, right, leftAnchor, rightAnchor };
  }

  #mixEnergyGlow(): void {
    const energy = this.#part('energy');
    if (!(energy instanceof THREE.Mesh) || !(energy.material instanceof MeshDefaultMaterial)) return;
    const glow = getGame().materials.emissiveOutput('emissivePurpleRadialGradient');
    const material = new THREE.MeshLambertNodeMaterial();
    material.outputNode = mix(energy.material.shadedOutput, glow, this.#boostMix);
    energy.material = material;
  }

  changePaint(name: PaintName): boolean {
    const material = this.#paints[name];
    const body = this.#part('bodyPainted');
    if (!material) return false;
    if (body instanceof THREE.Mesh) body.material = material;
    for (const { painted } of this.#wheels) {
      if (painted) painted.material = material;
    }
    return true;
  }

  update(): void {
    const game = getGame();
    const { physicalVehicle: vehicle, player, ticker } = game;
    this.#chassis.position.copy(vehicle.position);
    this.#chassis.quaternion.copy(vehicle.quaternion);
    this.#steering +=
      (player.steering * vehicle.steeringAmplitude - this.#steering) * ticker.deltaScaled * STEERING_EASING;
    updateWheels(this.#wheels, this.#steering);
    this.#mainGroundTrack.update(vehicle.position, vehicle.position.y < MAIN_TRACK_MAX_ELEVATION);
    updateAntenna(this.#antenna, this.#chassis);
    this.#updateLights();

    const trailAlpha = vehicle.isGoingForward && player.boosting && player.accelerating > 0 ? 1 : 0;
    this.#trails.leftAnchor.getWorldPosition(this.#trails.left.position);
    this.#trails.left.alpha = trailAlpha;
    this.#trails.rightAnchor.getWorldPosition(this.#trails.right.position);
    this.#trails.right.alpha = trailAlpha;

    this.#boost = clamp(this.#boost + (player.boosting ? 1 : -1) * ticker.deltaScaled * BOOST.speed, 0, 1);
    this.#boostMix.value = 1 - (1 - this.#boost) ** BOOST.easePower;
    this.#updateCells();

    const projected = new THREE.Vector3().setFromMatrixPosition(this.#chassis.matrixWorld).project(game.view.camera);
    this.screenPosition.x = projected.x * 0.5 + 0.5;
    this.screenPosition.y = projected.y * -0.5 + 0.5;
  }

  #updateLights(): void {
    const { player, materials } = getGame();
    const stopLights = this.#part('stopLights');
    const backLights = this.#part('backLights');
    if (stopLights) stopLights.visible = Boolean(player.braking);
    if (!(backLights instanceof THREE.Mesh)) return;
    if (player.braking) {
      backLights.visible = true;
      backLights.material = materials.get('emissiveOrangeRadialGradient');
    } else if (player.accelerating < 0) {
      backLights.visible = true;
      backLights.material = this.#backLightMaterial;
    } else {
      backLights.visible = false;
    }
  }

  #updateCells(): void {
    if (!this.#part('energy')) return;
    const cells: [PartName, [number, number]][] = [
      ['cell1', [0, 0.6]],
      ['cell3', [0.2, 0.8]],
      ['cell2', [0.4, 1]],
    ];
    for (const [name, range] of cells) {
      const cell = this.#part(name);
      if (cell) cell.position.y = remapClamp(this.#boost, range, [0.2, 0]);
    }
  }
}
