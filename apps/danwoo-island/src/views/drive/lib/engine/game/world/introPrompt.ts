import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { INPUT_MODE } from '@views/drive/lib/engine/game/inputs/inputTypes';
import type { Intersect } from '@views/drive/lib/engine/game/rayCursor';
import { UI_FONT_FAMILY } from '@views/drive/lib/engine/game/utilities/canvasFont';
import { TIDE_LABEL } from '@views/drive/lib/engine/game/world/tideLoading';
import gsap from 'gsap';
import { color, Fn, texture, uniform, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

export const LABEL_HEIGHT = 1;

export const LABEL_DISTANCE = 6;

const PROMPT_RENDER_ORDER = 10;

export const LABEL_HIDDEN_SCALE = 0.01;

export const LOADER = { elevation: 0.001, smoothing: 10, hideDuration: 0.5 } as const;

const TEXT_SCALE = 0.9;

const TEXT_ASPECT = 4;

const TEXT_CANVAS = { width: 1024, height: 256, maxWidth: 980 } as const;

const PROMPT_FONT = `800 168px ${UI_FONT_FAMILY}`;

const SOUND_BUTTON = { scale: 0.45, aspect: 50 / 38, x: 0, y: -0.62, hitRadius: 0.4, hoverIntensity: 1.5 } as const;

const SOUND_MUTED_OFFSET = 0.5;

function startPrompt(): string {
  const { inputs } = getGame();
  if (inputs.mode === INPUT_MODE.gamepad) return inputs.gamepad.type === 'xbox' ? 'press A!' : 'press ×!';
  const isTouch = inputs.mode === INPUT_MODE.touch || window.matchMedia('(pointer: coarse)').matches;
  return isTouch ? 'tap me!' : 'click me!';
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
  context.font = PROMPT_FONT;
  context.fillText(prompt, canvas.width / 2, canvas.height / 2, TEXT_CANVAS.maxWidth);
  return new THREE.CanvasTexture(canvas);
}

interface ScaleTween extends gsap.TweenVars {
  from: number;
  to: number;
}

export function tweenScale(object: THREE.Object3D, { from, to, ...vars }: ScaleTween): void {
  const scale = { value: from };
  gsap.to(scale, {
    ...vars,
    value: to,
    overwrite: true,
    onUpdate: () => object.scale.setScalar(scale.value),
  });
}

export class PromptText {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicNodeMaterial>;
  readonly #textures = new Map<string, THREE.CanvasTexture>();
  readonly #refresh = (): void => this.#update();

  constructor() {
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, depthTest: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(TEXT_SCALE * TEXT_ASPECT, TEXT_SCALE), material);
    this.mesh.renderOrder = PROMPT_RENDER_ORDER;
    this.#update();
    const { inputs } = getGame();
    inputs.gamepad.events.on('typeChange', this.#refresh);
    inputs.modeEvents.on('change', this.#refresh);
  }

  #update(): void {
    const prompt = startPrompt();
    const labelTexture = this.#textures.get(prompt) ?? drawPrompt(prompt);
    this.#textures.set(prompt, labelTexture);
    this.mesh.material.outputNode = Fn(() => vec4(color(TIDE_LABEL), texture(labelTexture, uv()).r))();
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

export class SoundButton {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicNodeMaterial>;
  readonly intersect: Intersect;
  readonly #texture: THREE.Texture;
  readonly #syncTexture = (isMuted: unknown): void => {
    this.#texture.offset.x = isMuted === true ? SOUND_MUTED_OFFSET : 0;
  };

  constructor(label: THREE.Object3D) {
    const { audio, rayCursor } = getGame();
    this.#texture = getGame().texture('soundTexture');
    this.#syncTexture(audio.mute.active);

    const intensity = uniform(1);
    const material = new THREE.MeshBasicNodeMaterial({
      alphaTest: 0.5,
      depthTest: false,
      alphaMap: this.#texture,
      transparent: true,
    });
    material.outputNode = vec4(vec3(1).mul(intensity), 1);
    const { scale, aspect, x, y } = SOUND_BUTTON;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect * scale, scale), material);
    this.mesh.renderOrder = PROMPT_RENDER_ORDER;
    this.mesh.position.set(x, y, 0);

    const hitCenter = new THREE.Vector3(x, y, 0).applyQuaternion(label.quaternion).add(label.position);
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
