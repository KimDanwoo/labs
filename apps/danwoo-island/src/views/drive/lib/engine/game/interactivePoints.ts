import gsap from 'gsap';
import { color, Fn, max, mix, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from './audio';
import { getGame } from './gameContext';
import { INPUT_MODE } from './inputs/inputs';
import type { Intersect } from './rayCursor';

export type PointAlign = 'left' | 'right';
export type PointState = 'hidden' | 'open' | 'concealed';

export interface InteractivePointOptions {
  position: THREE.Vector3;
  text?: string;
  align?: PointAlign;
  state?: PointState;
  onInteract?: () => void;
  onReveal?: () => void;
  onConceal?: () => void;
  onHide?: () => void;
}

interface SharedParts {
  plane: THREE.PlaneGeometry;
  label: THREE.PlaneGeometry;
  keyIcon: THREE.Mesh;
  playerPosition: THREE.UniformNode<'vec2', THREE.Vector2>;
  backColor: THREE.UniformNode<'color', THREE.Color>;
  frontColor: THREE.UniformNode<'color', THREE.Color>;
  sounds: { reveal: AudioItem; conceal: AudioItem };
}

const LABEL = { height: 64, nearPadding: 60, farPadding: 12, offsetVertical: 2, scale: 0.75 } as const;
const GROUP = { pitch: -Math.PI * 0.15, yaw: Math.PI * 0.25, scale: 0.85 } as const;
const RENDER_ORDER = { label: 6, diamond: 7, keyIcon: 8 } as const;
const HIT_RADIUS = 0.75;
const NEAR_DISTANCE = 2.5;
const RETEST_DISTANCE = 0.2;
const KEY_ICON_SCALE = 0.25;
const TICK_ORDER = 9;
const DIAMOND = {
  hidden: { threshold: 0, thickness: 0.15, offset: 0.175 },
  open: { threshold: 0.5, thickness: 0.075, offset: 0.15 },
  concealed: { threshold: 0.25, thickness: 0.15, offset: 0.175 },
} as const;

function flippedUvTexture(map: THREE.Texture): THREE.Node<'float'> {
  return texture(map, vec2(uv().x, uv().y.oneMinus())).r;
}

function drawLabel(text: string, align: PointAlign): { texture: THREE.Texture; width: number } {
  const font = `700 ${LABEL.height}px "MaruBuri"`;
  const paddingLeft = align === 'left' ? LABEL.nearPadding : LABEL.farPadding;
  const paddingRight = align === 'left' ? LABEL.farPadding : LABEL.nearPadding;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  context.font = font;
  const width = Math.ceil(context.measureText(text).width) + paddingLeft + paddingRight + 2;
  canvas.width = width;
  canvas.height = LABEL.height;

  context.fillStyle = '#000000';
  context.fillRect(0, 0, width, LABEL.height);
  context.font = font;
  context.fillStyle = '#ffffff';
  context.textAlign = 'start';
  context.textBaseline = 'middle';
  context.fillText(text, paddingLeft + 1, LABEL.height * 0.5 + LABEL.offsetVertical);

  const labelTexture = new THREE.Texture(canvas);
  labelTexture.minFilter = THREE.NearestFilter;
  labelTexture.magFilter = THREE.NearestFilter;
  labelTexture.generateMipmaps = false;
  labelTexture.needsUpdate = true;
  return { texture: labelTexture, width };
}

function foggedBackColor(shared: SharedParts): THREE.Node<'vec3'> {
  const { fog } = getGame();
  return fog.strength.mix(shared.backColor, fog.color);
}

export class InteractivePoint {
  state: PointState;
  recoveryState: PointState;
  isIn = false;
  readonly position: THREE.Vector2;
  readonly intersect: Intersect;
  readonly #points: InteractivePoints;
  readonly #shared: SharedParts;
  readonly #options: InteractivePointOptions;
  readonly #align: PointAlign;
  readonly #group = new THREE.Group();
  readonly #label: THREE.Mesh;
  readonly #diamond: THREE.Mesh;
  readonly #materials: THREE.Material[] = [];
  readonly #labelOffset = uniform(1);
  readonly #threshold = uniform(0);
  readonly #lineThickness = uniform(0.15);
  readonly #lineOffset = uniform(0.175);

  constructor(points: InteractivePoints, shared: SharedParts, options: InteractivePointOptions, isHidden: boolean) {
    const game = getGame();
    const state = options.state ?? 'concealed';
    this.#points = points;
    this.#shared = shared;
    this.#options = options;
    this.#align = options.align ?? 'left';
    this.position = new THREE.Vector2(options.position.x, options.position.z);
    this.state = isHidden ? 'hidden' : state;
    this.recoveryState = state;

    this.#group.rotation.reorder('YXZ');
    this.#group.rotation.x = GROUP.pitch;
    this.#group.rotation.y = GROUP.yaw;
    this.#group.position.copy(options.position);
    this.#group.scale.setScalar(GROUP.scale);
    game.scene.add(this.#group);

    this.#label = this.#createLabel(options.text ?? '');
    this.#diamond = this.#createDiamond();
    this.intersect = game.rayCursor.addIntersect({
      active: false,
      shape: new THREE.Sphere(options.position.clone(), HIT_RADIUS),
      onClick: () => {
        if (this.state !== 'hidden') this.interact();
      },
      onEnter: () => this.#points.focus(this),
      onLeave: () => this.#points.blur(this),
    });
    if (state === 'concealed') this.state = 'hidden';
  }

  #createLabel(text: string): THREE.Mesh {
    const { texture: labelTexture, width } = drawLabel(text, this.#align);
    const material = new THREE.MeshLambertNodeMaterial({ transparent: true, depthTest: true });
    this.#materials.push(material);
    material.outputNode = Fn(() => {
      const labelUv = vec2(uv().x.sub(this.#labelOffset), uv().y);
      const glyph = texture(labelTexture, labelUv).r;
      labelUv.x.greaterThan(1).discard();
      labelUv.x.lessThan(0).discard();
      return vec4(vec3(mix(foggedBackColor(this.#shared), this.#shared.frontColor, glyph)), 1);
    })();

    const label = new THREE.Mesh(this.#shared.label, material);
    label.renderOrder = RENDER_ORDER.label;
    label.scale.x = (LABEL.scale * width) / LABEL.height;
    label.scale.y = LABEL.scale;
    label.position.z = -0.01;
    label.position.x = this.#align === 'left' ? 0 : -label.scale.x;
    label.visible = false;
    this.#group.add(label);
    return label;
  }

  #createDiamond(): THREE.Mesh {
    const material = new THREE.MeshLambertNodeMaterial({ transparent: true, depthTest: true });
    this.#materials.push(material);
    material.outputNode = Fn(() => {
      const pointUv = uv();
      const distance = max(pointUv.x.sub(0.5).abs(), pointUv.y.sub(0.5).abs()).mul(2);
      const lineDistance = this.#threshold.sub(distance).sub(this.#lineOffset).abs();
      const line = step(lineDistance, this.#lineThickness.mul(0.5));
      distance.greaterThan(this.#threshold).discard();
      return vec4(vec3(mix(foggedBackColor(this.#shared), this.#shared.frontColor, line)), 1);
    })();

    const diamond = new THREE.Mesh(this.#shared.plane, material);
    diamond.renderOrder = RENDER_ORDER.diamond;
    diamond.rotation.z = Math.PI * 0.25;
    diamond.visible = false;
    this.#group.add(diamond);
    return diamond;
  }

  #tweenDiamond(target: (typeof DIAMOND)[PointState], vars: gsap.TweenVars, onComplete?: () => void): void {
    gsap.to(this.#threshold, { value: target.threshold, ...vars, overwrite: true });
    gsap.to(this.#lineThickness, { value: target.thickness, ...vars, overwrite: true });
    gsap.to(this.#lineOffset, { value: target.offset, ...vars, overwrite: true, onComplete });
  }

  #setDepthTest(isDepthTested: boolean): void {
    for (const material of this.#materials) {
      material.depthTest = isDepthTested;
      material.needsUpdate = true;
    }
  }

  hide(): void {
    if (this.state === 'hidden') return;
    this.state = 'hidden';
    this.intersect.active = false;
    this.#tweenDiamond(DIAMOND.hidden, { ease: 'back.in(4.5)', duration: 0.6 }, () => {
      this.#diamond.visible = false;
      this.#label.visible = false;
    });
    this.#points.shrinkKeyIcon();
    gsap.to(this.#labelOffset, { value: 1, ease: 'power2.in', duration: 0.6, overwrite: true });
    this.#points.release(this);
    this.#options.onHide?.();
  }

  reveal(): void {
    if (this.state === 'open') return;
    this.state = 'open';
    this.intersect.active = true;
    this.#diamond.visible = true;
    this.#label.visible = true;
    this.#group.add(this.#shared.keyIcon);
    this.#tweenDiamond(DIAMOND.open, { ease: 'elastic.out(1.3,0.4)', duration: 1.5 });
    if (getGame().inputs.mode !== INPUT_MODE.touch) this.#points.growKeyIcon();
    gsap.to(this.#labelOffset, { value: 0, ease: 'power2.out', duration: 0.6, delay: 0.2, overwrite: true });
    this.#setDepthTest(false);
    this.#shared.sounds.reveal.play();
    this.#options.onReveal?.();
  }

  conceal(): void {
    if (this.state === 'concealed') return;
    const ease = this.state === 'hidden' ? 'power2.out' : 'back.in(4.5)';
    this.state = 'concealed';
    this.intersect.active = true;
    this.#diamond.visible = true;
    this.#tweenDiamond(DIAMOND.concealed, { ease, duration: 0.6, delay: 0.2 }, () => {
      this.#label.visible = false;
      this.#setDepthTest(true);
    });
    if (this.#points.isActive(this)) this.#points.shrinkKeyIcon();
    const hiddenOffset = this.#align === 'left' ? -1 : 1;
    gsap.to(this.#labelOffset, { value: hiddenOffset, ease: 'power2.in', duration: 0.6, overwrite: true });
    this.#shared.sounds.conceal.play();
    this.#options.onConceal?.();
  }

  interact(): void {
    gsap.to(this.#threshold, {
      value: 0.6,
      ease: 'power2.out',
      duration: 0.1,
      overwrite: true,
      onComplete: () => {
        gsap.to(this.#threshold, {
          value: DIAMOND.open.threshold,
          ease: 'elastic.out(1.3,0.6)',
          duration: 1.5,
          overwrite: true,
        });
      },
    });
    this.#options.onInteract?.();
  }

  show(): void {
    if (this.isIn) this.reveal();
    else this.conceal();
    this.#points.requestTest();
  }
}

export class InteractivePoints {
  readonly #items: InteractivePoint[] = [];
  readonly #shared: SharedParts;
  #activeItem: InteractivePoint | null = null;
  #isTemporarilyHidden = true;
  #needsTest = false;

  constructor() {
    const game = getGame();
    const plane = new THREE.PlaneGeometry(2, 2);
    const label = new THREE.PlaneGeometry(1, 1, 1, 1);
    label.translate(0.5, 0, 0);
    const frontColor = uniform(color('#ffffff'));
    this.#shared = {
      plane,
      label,
      frontColor,
      backColor: uniform(color('#251f2b')),
      playerPosition: uniform(vec2()),
      keyIcon: this.#createKeyIcon(plane, frontColor),
      sounds: {
        reveal: game.audio.register({
          group: 'reveal',
          path: 'sounds/paper/PaperMovement_fNAyV_01-3.mp3',
          autoplay: false,
          volume: 0.25,
        }),
        conceal: game.audio.register({
          group: 'reveal',
          path: 'sounds/paper/PaperMovement_fNAyV_01-2.mp3',
          autoplay: false,
          volume: 0.25,
        }),
      },
    };
    this.#bindInteract();
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  #createKeyIcon(plane: THREE.PlaneGeometry, frontColor: SharedParts['frontColor']): THREE.Mesh {
    const game = getGame();
    const material = new THREE.MeshLambertNodeMaterial({ transparent: true, depthTest: false });
    const iconOutput = Fn(([iconAlpha]: [THREE.Node<'float'>]): THREE.Node<'vec4'> => {
      iconAlpha.lessThan(0.5).discard();
      return vec4(frontColor, 1);
    });
    const useIcon = (name: string): void => {
      material.outputNode = iconOutput(flippedUvTexture(game.texture(name)));
      material.needsUpdate = true;
    };
    material.outputNode = iconOutput(flippedUvTexture(game.texture('interactivePointsKeyIconEnterTexture')));

    const mesh = new THREE.Mesh(plane, material);
    mesh.renderOrder = RENDER_ORDER.keyIcon;
    mesh.scale.setScalar(0);
    mesh.position.z = 0.01;
    mesh.visible = false;

    const gamepadIcon = (): string =>
      game.inputs.gamepad.type === 'xbox' ? 'interactivePointsKeyIconATexture' : 'interactivePointsKeyIconCrossTexture';
    game.inputs.gamepad.events.on('typeChange', () => {
      if (game.inputs.mode === INPUT_MODE.gamepad) useIcon(gamepadIcon());
    });
    game.inputs.modeEvents.on('change', () => {
      const { mode } = game.inputs;
      if (mode === INPUT_MODE.gamepad) useIcon(gamepadIcon());
      else if (mode === INPUT_MODE.mouseKeyboard) useIcon('interactivePointsKeyIconEnterTexture');
      else if (mode === INPUT_MODE.touch) mesh.visible = false;
    });
    return mesh;
  }

  #bindInteract(): void {
    const { inputs } = getGame();
    const interactWithActive = (): void => {
      if (this.#activeItem?.state === 'open') this.#activeItem.interact();
    };
    inputs.events.on('interact', (action) => {
      if (action.active) interactWithActive();
    });
    inputs.interactiveButtons.events.on('interact', interactWithActive);
  }

  create(options: InteractivePointOptions): InteractivePoint {
    const item = new InteractivePoint(this, this.#shared, options, this.#isTemporarilyHidden);
    this.#items.push(item);
    return item;
  }

  isActive(item: InteractivePoint): boolean {
    return this.#activeItem === item;
  }

  focus(item: InteractivePoint): void {
    if (item.state === 'hidden') return;
    if (this.#activeItem && this.#activeItem !== item) this.#activeItem.conceal();
    this.#activeItem = item;
    item.reveal();
  }

  blur(item: InteractivePoint): void {
    if (this.#activeItem !== item || item.state === 'hidden') return;
    item.conceal();
    this.#activeItem = null;
  }

  release(item: InteractivePoint): void {
    if (this.#activeItem === item) this.#activeItem = null;
  }

  requestTest(): void {
    this.#needsTest = true;
  }

  growKeyIcon(): void {
    const { keyIcon } = this.#shared;
    keyIcon.visible = true;
    keyIcon.scale.setScalar(0);
    const scale = KEY_ICON_SCALE;
    gsap.to(keyIcon.scale, {
      x: scale,
      y: scale,
      z: scale,
      ease: 'elastic.out(1.3,0.8)',
      duration: 1.5,
      delay: 0.6,
      overwrite: true,
    });
  }

  shrinkKeyIcon(): void {
    const { keyIcon } = this.#shared;
    gsap.to(keyIcon.scale, {
      x: 0,
      y: 0,
      z: 0,
      ease: 'power2.in',
      duration: 0.6,
      overwrite: true,
      onComplete: () => {
        keyIcon.visible = false;
      },
    });
  }

  update(): void {
    const { player } = getGame();
    const { playerPosition } = this.#shared;
    const traveled = playerPosition.value.distanceTo(player.position2);
    if (traveled <= RETEST_DISTANCE && !this.#needsTest) return;
    this.#needsTest = false;
    playerPosition.value.copy(player.position2);

    const nearby = this.#items.filter((item) => item.position.distanceTo(player.position2) < NEAR_DISTANCE);
    for (const item of this.#items) {
      if (nearby.includes(item) || !item.isIn) continue;
      item.isIn = false;
      if (item.state !== 'hidden') item.conceal();
    }

    const nextActive = nearby.filter((item) => item.state !== 'hidden').at(-1);
    if (!nextActive) {
      this.#activeItem = null;
      return;
    }
    if (this.#activeItem && nextActive !== this.#activeItem) {
      this.#activeItem.isIn = false;
      this.#activeItem.conceal();
    }
    if (!nextActive.isIn || this.#activeItem === null) {
      this.#activeItem = nextActive;
      nextActive.isIn = true;
      nextActive.reveal();
    }
  }

  temporaryHide(): void {
    this.#isTemporarilyHidden = true;
    for (const item of this.#items) {
      item.recoveryState = item.state;
      item.hide();
    }
  }

  recover(): void {
    this.#isTemporarilyHidden = false;
    for (const item of this.#items) {
      if (item.recoveryState !== 'hidden') item.show();
    }
  }
}
