import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { getGame } from '../../gameContext';
import { timeToRaceString } from '../../utilities/time';

const DIGITS = { height: 32, ratio: 6 } as const;
const DIGITS_WIDTH = DIGITS.height * DIGITS.ratio;
const DIGITS_FONT = `700 ${DIGITS.height}px "MaruBuri"`;
const ZERO_TIME = '00:00:000';
const ELEVATION = 2.5;
const TILT = Math.PI * 0.1;
const MESH_SCALE = 0.5;
const FOLLOW_EASING = 5;
const HIDE_TWEEN = { duration: 1, ease: 'back.in(2)' } as const;

function digitsContext(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = DIGITS_WIDTH;
  canvas.height = DIGITS.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  context.font = DIGITS_FONT;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  return context;
}

export class CircuitTimer {
  readonly #game = getGame();
  readonly #group: THREE.Object3D;
  readonly #context = digitsContext();
  readonly #texture: THREE.Texture;
  #startTime = 0;
  #isRunning = false;
  readonly homePosition: THREE.Vector3;
  elapsedTime = 0;

  constructor(group: THREE.Object3D) {
    this.#group = group;
    this.homePosition = group.position.clone();
    group.rotation.y = TILT;
    group.visible = false;
    this.#paint(ZERO_TIME);

    this.#texture = new THREE.Texture(this.#context.canvas);
    this.#texture.minFilter = THREE.LinearFilter;
    this.#texture.magFilter = THREE.LinearFilter;
    this.#texture.generateMipmaps = false;
    const material = new THREE.MeshBasicNodeMaterial({ alphaMap: this.#texture, alphaTest: 0.5 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(DIGITS.ratio, 1), material);
    mesh.scale.setScalar(MESH_SCALE);
    group.add(mesh);
  }

  #paint(text: string): void {
    const context = this.#context;
    context.fillStyle = '#000000';
    context.fillRect(0, 0, DIGITS_WIDTH, DIGITS.height);
    context.fillStyle = '#ffffff';
    context.fillText(text, DIGITS_WIDTH * 0.5, DIGITS.height * 0.5);
  }

  #write(text: string): void {
    this.#paint(text);
    this.#texture.needsUpdate = true;
  }

  show(): void {
    this.#write(ZERO_TIME);
    this.#group.position.copy(this.#game.player.position);
    this.#group.position.y = ELEVATION;
    this.#group.scale.setScalar(1);
    this.#group.visible = true;
  }

  hide(): void {
    const value = { scale: 1 };
    gsap.to(value, { scale: 0, ...HIDE_TWEEN, onUpdate: () => this.#group.scale.setScalar(value.scale) });
  }

  start(): void {
    this.#isRunning = true;
    this.#startTime = this.#game.ticker.elapsed;
  }

  end(): string {
    this.#isRunning = false;
    this.elapsedTime = this.#game.ticker.elapsed - this.#startTime;
    const time = timeToRaceString(this.elapsedTime);
    this.#write(time);
    return time;
  }

  update(target: THREE.Vector3): void {
    const { ticker } = this.#game;
    this.#group.position.lerp(new THREE.Vector3(target.x, ELEVATION, target.z), ticker.deltaScaled * FOLLOW_EASING);
    if (!this.#isRunning) return;
    this.elapsedTime = ticker.elapsed - this.#startTime;
    this.#write(timeToRaceString(this.elapsedTime));
  }
}
