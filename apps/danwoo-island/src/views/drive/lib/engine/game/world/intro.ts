import gsap from 'gsap';
import { atan, color, Fn, positionGeometry, texture, TWO_PI, uniform, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { setStartupStage, STARTUP } from '../../islandStartup';
import { getGame } from '../gameContext';
import { INPUT_MODE } from '../inputs/inputs';
import { introCenter } from '../introCenter';
import { QUALITY } from '../quality';
import type { Intersect } from '../rayCursor';
import { isTideLoading, TIDE_LABEL, tideRingGeometry, tideRingMaterial } from './tideLoading';

interface LabelLayout {
  offsetX: number;
  offsetZ: number;
  rotationX: number;
}

const LABEL_TINT = isTideLoading ? TIDE_LABEL : '#ffffff';
const LABEL_HEIGHT = 3.3;
const LABEL_YAW = 0.4;
const LABEL_HIDDEN_SCALE = 0.01;
const HIGH_QUALITY_LAYOUT: LabelLayout = { offsetX: 6.5, offsetZ: 6.5, rotationX: -0.25 };
const LOW_QUALITY_LAYOUT: LabelLayout = { offsetX: 1.4, offsetZ: -5.8, rotationX: -0.4 };
const PORTRAIT_LAYOUT: LabelLayout = { offsetX: 7.2, offsetZ: 7.2, rotationX: -0.4 };
const RING = { radius: 3.5, thickness: 0.04, segments: 128, elevation: 0.001, smoothing: 10 } as const;
const TICK_ORDER = 8;

const TEXT_SCALE = 1.3;
const TEXT_CANVAS = { width: 1024, height: 512, maxWidth: 960 } as const;
const PROMPT_LINE = { font: '700 152px MaruBuri', y: 150 } as const;
const START_LINE = { font: '700 224px MaruBuri', y: 355, text: '출발' } as const;

const SOUND_BUTTON = { scale: 0.5, aspect: 50 / 38, x: 0.38, y: -1, hitRadius: 0.5, hoverIntensity: 1.5 } as const;
const SOUND_MUTED_OFFSET = 0.5;

function startPrompt(): string {
  const { inputs } = getGame();
  if (inputs.mode === INPUT_MODE.gamepad) return inputs.gamepad.type === 'xbox' ? 'A 버튼으로' : '× 버튼으로';
  const isTouch = inputs.mode === INPUT_MODE.touch || window.matchMedia('(pointer: coarse)').matches;
  return isTouch ? '터치해서' : '클릭해서';
}

function drawPrompt(prompt: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXT_CANVAS.width;
  canvas.height = TEXT_CANVAS.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('출발 안내를 그릴 수 없습니다.');
  context.fillStyle = '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const centerX = canvas.width / 2;
  context.font = PROMPT_LINE.font;
  context.fillText(prompt, centerX, PROMPT_LINE.y, TEXT_CANVAS.maxWidth);
  context.font = START_LINE.font;
  context.fillText(START_LINE.text, centerX, START_LINE.y, TEXT_CANVAS.maxWidth);
  return new THREE.CanvasTexture(canvas);
}

interface ScaleTween extends gsap.TweenVars {
  from: number;
  to: number;
}

function tweenScale(object: THREE.Object3D, { from, to, ...vars }: ScaleTween): void {
  const scale = { value: from };
  gsap.to(scale, {
    ...vars,
    value: to,
    overwrite: true,
    onUpdate: () => object.scale.setScalar(scale.value),
  });
}

function glowRingMaterial(progress: THREE.Node<'float'>): THREE.MeshBasicNodeMaterial {
  const { reveal } = getGame();
  const material = new THREE.MeshBasicNodeMaterial();
  material.outputNode = Fn(() => {
    const angleProgress = atan(positionGeometry.y, positionGeometry.x).div(TWO_PI).add(0.5).oneMinus();
    progress.lessThan(angleProgress).discard();
    return vec4(reveal.color.mul(reveal.intensity), 1);
  })();
  return material;
}

class PromptText {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicNodeMaterial>;
  readonly #textures = new Map<string, THREE.CanvasTexture>();
  readonly #refresh = (): void => this.#update();

  constructor() {
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2 * TEXT_SCALE, TEXT_SCALE), material);
    this.#update();
    const { inputs } = getGame();
    inputs.gamepad.events.on('typeChange', this.#refresh);
    inputs.modeEvents.on('change', this.#refresh);
  }

  #update(): void {
    const prompt = startPrompt();
    const labelTexture = this.#textures.get(prompt) ?? drawPrompt(prompt);
    this.#textures.set(prompt, labelTexture);
    this.mesh.material.outputNode = Fn(() => vec4(color(LABEL_TINT), texture(labelTexture, uv()).r))();
    this.mesh.material.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    for (const labelTexture of this.#textures.values()) labelTexture.dispose();
    const { inputs } = getGame();
    inputs.gamepad.events.off('typeChange', this.#refresh);
    inputs.modeEvents.off('change', this.#refresh);
  }
}

class SoundButton {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicNodeMaterial>;
  readonly intersect: Intersect;
  readonly #texture: THREE.Texture;
  readonly #syncTexture = (isMuted: unknown): void => {
    this.#texture.offset.x = isMuted === true ? SOUND_MUTED_OFFSET : 0;
  };

  constructor(labelPosition: THREE.Vector3) {
    const { audio, rayCursor } = getGame();
    this.#texture = getGame().texture('soundTexture');
    this.#syncTexture(audio.mute.active);

    const intensity = uniform(1);
    const material = new THREE.MeshBasicNodeMaterial({
      alphaTest: 0.5,
      alphaMap: this.#texture,
      transparent: true,
    });
    material.outputNode = vec4(vec3(1).mul(intensity), 1);
    const { scale, aspect, x, y } = SOUND_BUTTON;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect * scale, scale), material);
    this.mesh.position.set(x, y, 0);

    const hitCenter = labelPosition.clone().add(new THREE.Vector3(x, y, 0));
    this.intersect = rayCursor.addIntersect({
      active: true,
      shape: new THREE.Sphere(hitCenter, SOUND_BUTTON.hitRadius),
      onClick: () => audio.mute.toggle(),
      onEnter: () => gsap.to(intensity, { value: SOUND_BUTTON.hoverIntensity, duration: 0.3, overwrite: true }),
      onLeave: () => gsap.to(intensity, { value: 1, duration: 0.3, overwrite: true }),
    });
    audio.events.on('muteChange', this.#syncTexture);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.#texture.dispose();
    getGame().audio.events.off('muteChange', this.#syncTexture);
  }
}

export class Intro {
  readonly center: THREE.Vector3;
  readonly label = new THREE.Group();
  readonly #ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicNodeMaterial>;
  readonly #smoothedProgress = uniform(0);
  #progress = 0;
  #text: PromptText | null = null;
  #soundButton: SoundButton | null = null;
  readonly #update = (): void => this.#tick();

  constructor() {
    const game = getGame();
    this.center = introCenter(game.respawns);
    this.#ring = this.#createRing();
    this.#placeLabel();
    game.ticker.events.on('tick', this.#update, TICK_ORDER);
  }

  #createRing(): THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicNodeMaterial> {
    const { radius, thickness, segments } = RING;
    const geometry = isTideLoading
      ? tideRingGeometry(radius)
      : new THREE.RingGeometry(radius - thickness, radius, segments, 1);
    const material = isTideLoading
      ? tideRingMaterial(this.#smoothedProgress, radius)
      : glowRingMaterial(this.#smoothedProgress);
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(this.center);
    ring.position.y = RING.elevation;
    ring.rotation.x = -Math.PI * 0.5;
    ring.rotation.z = Math.PI * 0.5;
    getGame().scene.add(ring);
    return ring;
  }

  #placeLabel(): void {
    const game = getGame();
    const isPortrait = innerHeight > innerWidth;
    const qualityLayout = game.quality.level === QUALITY.high ? HIGH_QUALITY_LAYOUT : LOW_QUALITY_LAYOUT;
    const layout = isPortrait ? PORTRAIT_LAYOUT : qualityLayout;
    this.label.position.copy(this.center);
    this.label.position.x += layout.offsetX;
    this.label.position.z += layout.offsetZ;
    this.label.position.y = LABEL_HEIGHT;
    this.label.rotation.reorder('YXZ');
    this.label.rotation.y = LABEL_YAW;
    this.label.rotation.x = layout.rotationX;
    this.label.scale.setScalar(LABEL_HIDDEN_SCALE);
    game.scene.add(this.label);
  }

  hideRing(onHidden: () => void): void {
    const ring = this.#ring;
    tweenScale(ring, {
      from: 1,
      to: 0,
      duration: 1.5,
      ease: 'power4.in',
      onComplete: () => {
        onHidden();
        ring.removeFromParent();
      },
    });
  }

  createLabelContent(): void {
    this.#text = new PromptText();
    this.#soundButton = new SoundButton(this.label.position);
    this.label.add(this.#text.mesh, this.#soundButton.mesh);
  }

  showLabel(): void {
    setStartupStage(STARTUP.ready);
    tweenScale(this.label, { from: 0, to: 1, duration: 2, delay: 1, ease: 'elastic.out(0.5)' });
  }

  hideLabel(): void {
    tweenScale(this.label, {
      from: 1,
      to: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.#text?.mesh.removeFromParent();
        this.#soundButton?.mesh.removeFromParent();
        if (this.#soundButton) getGame().rayCursor.removeIntersect(this.#soundButton.intersect);
      },
    });
  }

  updateProgress(progress: number): void {
    this.#progress = progress;
  }

  #tick(): void {
    const smoothed = this.#smoothedProgress;
    smoothed.value += (this.#progress - smoothed.value) * getGame().ticker.delta * RING.smoothing;
  }

  destroy(): void {
    const game = getGame();
    this.label.removeFromParent();
    this.#ring.geometry.dispose();
    this.#ring.material.dispose();
    this.#text?.dispose();
    this.#soundButton?.dispose();
    game.ticker.events.off('tick', this.#update);
  }
}
