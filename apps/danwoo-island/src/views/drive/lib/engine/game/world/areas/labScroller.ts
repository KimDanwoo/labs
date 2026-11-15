import gsap from 'gsap';
import { color, Fn, mix, positionWorld, texture, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { LabContent } from '../../../data/worldContent';
import { getGame } from '../../gameContext';
import type { Action } from '../../inputs/inputs';
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial';
import type { Intersect } from '../../rayCursor';
import { remapClamp, safeMod } from '../../utilities/maths';
import {
  configureImageTexture,
  highlightTextMaterial,
  type Shades,
  showcaseTextCanvas,
  TEXT_DENSITY,
} from './showcaseVisuals';

interface Mini {
  readonly index: number;
  readonly y: number;
  readonly group: THREE.Object3D;
  readonly highlight: THREE.UniformNode<'float', number>;
  readonly intersect: Intersect;
  readonly startLoading: () => void;
}

interface LabScrollerOptions {
  readonly require: (name: string) => THREE.Object3D;
  readonly projects: readonly LabContent[];
  readonly shades: Shades;
  readonly isShown: () => boolean;
  readonly currentIndex: () => number;
  readonly onSelect: (index: number) => void;
}

const ROPE_COLOR = '#a8814a';
const ROPE_CUTOFF = 4;
const REPEAT_AMPLITUDE = 0.5444;
const WHEEL_SENSITIVITY = 0.1;
const EASING = 3;
const GEAR_SPEED = 1.4;
const GEAR_RATIO = 6 / 12;
const MINI = { spacing: 0.9, offset: 1, fadeRange: [3.3, 3.9], centering: 3.25 } as const;
const MINI_CANVAS = { fontSize: 0.18, width: 1.5, height: 0.2, lineHeight: 0.2 } as const;
const PANEL_PADDING = 0.2;
const MINI_FADE_DURATION = 1;
const SCROLL_ACTION = { name: 'labScroll', categories: ['cinematic'], keys: ['Wheel.roll'] };

function ropeMaterial(alphaNode: THREE.Node<'float'>): MeshDefaultMaterial {
  return new MeshDefaultMaterial({
    colorNode: color(ROPE_COLOR).rgb,
    alphaNode,
    hasWater: false,
    hasLightBounce: false,
  });
}

function lastChildStartingWith(parent: THREE.Object3D, prefix: string): THREE.Object3D {
  const child = [...parent.children].reverse().find(({ name }) => name.startsWith(prefix));
  if (!child) throw new Error(`Lab mini child is missing: ${prefix}*`);
  return child;
}

function assignMaterial(object: THREE.Object3D, material: THREE.Material): void {
  if (object instanceof THREE.Mesh) object.material = material;
}

export class LabScroller {
  progress = 0;
  targetProgress = 0;
  speed = 0;
  readonly #game = getGame();
  readonly #chainLeft: THREE.Object3D;
  readonly #chainRight: THREE.Object3D;
  readonly #chainPulley: THREE.Object3D;
  readonly #gears: readonly [THREE.Object3D, THREE.Object3D, THREE.Object3D];
  readonly #minis: Mini[];
  readonly #total: number;
  readonly #isShown: () => boolean;
  #currentMini: Mini | null = null;

  constructor({ require, projects, shades, isShown, currentIndex, onSelect }: LabScrollerOptions) {
    this.#isShown = isShown;
    this.#chainLeft = require('chainLeft');
    this.#chainRight = require('chainRight');
    this.#chainPulley = require('chainPulley');
    this.#gears = [require('gearA'), require('gearB'), require('gearC')];

    const chainMaterial = ropeMaterial(positionWorld.y.step(ROPE_CUTOFF).oneMinus());
    assignMaterial(this.#chainLeft, chainMaterial);
    assignMaterial(this.#chainRight, chainMaterial);
    assignMaterial(this.#chainPulley, ropeMaterial(positionWorld.y.step(ROPE_CUTOFF)));

    const template = require('mini');
    const parent = template.parent;
    template.removeFromParent();
    this.#total = projects.length * MINI.spacing;
    this.#minis = projects.map((project, index) =>
      this.#createMini({ template, parent, project, index, shades, currentIndex, onSelect }),
    );

    for (const gear of this.#gears) gear.rotation.reorder('YXZ');

    const { inputs } = this.#game;
    inputs.addActions([SCROLL_ACTION]);
    inputs.events.on(SCROLL_ACTION.name, (action: Action) => {
      if (typeof action.value === 'number') this.targetProgress -= action.value * WHEEL_SENSITIVITY;
    });
  }

  #createMini({
    template,
    parent,
    project,
    index,
    shades,
    currentIndex,
    onSelect,
  }: {
    template: THREE.Object3D;
    parent: THREE.Object3D | null;
    project: LabContent;
    index: number;
    shades: Shades;
    currentIndex: () => number;
    onSelect: (index: number) => void;
  }): Mini {
    const y = -index * MINI.spacing;
    const group = template.clone(true);
    group.position.y = y;
    group.visible = true;
    parent?.add(group);

    const imageMesh = lastChildStartingWith(group, 'image');
    const textMesh = lastChildStartingWith(group, 'text');
    const panelMesh = lastChildStartingWith(group, 'panel');
    const intersectMesh = lastChildStartingWith(group, 'intersect');

    imageMesh.visible = false;
    let hasStartedLoading = false;
    const startLoading = (): void => {
      if (hasStartedLoading) return;
      new THREE.TextureLoader().load(`danwoo/${project.imageMini}`, (loaded) => {
        assignMaterial(imageMesh, this.#miniImageMaterial(loaded, shades));
        imageMesh.visible = true;
      });
      hasStartedLoading = true;
    };

    const highlight = uniform(0);
    const canvas = showcaseTextCanvas(MINI_CANVAS);
    canvas.updateText(project.title);
    panelMesh.scale.x = canvas.getMeasure().width / TEXT_DENSITY + PANEL_PADDING;
    textMesh.castShadow = false;
    textMesh.receiveShadow = false;
    assignMaterial(textMesh, highlightTextMaterial(canvas.texture, shades, highlight, false));

    if (!(intersectMesh instanceof THREE.Mesh)) throw new Error('Lab mini intersect is not a mesh');
    intersectMesh.visible = false;
    const intersect = this.#game.rayCursor.addIntersect({
      active: false,
      shape: intersectMesh,
      onClick: () => onSelect(index),
      onEnter: () => {
        highlight.value = 1;
      },
      onLeave: () => {
        highlight.value = index === currentIndex() ? 1 : 0;
      },
    });
    return { index, y, group, highlight, intersect, startLoading };
  }

  #miniImageMaterial(loaded: THREE.Texture, shades: Shades): MeshDefaultMaterial {
    const alpha = uniform(0);
    const textureColor = texture(loaded).rgb;
    gsap.to(alpha, { value: 1, duration: MINI_FADE_DURATION, overwrite: true });
    configureImageTexture(loaded);
    const material = new MeshDefaultMaterial({
      colorNode: textureColor,
      hasWater: false,
      hasLightBounce: false,
      transparent: true,
    });
    const base = material.shadedOutput;
    material.outputNode = Fn(() => vec4(mix(base.rgb, textureColor, shades.images.uniform), alpha))();
    return material;
  }

  animate(): void {
    const { ticker } = this.#game;
    const delta = (this.targetProgress - this.progress) * ticker.deltaScaled * EASING;
    this.progress += delta;
    const offset = this.progress * MINI.spacing;
    this.speed = delta / ticker.delta;

    this.#chainLeft.position.y = -REPEAT_AMPLITUDE * 0.5 - (offset % REPEAT_AMPLITUDE);
    this.#chainRight.position.y = -REPEAT_AMPLITUDE * 0.5 + (offset % REPEAT_AMPLITUDE);
    this.#chainPulley.rotation.z = offset * GEAR_SPEED;
    const [gearA, gearB, gearC] = this.#gears;
    gearA.rotation.x = -offset * GEAR_SPEED;
    gearB.rotation.x = -gearA.rotation.x * GEAR_RATIO;
    gearC.rotation.x = -gearB.rotation.x * GEAR_RATIO;

    const isShown = this.#isShown();
    for (const mini of this.#minis) {
      mini.group.position.y = safeMod(mini.y - offset, this.#total) - MINI.offset;
      const scale = remapClamp(mini.group.position.y, MINI.fadeRange, [1, 0]);
      mini.group.scale.y = scale;
      mini.group.visible = scale > 0;
      mini.intersect.active = mini.group.visible && isShown;
      if (mini.group.visible) mini.startLoading();
    }
  }

  focus(index: number): void {
    const count = this.#minis.length;
    const centering = count - MINI.centering;
    this.targetProgress = Math.round((this.progress + index - centering) / count) * count - index + centering;
    if (this.#currentMini) this.#currentMini.highlight.value = 0;
    const mini = this.#minis[index];
    if (!mini) return;
    mini.highlight.value = 1;
    this.#currentMini = mini;
  }
}
