import gsap from 'gsap';
import { Fn, max, mix, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from './audioItem';
import { getGame } from './gameContext';
import { INPUT_MODE } from './inputs/inputs';
import {
  concealedOffset,
  drawLabel,
  LABEL,
  type LabelArt,
  oppositeAlign,
  type PointAlign,
} from './interactivePointArt';
import type { PointState } from './pointProximity';
import type { Intersect } from './rayCursor';

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

export interface SharedParts {
  plane: THREE.PlaneGeometry;
  label: THREE.PlaneGeometry;
  keyIcon: THREE.Mesh;
  playerPosition: THREE.UniformNode<'vec2', THREE.Vector2>;
  backColor: THREE.UniformNode<'color', THREE.Color>;
  frontColor: THREE.UniformNode<'color', THREE.Color>;
  sounds: { reveal: AudioItem; conceal: AudioItem };
}

export interface PointRegistry {
  focus(item: InteractivePoint): void;
  blur(item: InteractivePoint): void;
  release(item: InteractivePoint): void;
  isActive(item: InteractivePoint): boolean;
  requestTest(): void;
  growKeyIcon(): void;
  shrinkKeyIcon(): void;
}

const CENTER_BIAS_NDC = 0.15;
const GROUP = { pitch: -Math.PI * 0.15, yaw: Math.PI * 0.25, scale: 0.85 } as const;
const RENDER_ORDER = { label: 6, diamond: 7 } as const;
const HIT_RADIUS = 0.75;
const DIAMOND = {
  hidden: { threshold: 0, thickness: 0.15, offset: 0.175 },
  open: { threshold: 0.5, thickness: 0.075, offset: 0.15 },
  concealed: { threshold: 0.25, thickness: 0.15, offset: 0.175 },
} as const;

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
  readonly #points: PointRegistry;
  readonly #shared: SharedParts;
  readonly #options: InteractivePointOptions;
  readonly #defaultAlign: PointAlign;
  readonly #labelArt = new Map<PointAlign, LabelArt>();
  #align: PointAlign;
  #labelMap: ReturnType<typeof texture> | null = null;
  readonly #group = new THREE.Group();
  readonly #label: THREE.Mesh;
  readonly #diamond: THREE.Mesh;
  readonly #materials: THREE.Material[] = [];
  readonly #labelOffset = uniform(1);
  readonly #threshold = uniform(0);
  readonly #lineThickness = uniform(0.15);
  readonly #lineOffset = uniform(0.175);

  constructor(points: PointRegistry, shared: SharedParts, options: InteractivePointOptions, isHidden: boolean) {
    const game = getGame();
    const state = options.state ?? 'concealed';
    this.#points = points;
    this.#shared = shared;
    this.#options = options;
    this.#defaultAlign = options.align ?? 'left';
    this.#align = this.#defaultAlign;
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
    const art = this.#art(text, this.#align);
    const labelUv = vec2(uv().x.sub(this.#labelOffset), uv().y);
    const labelMap = texture(art.texture, labelUv);
    this.#labelMap = labelMap;
    const material = new THREE.MeshLambertNodeMaterial({ transparent: true, depthTest: true });
    this.#materials.push(material);
    material.outputNode = Fn(() => {
      labelUv.x.greaterThan(1).discard();
      labelUv.x.lessThan(0).discard();
      return vec4(vec3(mix(foggedBackColor(this.#shared), this.#shared.frontColor, labelMap.r)), labelMap.g);
    })();

    const label = new THREE.Mesh(this.#shared.label, material);
    label.renderOrder = RENDER_ORDER.label;
    label.position.z = -0.01;
    label.visible = false;
    this.#group.add(label);
    this.#layoutLabel(label, art);
    return label;
  }

  #art(text: string, align: PointAlign): LabelArt {
    const cached = this.#labelArt.get(align);
    if (cached) return cached;
    const art = drawLabel(text, align);
    this.#labelArt.set(align, art);
    return art;
  }

  #layoutLabel(label: THREE.Mesh, { width }: LabelArt): void {
    label.scale.x = (LABEL.scale * width) / LABEL.height;
    label.scale.y = LABEL.scale;
    label.position.x = this.#align === 'left' ? 0 : -label.scale.x;
  }

  #alignTowardScreenCenter(): void {
    const { camera } = getGame().view;
    const ndcX = this.#group.getWorldPosition(new THREE.Vector3()).project(camera).x;
    const awayFromCenter = ndcX < 0 ? 'right' : 'left';
    const align = Math.abs(ndcX) < CENTER_BIAS_NDC ? this.#defaultAlign : oppositeAlign(awayFromCenter);
    if (align === this.#align || !this.#labelMap) return;
    this.#align = align;
    this.#labelOffset.value = concealedOffset(align);
    const art = this.#art(this.#options.text ?? '', align);
    this.#labelMap.value = art.texture;
    this.#layoutLabel(this.#label, art);
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
    this.#alignTowardScreenCenter();
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
    gsap.to(this.#labelOffset, {
      value: concealedOffset(this.#align),
      ease: 'power2.in',
      duration: 0.6,
      overwrite: true,
    });
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
