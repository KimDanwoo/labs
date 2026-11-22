import gsap from 'gsap';
import { texture, uniform, uv, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { INPUT_MODE } from '@views/drive/lib/engine/game/inputs/inputTypes';
import {
  cachedLabelArt,
  concealedOffset,
  type LabelArt,
  layoutLabel,
  oppositeAlign,
  type PointAlign,
} from '@views/drive/lib/engine/game/interactivePointArt';
import {
  CENTER_BIAS_NDC,
  DISC,
  discMaterial,
  HIT_RADIUS,
  type InteractivePointOptions,
  labelMaterial,
  placePointGroup,
  type PointRegistry,
  pulseThreshold,
  RENDER_ORDER,
  setDepthTest,
  type SharedParts,
  tweenDisc,
} from '@views/drive/lib/engine/game/interactivePointShared';
import type { PointState } from '@views/drive/lib/engine/game/pointProximity';
import type { Intersect } from '@views/drive/lib/engine/game/rayCursor';

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
  readonly #disc: THREE.Mesh;
  readonly #materials: THREE.Material[] = [];
  readonly #labelOffset = uniform(1);
  readonly #threshold = uniform(0);
  readonly #lineThickness = uniform(DISC.hidden.thickness);
  readonly #lineOffset = uniform(DISC.hidden.offset);
  readonly #discLines = {
    threshold: this.#threshold,
    lineThickness: this.#lineThickness,
    lineOffset: this.#lineOffset,
  };

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

    placePointGroup(this.#group, options.position);
    game.scene.add(this.#group);

    this.#label = this.#createLabel(options.text ?? '');
    this.#disc = this.#createDisc();
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
    const art = cachedLabelArt(this.#labelArt, text, this.#align);
    const labelUv = vec2(uv().x.sub(this.#labelOffset), uv().y);
    const labelMap = texture(art.texture, labelUv);
    this.#labelMap = labelMap;
    const material = labelMaterial(this.#shared, labelMap, labelUv);
    this.#materials.push(material);

    const label = new THREE.Mesh(this.#shared.label, material);
    label.renderOrder = RENDER_ORDER.label;
    label.position.z = -0.01;
    label.visible = false;
    this.#group.add(label);
    layoutLabel(label, art, this.#align);
    return label;
  }

  #alignTowardScreenCenter(): void {
    const { camera } = getGame().view;
    const ndcX = this.#group.getWorldPosition(new THREE.Vector3()).project(camera).x;
    const awayFromCenter = ndcX < 0 ? 'right' : 'left';
    const align = Math.abs(ndcX) < CENTER_BIAS_NDC ? this.#defaultAlign : oppositeAlign(awayFromCenter);
    if (align === this.#align) return;
    if (!this.#labelMap) return;
    this.#align = align;
    this.#labelOffset.value = concealedOffset(align);
    const art = cachedLabelArt(this.#labelArt, this.#options.text ?? '', align);
    this.#labelMap.value = art.texture;
    layoutLabel(this.#label, art, this.#align);
  }

  #createDisc(): THREE.Mesh {
    const material = discMaterial(this.#shared, {
      threshold: this.#threshold,
      lineOffset: this.#lineOffset,
      lineThickness: this.#lineThickness,
    });
    this.#materials.push(material);

    const disc = new THREE.Mesh(this.#shared.plane, material);
    disc.renderOrder = RENDER_ORDER.disc;
    disc.visible = false;
    this.#group.add(disc);
    return disc;
  }

  hide(): void {
    if (this.state === 'hidden') return;
    this.state = 'hidden';
    this.intersect.active = false;
    tweenDisc(this.#discLines, DISC.hidden, { ease: 'back.in(4.5)', duration: 0.6 }, () => {
      this.#disc.visible = false;
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
    this.#disc.visible = true;
    this.#alignTowardScreenCenter();
    this.#label.visible = true;
    this.#group.add(this.#shared.keyIcon);
    tweenDisc(this.#discLines, DISC.open, { ease: 'elastic.out(1.3,0.4)', duration: 1.5 });
    if (getGame().inputs.mode !== INPUT_MODE.touch) this.#points.growKeyIcon();
    gsap.to(this.#labelOffset, { value: 0, ease: 'power2.out', duration: 0.6, delay: 0.2, overwrite: true });
    setDepthTest(this.#materials, false);
    this.#shared.sounds.reveal.play();
    this.#options.onReveal?.();
  }

  conceal(): void {
    if (this.state === 'concealed') return;
    const ease = this.state === 'hidden' ? 'power2.out' : 'back.in(4.5)';
    this.state = 'concealed';
    this.intersect.active = true;
    this.#disc.visible = true;
    tweenDisc(this.#discLines, DISC.concealed, { ease, duration: 0.6, delay: 0.2 }, () => {
      this.#label.visible = false;
      setDepthTest(this.#materials, true);
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
    pulseThreshold(this.#threshold);
    this.#options.onInteract?.();
  }

  show(): void {
    if (this.isIn) this.reveal();
    else this.conceal();
    this.#points.requestTest();
  }
}
