import gsap from 'gsap';
import { alea } from 'seedrandom';
import {
  attribute,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  color,
  cross,
  float,
  floor,
  Fn,
  instancedArray,
  luminance,
  min,
  mix,
  modelWorldMatrix,
  mul,
  positionGeometry,
  positionWorld,
  step,
  uniform,
  varying,
  vec3,
  vec4,
  vertexIndex,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { type AudioItem, moveSoundTo } from '../audio';
import { getGame } from '../gameContext';
import { LineGeometry } from '../geometries/lineGeometry';
import { TICK_ORDER } from '../tickOrder';
import { remapClamp } from '../utilities/maths';

type Random = () => number;
type FloatUniform = THREE.UniformNode<'float', number>;

const rng = alea('lightning');
const NEAR_THUNDER = [
  'sounds/thunder/near/THUNDER_GEN-HDF-23300.mp3',
  'sounds/thunder/near/Lightning-Streak-with-Thunder-Crash_TTX028903.mp3',
  'sounds/thunder/near/ThunderSharpStrikingRumblingCrackling_JMDKp_04.mp3',
] as const;
const DISTANT_THUNDER = [
  'sounds/thunder/distant/Thunder32GentleCr SIG014001.mp3',
  'sounds/thunder/distant/Thunder44LowRippl SIG015201.mp3',
] as const;
const ANTICIPATION = { count: 32, duration: 5, scale: 0.07, elevation: 1.5, radius: 3 } as const;
const ARC = { duration: 3, points: 15, height: 15, thickness: 0.1, easeOut: 5, drift: 1, colorReach: 8 } as const;
const EXPLOSION = { count: 128, duration: 4, fall: 1, scale: 0.1, radius: 3, easeOut: 8, colorReach: 4 } as const;
const STRIKE_EXPLOSION = { radius: 7, strength: 4, isVehicleOnly: true } as const;
const DISTANT_SEED_OFFSET = 999;
const RENDER_ORDER = 2;

function pick<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

function anticipationData(): { positions: Float32Array; scales: Float32Array } {
  const positions = new Float32Array(ANTICIPATION.count * 3);
  const scales = new Float32Array(ANTICIPATION.count);
  for (let index = 0; index < ANTICIPATION.count; index += 1) {
    const angle = Math.PI * 2 * rng();
    const radius = rng() * ANTICIPATION.radius;
    positions.set([Math.sin(angle) * radius, -rng(), Math.cos(angle) * radius], index * 3);
    scales[index] = rng() * 0.75 + 0.25;
  }
  return { positions, scales };
}

function arcPoints(): THREE.Vector3[] {
  const step = ARC.height / (ARC.points - 1);
  return Array.from(
    { length: ARC.points },
    (_, index) => new THREE.Vector3((rng() - 0.5) * 1, index * step, (rng() - 0.5) * 1),
  );
}

function explosionData(): { positions: Float32Array; scales: Float32Array } {
  const positions = new Float32Array(EXPLOSION.count * 3);
  const scales = new Float32Array(EXPLOSION.count);
  for (let index = 0; index < EXPLOSION.count; index += 1) {
    const spherical = new THREE.Spherical(rng(), rng() * 0.5 * Math.PI, rng() * Math.PI * 2);
    new THREE.Vector3().setFromSpherical(spherical).toArray(positions, index * 3);
    scales[index] = rng() * 0.75 + 0.25;
  }
  return { positions, scales };
}

export class Lightnings {
  readonly #group = new THREE.Group();
  readonly #colorA = uniform(color('#ff4c00'));
  readonly #colorB = uniform(color('#5180ff'));
  readonly #intensity = uniform(3);
  readonly #near: AudioItem[];
  readonly #distant: AudioItem[];
  readonly #anticipation: { position: THREE.Node<'vec3'>; scale: THREE.Node<'float'> };
  readonly #arcGeometry: LineGeometry;
  readonly #explosion: { position: THREE.Node<'vec3'>; scale: THREE.Node<'float'> };
  readonly #anticipationGeometry = new THREE.PlaneGeometry(1, 1);
  readonly #explosionGeometry = new THREE.PlaneGeometry();
  #currentSecond = Math.floor(Date.now() / 1000);

  constructor() {
    const game = getGame();
    game.scene.add(this.#group);
    this.#near = this.#registerNearThunder();
    this.#distant = DISTANT_THUNDER.map((path) =>
      game.audio.register({
        path,
        autoplay: false,
        loop: false,
        volume: 0.4,
        antiSpam: 7,
        onPlay: (item) => {
          item.volume = 1 + Math.random() * 0.3;
          item.rate = 1 + Math.random() * 0.3;
        },
      }),
    );
    const anticipation = anticipationData();
    this.#anticipation = {
      position: instancedArray(anticipation.positions, 'vec3').toAttribute(),
      scale: instancedArray(anticipation.scales, 'float').toAttribute(),
    };
    this.#arcGeometry = new LineGeometry(arcPoints());
    const explosion = explosionData();
    this.#explosion = {
      position: instancedArray(explosion.positions, 'vec3').toAttribute(),
      scale: instancedArray(explosion.scales, 'float').toAttribute(),
    };
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.lightnings);
  }

  #registerNearThunder(): AudioItem[] {
    const { audio, player } = getGame();
    return NEAR_THUNDER.map((path) =>
      audio.register({
        path,
        autoplay: false,
        loop: false,
        volume: 1,
        antiSpam: 0.2,
        positions: new THREE.Vector3(),
        onPlay: (item, coordinates) => {
          if (!(coordinates instanceof THREE.Vector3)) return;
          const distance = Math.hypot(coordinates.x - player.position2.x, coordinates.z - player.position2.y);
          moveSoundTo(item, coordinates);
          item.rate = 1.3 + Math.random() * 0.1 + remapClamp(distance, [0, 20], [0, -0.3]);
        },
      }),
    );
  }

  #emissive(coordinates: THREE.Vector3, reach: number): THREE.Node<'vec3'> {
    const strength = positionWorld
      .sub(vec3(coordinates.x, coordinates.y, coordinates.z))
      .length()
      .div(reach)
      .min(1);
    const mixed = mix(this.#colorA, this.#colorB, strength);
    return mixed.div(luminance(mixed)).mul(this.#intensity);
  }

  #createAnticipation(coordinates: THREE.Vector3, random: Random): THREE.Mesh {
    const { ticker } = getGame();
    const startTime = uniform(ticker.elapsedScaled);
    const { position: positionAttribute, scale: scaleAttribute } = this.#anticipation;
    const finalPosition = varying(vec3());
    const localTime = ticker.elapsedScaledUniform.sub(startTime);

    const material = new THREE.SpriteNodeMaterial({ transparent: true });
    material.colorNode = this.#colorB.div(luminance(this.#colorB)).mul(this.#intensity);
    material.positionNode = Fn(() => {
      finalPosition.assign(positionAttribute);
      const timeProgress = min(localTime.div(ANTICIPATION.duration), 1);
      finalPosition.y.addAssign(timeProgress.mul(uniform(ANTICIPATION.elevation)));
      return finalPosition;
    })();
    material.scaleNode = Fn(() => {
      const duration = float(ANTICIPATION.duration);
      const timeScale = localTime.remapClamp(duration.mul(0.5), duration, 1, 0);
      const elevationScale = finalPosition.y.remapClamp(0, 0.2, 0, 1);
      return scaleAttribute.mul(uniform(ANTICIPATION.scale)).mul(timeScale).mul(elevationScale);
    })();

    const mesh = new THREE.Mesh(this.#anticipationGeometry, material);
    mesh.position.copy(coordinates);
    mesh.rotation.y = random() * Math.PI * 2;
    mesh.count = ANTICIPATION.count;
    mesh.renderOrder = RENDER_ORDER;
    this.#group.add(mesh);
    return mesh;
  }

  #arcVertex(startTime: FloatUniform): THREE.Node<'vec4'> {
    const { ticker } = getGame();
    return Fn(() => {
      const ratio = attribute('ratio', 'float');
      const tipness = step(ratio, 0.01);
      const timeProgress = min(ticker.elapsedScaledUniform.sub(startTime).div(ARC.duration), 1);
      const newPosition = positionGeometry.toVar();
      newPosition.xz.mulAssign(
        timeProgress
          .oneMinus()
          .pow(uniform(ARC.easeOut))
          .oneMinus()
          .mul(tipness.oneMinus())
          .mul(uniform(ARC.drift))
          .add(1),
      );
      const worldPosition = modelWorldMatrix.mul(vec4(newPosition, 1));
      const toCamera = worldPosition.xyz.sub(cameraPosition).normalize();
      const nextWorldPosition = modelWorldMatrix.mul(vec4(positionGeometry.add(attribute('direction', 'vec3')), 1));
      const nextDelta = nextWorldPosition.xyz.sub(worldPosition.xyz).normalize();
      const tangent = cross(nextDelta, toCamera).normalize();
      const finalThickness = mul(uniform(ARC.thickness), ratio.mul(10).min(1), timeProgress.oneMinus());
      const sideStep = floor(vertexIndex.toFloat().mul(3).sub(2).div(3).mod(2)).sub(0.5);
      worldPosition.addAssign(vec4(tangent.mul(sideStep.mul(finalThickness)), 0));
      return cameraProjectionMatrix.mul(cameraViewMatrix.mul(worldPosition));
    })();
  }

  #createArc(coordinates: THREE.Vector3, random: Random): THREE.Mesh {
    const startTime = uniform(getGame().ticker.elapsedScaled);
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true });
    material.colorNode = this.#emissive(coordinates, ARC.colorReach);
    material.fog = false;
    material.vertexNode = this.#arcVertex(startTime);

    const mesh = new THREE.Mesh(this.#arcGeometry, material);
    mesh.position.copy(coordinates);
    mesh.rotation.y = random() * Math.PI * 2;
    mesh.renderOrder = RENDER_ORDER;
    this.#group.add(mesh);
    return mesh;
  }

  #createExplosion(coordinates: THREE.Vector3, random: Random): THREE.Mesh {
    const { ticker } = getGame();
    const startTime = uniform(ticker.elapsedScaled);
    const { position: positionAttribute, scale: scaleAttribute } = this.#explosion;
    const localTime = ticker.elapsedScaledUniform.sub(startTime);

    const material = new THREE.SpriteNodeMaterial({ transparent: true });
    material.colorNode = this.#emissive(coordinates, EXPLOSION.colorReach);
    material.fog = false;
    material.positionNode = Fn(() => {
      const timeProgress = min(localTime.div(float(EXPLOSION.duration).mul(0.75)), 1);
      const newPosition = positionAttribute.toVar();
      newPosition.mulAssign(
        timeProgress.oneMinus().pow(uniform(EXPLOSION.easeOut)).oneMinus().mul(uniform(EXPLOSION.radius)),
      );
      return newPosition;
    })();
    material.scaleNode = Fn(() => {
      const timeScale = localTime.div(EXPLOSION.duration).oneMinus().max(0);
      return scaleAttribute.mul(uniform(EXPLOSION.scale)).mul(timeScale);
    })();

    const mesh = new THREE.Mesh(this.#explosionGeometry, material);
    mesh.position.copy(coordinates);
    mesh.count = EXPLOSION.count;
    mesh.rotation.y = random() * Math.PI * 2;
    mesh.renderOrder = RENDER_ORDER;
    this.#group.add(mesh);
    gsap.to(mesh.position, { y: -EXPLOSION.fall, duration: EXPLOSION.duration });
    return mesh;
  }

  createRandom(random: Random): void {
    const { focusPoint, optimalArea } = getGame().view;
    const offset = (): number => (random() - 0.5) * optimalArea.radius * 1;
    const x = focusPoint.position.x + offset();
    const z = focusPoint.position.z + offset();
    this.create(new THREE.Vector3(x, 0, z), random);
  }

  create(coordinates: THREE.Vector3, random: Random): void {
    const disposables: THREE.Mesh[] = [this.#createAnticipation(coordinates, random)];
    gsap.delayedCall(ANTICIPATION.duration, () => {
      pick(this.#near)?.play(coordinates);
      getGame().explosions.explode(coordinates, STRIKE_EXPLOSION);
      disposables.push(this.#createArc(coordinates, random), this.#createExplosion(coordinates, random));
      gsap.delayedCall(Math.max(ARC.duration, EXPLOSION.duration), () => {
        for (const mesh of disposables) {
          mesh.removeFromParent();
          if (mesh.material instanceof THREE.Material) mesh.material.dispose();
        }
      });
    });
  }

  update(): void {
    const second = Math.floor(Date.now() / 1000);
    if (second === this.#currentSecond) return;
    this.#currentSecond = second;

    const { weather } = getGame();
    const hitChances =
      Math.max(0, weather.clouds.value) * Math.max(0, weather.electricField.value) * weather.humidity.value;
    const strike = alea(String(second));
    if (strike() < hitChances) {
      this.createRandom(strike);
      return;
    }
    if (alea(String(second + DISTANT_SEED_OFFSET))() < hitChances) pick(this.#distant)?.play();
  }
}
