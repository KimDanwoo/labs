import gsap from 'gsap';
import {
  cameraPosition,
  color,
  Fn,
  min,
  mix,
  normalWorld,
  positionWorld,
  screenCoordinate,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial, revealNode } from '../materials/meshDefaultMaterial';
import { TICK_ORDER } from '../tickOrder';
import { Track } from '../tracks';
import { type Trail, Trails } from '../trails';
import { clamp, remapClamp } from '../utilities/maths';
import { createBoxyVehicle } from './boxyVehicle';

export type PaintName = 'red' | 'orange' | 'white' | 'black' | 'flames' | 'abyssal';

interface BlinkerCallbacks {
  left: (action: { active: boolean }) => void;
  right: (action: { active: boolean }) => void;
}

interface Antenna {
  object: THREE.Object3D;
  head: THREE.Object3D;
  headAxle: THREE.Object3D;
  headReference: THREE.Object3D;
}

interface BoostTrails {
  left: Trail;
  right: Trail;
  leftAnchor: THREE.Object3D;
  rightAnchor: THREE.Object3D;
}

interface VisualWheel {
  container: THREE.Object3D;
  cylinder: THREE.Object3D;
  suspension: THREE.Object3D | null;
  painted: THREE.Mesh | null;
  groundTrack: Track;
}

const PART_NAMES = [
  'bodyPainted',
  'chassis',
  'blinkerLeft',
  'blinkerRight',
  'stopLights',
  'backLights',
  'wheelContainer',
  'antenna',
  'cell1',
  'cell2',
  'cell3',
  'energy',
] as const;
type PartName = (typeof PART_NAMES)[number];

const PART_PATTERNS = PART_NAMES.map((name) => new RegExp(`^(${name})`, 'i'));
const WHEEL_COUNT = 4;
const MIRRORED_WHEELS = new Set([0, 2]);
const BLINK_INTERVAL = 0.8;
const STEERING_EASING = 16;
const WHEEL_ROTATION_SCALE = 0.006;
const WHEEL_MAX_Y = -0.5;
const WHEEL_EASING = 25;
const MAIN_TRACK_MAX_ELEVATION = 1.5;
const BOOST = { speed: 1.2, easePower: 7 } as const;
const TRAIL_OFFSETS = { left: [-1.28, 0.1, -0.55], right: [-1.28, 0.1, 0.55] } as const;
const ANTENNA_TARGET = new THREE.Vector3(0, 2, 0);

function findParts(model: THREE.Object3D): Map<string, THREE.Object3D> {
  const parts = new Map<string, THREE.Object3D>();
  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
      child.receiveShadow = true;
      child.castShadow = true;
      child.material.shadowSide = THREE.BackSide;
    }
    for (const pattern of PART_PATTERNS) {
      const match = pattern.exec(child.name);
      if (match) parts.set(match[0], child);
    }
  });
  return parts;
}

function trailAnchor(parent: THREE.Object3D, [x, y, z]: readonly [number, number, number]): THREE.Object3D {
  const anchor = new THREE.Object3D();
  anchor.position.set(x, y, z);
  parent.add(anchor);
  return anchor;
}

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
    this.#wheels = this.#createWheels();
    this.#blinkerCallbacks = this.#bindBlinkers();
    this.#antenna = this.#createAntenna();
    this.#trails = this.#createTrails();
    this.#mixEnergyGlow();
    this.#paints = this.#createPaints();
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

  #createWheels(): VisualWheel[] {
    const game = getGame();
    const template = this.#requirePart('wheelContainer');
    return Array.from({ length: WHEEL_COUNT }, (_, index) => {
      const container = template.clone(true);
      this.#chassis.add(container);
      let suspension: THREE.Object3D | null = null;
      let cylinder: THREE.Object3D | null = null;
      let painted: THREE.Mesh | null = null;
      container.traverse((child) => {
        if (child.name.startsWith('wheelSuspension')) suspension = child;
        if (child.name.startsWith('wheelCylinder')) cylinder = child;
        if (child.name.startsWith('wheelPainted') && child instanceof THREE.Mesh) painted = child;
      });
      if (!cylinder) throw new Error('Wheel cylinder is missing');
      const wheelCylinder: THREE.Object3D = cylinder;
      wheelCylinder.position.set(0, 0, 0);
      if (MIRRORED_WHEELS.has(index)) container.rotation.y = Math.PI;
      return {
        container,
        cylinder: wheelCylinder,
        suspension,
        painted,
        groundTrack: game.tracks.add(new Track(0.5, 'r')),
      };
    });
  }

  #bindBlinkers(): BlinkerCallbacks | null {
    const left = this.#part('blinkerLeft');
    const right = this.#part('blinkerRight');
    if (!left || !right) return null;

    const { inputs } = getGame();
    const isHeld = (name: string): boolean => inputs.actions.get(name)?.active ?? false;
    let isRunning = false;
    let isOn = false;
    const render = (): void => {
      left.visible = isHeld('left') ? isOn : false;
      right.visible = isHeld('right') ? isOn : false;
    };
    const blink = (): void => {
      isOn = !isOn;
      render();
      if (!isHeld('left') && !isHeld('right') && !isOn) isRunning = false;
      else gsap.delayedCall(BLINK_INTERVAL, blink);
    };
    const start = (action: { active: boolean }): void => {
      if (!action.active || isRunning) return;
      isRunning = true;
      isOn = true;
      render();
      gsap.delayedCall(BLINK_INTERVAL, blink);
    };
    inputs.events.on('left', start);
    inputs.events.on('right', start);
    return { left: start, right: start };
  }

  #createAntenna(): Antenna | null {
    const object = this.#part('antenna');
    if (!object) return null;
    const game = getGame();
    const head = game.model('vehicle').scene.getObjectByName('antennaHead');
    const headAxle = head?.children[0];
    const headReference = object.getObjectByName('antennaHeadReference');
    if (!head || !headAxle || !headReference) throw new Error('Antenna parts are missing');
    game.materials.updateObject(head);
    game.scene.add(head);
    return { object, head, headAxle, headReference };
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

  #createPaints(): Partial<Record<PaintName, THREE.Material>> {
    const { materials } = getGame();
    const red = materials.get('redGradient');
    const orange = materials.createGradient('orangeGradient', '#ff940d', '#af0071');
    const white = materials.createGradient('whiteGradient', '#ffffff', '#b5b5b5');
    const black = materials.createGradient('blackGradient', '#626262', '#262526');
    const isIsland = this.#model.name === 'islandBoxySUV';
    return {
      red,
      orange,
      white,
      black: isIsland ? materials.createGradient('islandGraphite', '#434b53', '#171c23') : black,
      flames: this.#flamesPaint(red),
      abyssal: this.#abyssalPaint(),
    };
  }

  #flamesPaint(red: THREE.Material): THREE.Material | undefined {
    if (!(red instanceof MeshDefaultMaterial)) return undefined;
    const material = red.clone();
    const { ticker, noises } = getGame();
    const baseOutput = red.shadedOutput;
    const colorA = uniform(color('#ff9c20'));
    const colorB = uniform(color('#ff0000'));
    const emissiveStrength = uniform(7.75);
    material.outputNode = Fn(() => {
      const flameUv = uv(1).toVar();
      const uv3 = flameUv.sub(vec2(0, ticker.elapsedScaledUniform.mul(-0.075))).mul(vec2(0.96 * 1.3, 0.35 * 1.3));
      const uv4 = flameUv.sub(vec2(0, ticker.elapsedScaledUniform.mul(-0.041))).mul(vec2(1.28 * 1.3, 0.75 * 1.3));
      const noise = min(texture(noises.voronoi, uv3).r, texture(noises.voronoi, uv4).r);
      const flameMix = noise.step(flameUv.y.oneMinus());
      const flameColor = mix(colorA, colorB, flameUv.y).mul(emissiveStrength);
      baseOutput.rgb.assign(mix(baseOutput.rgb, flameColor, flameMix));
      return baseOutput;
    })();
    return material;
  }

  #abyssalPaint(): THREE.Material {
    const game = getGame();
    const stars = game.texture('behindTheSceneStarsTexture');
    const fresnelColor = uniform(color('#6053ff'));
    const fresnelIntensity = uniform(30);
    const starsIntensity = uniform(10);
    const outputNode = Fn(() => {
      const starsColor = texture(stars, screenCoordinate.div(256).fract()).rgb.pow(2).mul(starsIntensity);
      const viewDirection = positionWorld.sub(cameraPosition).normalize();
      const fresnel = viewDirection.dot(normalWorld).remapClamp(-0.2, -0.4, 1, 0);
      const finalColor = mix(starsColor, fresnelColor.mul(fresnelIntensity), fresnel).toVar();
      finalColor.assign(revealNode(finalColor));
      return vec4(finalColor, 1);
    })();
    const material = new THREE.MeshBasicNodeMaterial({ wireframe: false });
    material.outputNode = outputNode;
    return material;
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
    this.#updateWheels();
    this.#mainGroundTrack.update(vehicle.position, vehicle.position.y < MAIN_TRACK_MAX_ELEVATION);
    this.#updateAntenna();
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

  #updateWheels(): void {
    const { physicalVehicle: vehicle, inputs, ticker } = getGame();
    const wheelsRotation = (vehicle.forwardSpeed / vehicle.wheels.settings.radius) * WHEEL_ROTATION_SCALE;
    const isActive = (name: string): boolean => inputs.actions.get(name)?.active ?? false;
    const isRolling = !isActive('brake') || isActive('forward') || isActive('backward');

    for (const [index, wheel] of this.#wheels.entries()) {
      const physicalWheel = vehicle.wheels.items[index];
      if (!physicalWheel) continue;
      if (isRolling) wheel.cylinder.rotation.z += MIRRORED_WHEELS.has(index) ? wheelsRotation : -wheelsRotation;
      if (index === 0) wheel.container.rotation.y = Math.PI + this.#steering;
      if (index === 1) wheel.container.rotation.y = this.#steering;

      const wheelY = Math.min(physicalWheel.basePosition.y - (physicalWheel.suspensionLength ?? 0), WHEEL_MAX_Y);
      wheel.container.position.x = physicalWheel.basePosition.x;
      wheel.container.position.y += (wheelY - wheel.container.position.y) * WHEEL_EASING * ticker.deltaScaled;
      wheel.container.position.z = physicalWheel.basePosition.z;
      if (wheel.suspension) wheel.suspension.scale.y = Math.abs(wheel.container.position.y) - 0.5;
      if (physicalWheel.contactPoint) {
        wheel.groundTrack.update(new THREE.Vector3().copy(physicalWheel.contactPoint), physicalWheel.inContact);
      }
    }
  }

  #updateAntenna(): void {
    if (!this.#antenna) return;
    const { physicalVehicle: vehicle, ticker } = getGame();
    const { object, head, headAxle, headReference } = this.#antenna;
    const angle = Math.atan2(ANTENNA_TARGET.x - vehicle.position.x, ANTENNA_TARGET.z - vehicle.position.z);
    object.rotation.y = angle - this.#chassis.rotation.y;
    headReference.getWorldPosition(head.position);
    head.lookAt(ANTENNA_TARGET);
    const speed = remapClamp(ANTENNA_TARGET.distanceTo(vehicle.position), [50, 5], [1, 10]);
    headAxle.rotation.z += ticker.deltaScaled * speed;
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
