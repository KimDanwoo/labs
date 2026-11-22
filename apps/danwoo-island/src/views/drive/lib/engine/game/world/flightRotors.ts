import gsap from 'gsap';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { clamp, lerp } from '@views/drive/lib/engine/game/utilities/maths';
import { islandMaterial, type PartName } from '@views/drive/lib/engine/game/world/islandMaterials';
import { Deployment, smooth, type Stage, staged } from '@views/drive/lib/engine/game/world/vehicleDeployment';
import type { VisualWheel } from '@views/drive/lib/engine/game/world/visualVehicleParts';

const MOUNT = { x: 1.7, y: 0.6, z: 1.65 } as const;
const ARM_ROOT = { x: 0.95, y: -0.15, z: 0.75 } as const;
const ARM = { width: 0.1, height: 0.08 } as const;
const POD_SCALE = 0.38;
const GUARD = { radius: 0.72, tube: 0.028, trim: 0.014, trimLift: 0.03, lift: 0.12, segments: 40 } as const;
const SPOKE = { count: 3, width: 0.03, inner: 0.1 } as const;
const HUB = { radius: 0.045, height: 0.16, lift: 0.14, segments: 10 } as const;
const BLADE = { length: 1.32, thickness: 0.02, chord: 0.1, tip: 0.16, lift: 0.23 } as const;
const BLUR = { radius: 0.66, segments: 32, color: '#FFF1D6', idle: 0.18, full: 0.32 } as const;
const SPIN = { idle: 22, full: 32, boostRatio: 1.2, easing: 4 } as const;
const HIDDEN_SCALE = 0.01;
const FLAT = Math.PI / 2;
const FULL_TURN = Math.PI * 2;
const ARM_AXIS = new THREE.Vector3(0, 0, 1);
const DEPLOY = { duration: 1.6, ease: 'none' } as const;
const STAGE = {
  reach: [0, 0.35],
  fold: [0.15, 0.45],
  shrink: [0.3, 0.55],
  guard: [0.48, 0.7],
  hub: [0.55, 0.72],
  blades: [0.62, 0.86],
  spin: [0.7, 1],
} as const satisfies Record<string, Stage>;
const SOUND = {
  deploy: { path: 'sounds/mecanism/assemble.mp3', volume: 0.45 },
  rush: { path: 'sounds/swoosh/Swoosh 02.mp3', volume: 0.35 },
  stow: { path: 'sounds/mecanism/slide.mp3', volume: 0.3 },
} as const;

const popped = gsap.parseEase('back.out(2.2)');
const flipped = gsap.parseEase('back.out(2.6)');

type Shape = 'arm' | 'ring' | 'trim' | 'spokes' | 'hub' | 'blades' | 'tips' | 'blur';

function merged(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const geometry = mergeGeometries(parts);
  if (!geometry) throw new Error('로터 형상을 합치지 못했어요.');
  return geometry;
}

function spokes(): THREE.BufferGeometry {
  const length = GUARD.radius - SPOKE.inner;
  return merged(
    Array.from({ length: SPOKE.count }, (_, index) =>
      new THREE.BoxGeometry(length, SPOKE.width, SPOKE.width)
        .translate(SPOKE.inner + length / 2, GUARD.lift, 0)
        .rotateY((index / SPOKE.count) * FULL_TURN),
    ),
  );
}

function propeller(): Pick<Record<Shape, THREE.BufferGeometry>, 'blades' | 'tips'> {
  const reach = (BLADE.length - BLADE.tip) / 2;
  const blades = new THREE.BoxGeometry(BLADE.length - BLADE.tip * 2, BLADE.thickness, BLADE.chord);
  const tips = merged(
    [-1, 1].map((end) => new THREE.BoxGeometry(BLADE.tip, BLADE.thickness, BLADE.chord).translate(end * reach, 0, 0)),
  );
  return { blades, tips };
}

function shapes(): Record<Shape, THREE.BufferGeometry> {
  const ring = new THREE.TorusGeometry(GUARD.radius, GUARD.tube, GUARD.segments / 4, GUARD.segments);
  const trim = new THREE.TorusGeometry(GUARD.radius, GUARD.trim, GUARD.segments / 4, GUARD.segments);
  return {
    arm: new THREE.BoxGeometry(ARM.width, ARM.height, 1).translate(0, 0, 1 / 2),
    ring: ring.rotateX(FLAT).translate(0, GUARD.lift, 0),
    trim: trim.rotateX(FLAT).translate(0, GUARD.lift + GUARD.trimLift, 0),
    spokes: spokes(),
    hub: new THREE.CylinderGeometry(HUB.radius, HUB.radius, HUB.height, HUB.segments).translate(0, HUB.lift, 0),
    blur: new THREE.CircleGeometry(BLUR.radius, BLUR.segments).rotateX(-FLAT),
    ...propeller(),
  };
}

interface Rotor {
  readonly wheel: VisualWheel;
  readonly direction: number;
  readonly root: THREE.Group;
  readonly arm: THREE.Mesh;
  readonly guard: THREE.Group;
  readonly hub: THREE.Mesh;
  readonly blades: THREE.Group;
}

export class FlightRotors {
  readonly #rotors: Rotor[];
  readonly #geometries: THREE.BufferGeometry[];
  readonly #deployment = new Deployment(DEPLOY);
  readonly #sounds: Record<keyof typeof SOUND, { play: () => void }>;
  readonly #blurAlpha = uniform(0);
  readonly #blurMaterial: MeshDefaultMaterial;
  readonly #armRoot = new THREE.Vector3();
  readonly #armDirection = new THREE.Vector3();
  #spin = 0;

  constructor(wheels: readonly VisualWheel[], chassis: THREE.Object3D) {
    const { audio } = getGame();
    const sound = (name: keyof typeof SOUND): { play: () => void } =>
      audio.register({ ...SOUND[name], autoplay: false, loop: false });
    this.#sounds = { deploy: sound('deploy'), rush: sound('rush'), stow: sound('stow') };
    this.#blurMaterial = new MeshDefaultMaterial({
      colorNode: uniform(new THREE.Color(BLUR.color)).rgb,
      alphaNode: this.#blurAlpha,
      transparent: true,
      depthWrite: false,
      hasDropShadows: false,
    });
    const geometries = shapes();
    this.#geometries = Object.values(geometries);
    this.#rotors = wheels.map((wheel) => this.#build(wheel, chassis, geometries));
    this.#pose(0);
  }

  update(): void {
    const isFlying = getGame().physicalVehicle.flight.isActive;
    if (this.#deployment.follow(isFlying)) this.#announce(isFlying);
    this.#pose(this.#deployment.progress);
  }

  dispose(): void {
    for (const geometry of this.#geometries) geometry.dispose();
    for (const { root } of this.#rotors) root.removeFromParent();
    this.#blurMaterial.dispose();
  }

  #mesh(geometry: THREE.BufferGeometry, material: PartName): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, islandMaterial(material));
    mesh.castShadow = true;
    return mesh;
  }

  #build(wheel: VisualWheel, chassis: THREE.Object3D, geometries: Record<Shape, THREE.BufferGeometry>): Rotor {
    const { position } = wheel.container;
    const arm = this.#mesh(geometries.arm, 'bunting4');
    const guard = new THREE.Group().add(
      this.#mesh(geometries.ring, 'lagoon'),
      this.#mesh(geometries.trim, 'bunting2'),
      this.#mesh(geometries.spokes, 'iron'),
    );
    const hub = this.#mesh(geometries.hub, 'iron');
    const blades = new THREE.Group().add(
      this.#mesh(geometries.blades, 'bunting4'),
      this.#mesh(geometries.tips, 'bunting2'),
      new THREE.Mesh(geometries.blur, this.#blurMaterial),
    );
    blades.position.y = BLADE.lift;
    const root = new THREE.Group().add(arm, guard, hub, blades);
    chassis.add(root);
    return { wheel, direction: Math.sign(position.x * position.z), root, arm, guard, hub, blades };
  }

  #announce(isFlying: boolean): void {
    if (!isFlying) {
      this.#sounds.stow.play();
      return;
    }
    this.#sounds.deploy.play();
    this.#sounds.rush.play();
  }

  #effort(): number {
    const { player, inputs } = getGame();
    const isClimbing = inputs.actions.get('suspensions')?.active ?? false;
    return clamp(Math.max(Math.abs(player.accelerating), Number(isClimbing)), 0, 1);
  }

  #updateSpin(progress: number): number {
    const { player, ticker } = getGame();
    const effort = this.#effort();
    const spinUp = staged(progress, STAGE.spin);
    const target = lerp(SPIN.idle, SPIN.full, effort) * lerp(1, SPIN.boostRatio, player.boosting);
    this.#spin += (target - this.#spin) * clamp(ticker.deltaScaled * SPIN.easing, 0, 1);
    this.#blurAlpha.value = lerp(BLUR.idle, BLUR.full, effort) * spinUp;
    return this.#spin * spinUp * ticker.deltaScaled;
  }

  #pose(progress: number): void {
    const isShown = progress > 0;
    const stages = {
      reach: smooth(staged(progress, STAGE.reach)),
      fold: smooth(staged(progress, STAGE.fold)),
      shrink: smooth(staged(progress, STAGE.shrink)),
      guard: Math.max(HIDDEN_SCALE, popped(staged(progress, STAGE.guard))),
      hub: Math.max(HIDDEN_SCALE, popped(staged(progress, STAGE.hub))),
      blades: Math.max(HIDDEN_SCALE, flipped(staged(progress, STAGE.blades))),
      turn: isShown ? this.#updateSpin(progress) : 0,
    };
    for (const rotor of this.#rotors) {
      rotor.root.visible = isShown;
      rotor.wheel.container.scale.setScalar(lerp(1, POD_SCALE, stages.shrink));
      if (!isShown) continue;
      this.#mount(rotor, stages);
    }
  }

  #mount(rotor: Rotor, stages: Record<'reach' | 'fold' | 'guard' | 'hub' | 'blades' | 'turn', number>): void {
    const { container, suspension } = rotor.wheel;
    const { position, rotation } = container;
    const front = Math.sign(position.x);
    const side = Math.sign(position.z);
    position.x += front * (MOUNT.x - Math.abs(position.x)) * stages.reach;
    position.y += (MOUNT.y - position.y) * stages.reach;
    position.z += side * (MOUNT.z - Math.abs(position.z)) * stages.reach;
    rotation.x = side * FLAT * Math.max(Math.abs(rotation.x) / FLAT, stages.fold);
    if (suspension) suspension.visible = false;

    rotor.root.position.copy(position);
    this.#armRoot.set(front * ARM_ROOT.x, ARM_ROOT.y, side * ARM_ROOT.z).sub(position);
    this.#armDirection.copy(this.#armRoot).negate();
    const length = Math.max(HIDDEN_SCALE, this.#armDirection.length());
    rotor.arm.position.copy(this.#armRoot);
    rotor.arm.quaternion.setFromUnitVectors(ARM_AXIS, this.#armDirection.divideScalar(length));
    rotor.arm.scale.z = length;
    rotor.guard.scale.setScalar(stages.guard);
    rotor.hub.scale.setScalar(stages.hub);
    rotor.blades.scale.setScalar(stages.blades);
    rotor.blades.rotation.y += rotor.direction * stages.turn;
  }
}
