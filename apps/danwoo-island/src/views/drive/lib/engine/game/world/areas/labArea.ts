import gsap from 'gsap';
import { color, Fn, luminance, mix, positionGeometry, sin, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import content from '../../../data/danwoo';
import type { LabContent } from '../../../data/worldContent';
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial';
import { remapClamp, signedModDelta } from '../../utilities/maths';
import { rebuildLabGate } from '../islandStructures';
import { rebuildVillageProps } from '../islandVillage';
import { Area } from './area';
import { LabScroller } from './labScroller';
import { BlackBoard } from './showcaseBlackBoard';
import { ShowcaseImages } from './showcaseImages';
import { bindShowcaseInputs, ShowcaseSession, type ShowcaseState } from './showcaseSession';
import { hoverArrow, sphereIntersect, TitleSign, UrlSign } from './showcaseSigns';
import { createHoverMaterials, createShades, type Direction, swingPendulum } from './showcaseVisuals';

const CINEMATIC_OFFSETS = { position: new THREE.Vector3(4.35, 4.0, 4), target: new THREE.Vector3(-1.75, 1.9, -3) };
const SCROLL_SOUND = { maxSpeed: 6, volume: [0, 0.5], rate: [0.95, 1.05] } as const;
const CANDLE = { sway: 0.06, speed: 0.3, frequency: 3, growDuration: 10 } as const;
const HERBAL_BREW = { center: '#ffb347', rim: '#c2410c', intensity: 1.2 } as const;
const EMBERS = { colorA: '#ff6b2b', colorB: '#ff4100', intensity: 1.25 } as const;
const HEAT = { from: '#ff3e00', to: '#ff8641', speed: 0.05 } as const;

function assignMaterial(object: THREE.Object3D, material: THREE.Material): void {
  if (object instanceof THREE.Mesh) object.material = material;
}

function wrapIndex(index: number, count: number): number {
  if (index > count - 1) return 0;
  if (index < 0) return count - 1;
  return index;
}

export class LabArea extends Area {
  readonly #projects = content.lab;
  #index = -1;
  #current: LabContent | null = null;
  #direction: Direction = 'next';
  readonly #shades = createShades();
  readonly #images: ShowcaseImages;
  readonly #arrows: { previous: ReturnType<typeof hoverArrow>; next: ReturnType<typeof hoverArrow> };
  readonly #title: TitleSign;
  readonly #url: UrlSign;
  readonly #scroller: LabScroller;
  readonly #blackBoard: BlackBoard;
  readonly #session: ShowcaseSession;

  constructor(model: THREE.Object3D) {
    super(model);
    const require = (name: string): THREE.Object3D => this.requireReference(name);
    this.#registerScrollSound();
    this.#createInteractivePoint();
    bindShowcaseInputs({
      isOpen: () => this.#session.isOpen,
      previous: () => this.previous(),
      next: () => this.next(),
      openUrl: () => this.#url.open(),
      close: () => this.close(),
    });
    const hover = createHoverMaterials(this.#shades);
    this.#images = new ShowcaseImages({
      mesh: require('images'),
      shades: this.#shades,
      currentKey: () => this.#current?.image ?? '',
      siblingKey: () => this.#siblingImage(),
    });
    this.#arrows = {
      previous: hoverArrow({
        arrow: require('arrowPrevious'),
        shape: sphereIntersect(require('intersectPrevious')),
        hover,
        onClick: () => this.previous(),
      }),
      next: hoverArrow({
        arrow: require('arrowNext'),
        shape: sphereIntersect(require('intersectNext')),
        hover,
        onClick: () => this.next(),
      }),
    };
    this.#title = new TitleSign(require('title'), this.#shades, () => this.#current?.title ?? '');
    this.#url = new UrlSign({
      group: require('url'),
      intersectMesh: require('intersectUrl'),
      shades: this.#shades,
      getUrl: () => this.#current?.url ?? '',
    });
    this.#scroller = new LabScroller({
      require,
      projects: this.#projects,
      shades: this.#shades,
      isShown: () => this.#session.isShown,
      currentIndex: () => this.#index,
      onSelect: (index) => this.#changeProject(index),
    });
    swingPendulum(this.references.items.get('balls') ?? []);
    this.#blackBoard = new BlackBoard(require, () => this.#session.isHidden);
    this.#lightCandles();
    this.#heatCauldron();
    this.#session = new ShowcaseSession({
      anchor: require('interactivePoint').position,
      offsets: CINEMATIC_OFFSETS,
      shades: this.#shades,
      blackBoard: this.#blackBoard,
      setIntersectsActive: (isActive) => {
        this.#arrows.next.active = isActive;
        this.#arrows.previous.active = isActive;
        this.#url.intersect.active = isActive;
      },
    });

    this.#changeProject(0, { isSilent: true });
    this.#scroller.progress = this.#scroller.targetProgress;
    this.#scroller.animate();
  }

  override setObjects(): void {
    rebuildVillageProps(this.model, this.game.materials);
    rebuildLabGate(this.model);
    super.setObjects();
  }

  get state(): ShowcaseState {
    return this.#session.state;
  }

  get isShown(): boolean {
    return this.#session.isShown;
  }

  #registerScrollSound(): void {
    this.game.audio.register({
      path: 'sounds/mecanism/05947 light wooden cart riding on cobblestone - looping.mp3',
      autoplay: true,
      loop: true,
      volume: 0.5,
      positions: this.requireReference('mecanism').position,
      onPlaying: (item) => {
        const speed = Math.abs(this.#scroller.speed);
        item.volume = remapClamp(speed, [0, SCROLL_SOUND.maxSpeed], SCROLL_SOUND.volume);
        item.rate = remapClamp(speed, [0, SCROLL_SOUND.maxSpeed], SCROLL_SOUND.rate);
      },
    });
  }

  #createInteractivePoint(): void {
    const { interactiveButtons } = this.game.inputs;
    this.game.interactivePoints.create({
      position: this.requireReference('interactivePoint').position,
      text: 'Danwoo Lab',
      align: 'right',
      state: 'concealed',
      onInteract: () => window.open(content.labUrl, '_blank', 'noopener,noreferrer'),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #siblingImage(): string {
    const step = this.#direction === 'previous' ? -1 : 1;
    return this.#projects[wrapIndex(this.#index + step, this.#projects.length)]?.image ?? '';
  }

  #lightCandles(): void {
    const meshes = this.references.items.get('candleFlame') ?? [];
    const { ticker, materials, dayCycles } = this.game;
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true });
    material.outputNode = materials.emissiveOutput('emissiveOrangeRadialGradient');
    material.positionNode = Fn(() => {
      const newPosition = positionGeometry.toVar();
      const wave = sin(ticker.elapsedScaledUniform.mul(CANDLE.speed).add(uv().y.mul(CANDLE.frequency)));
      const strength = uv().y.oneMinus().pow(2).mul(CANDLE.sway);
      newPosition.x.addAssign(wave.mul(strength));
      return newPosition;
    })();
    for (const mesh of meshes) {
      mesh.scale.setScalar(0);
      mesh.visible = false;
      assignMaterial(mesh, material);
    }

    dayCycles.events.on('night', (isInside) => {
      for (const mesh of meshes) {
        if (isInside) {
          mesh.visible = true;
          gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: CANDLE.growDuration, ease: 'power1.out', overwrite: true });
          continue;
        }
        gsap.to(mesh.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: CANDLE.growDuration,
          ease: 'power1.in',
          overwrite: true,
          onComplete: () => {
            mesh.visible = false;
          },
        });
      }
    });
  }

  #heatCauldron(): void {
    const { ticker, noises, materials } = this.game;
    const heatMaterial = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    heatMaterial.outputNode = Fn(() => {
      const noiseUv = uv().mul(vec2(2, 0.2));
      noiseUv.y.addAssign(ticker.elapsedScaledUniform.mul(HEAT.speed));
      const strength = texture(noises.perlin, noiseUv).r.mul(uv().y.pow(2));
      const emissiveColor = mix(color(HEAT.from), color(HEAT.to), strength.smoothstep(0, 1)).mul(
        strength.add(1).mul(2),
      );
      return vec4(vec3(emissiveColor), strength);
    })();
    const heat = this.requireReference('heat');
    assignMaterial(heat, heatMaterial);
    heat.castShadow = false;

    const palette = materials.get('palette');
    if (!(palette instanceof MeshDefaultMaterial)) throw new Error('Palette material is not a default material');
    const woodMaterial = palette.clone();
    const emberA = uniform(color(EMBERS.colorA));
    const emberB = uniform(color(EMBERS.colorB));
    const emberIntensity = uniform(EMBERS.intensity);
    const paletteOutput = palette.shadedOutput;
    woodMaterial.outputNode = Fn(() => {
      const radius = uv(1).toVar().sub(0.5).length().mul(2);
      const emberColor = mix(emberA, emberB, radius);
      const ember = emberColor.div(luminance(emberColor)).mul(emberIntensity);
      return vec4(mix(paletteOutput.rgb, ember, radius.pow2()).rgb, 1);
    })();
    assignMaterial(this.requireReference('wood'), woodMaterial);

    const brewCenter = uniform(color(HERBAL_BREW.center));
    const brewRim = uniform(color(HERBAL_BREW.rim));
    const brewIntensity = uniform(HERBAL_BREW.intensity);
    const liquidMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true });
    const brew = mix(brewCenter, brewRim, uv().sub(0.5).length().mul(2));
    liquidMaterial.colorNode = brew.div(luminance(brew)).mul(brewIntensity);
    liquidMaterial.fog = false;
    assignMaterial(this.requireReference('liquid'), liquidMaterial);
  }

  open(): void {
    this.#session.open();
  }

  close(): void {
    this.#session.close();
  }

  previous(): void {
    if (this.#session.isHidden) return;
    this.#changeProject(this.#index - 1, { direction: 'previous' });
    this.#blackBoard.isActive = false;
  }

  next(): void {
    if (this.#session.isHidden) return;
    this.#changeProject(this.#index + 1, { direction: 'next' });
    this.#blackBoard.isActive = false;
  }

  #changeProject(
    index: number,
    { direction, isSilent = false }: { direction?: Direction; isSilent?: boolean } = {},
  ): void {
    const count = this.#projects.length;
    const loopIndex = wrapIndex(index, count);
    if (this.#index === loopIndex) return;
    const resolvedDirection = direction ?? (signedModDelta(loopIndex, this.#index, count) > 0 ? 'previous' : 'next');

    this.#index = loopIndex;
    this.#current = this.#projects[loopIndex] ?? null;
    this.#direction = resolvedDirection;
    this.#title.update(resolvedDirection);
    this.#url.update(resolvedDirection);
    this.#images.update(resolvedDirection);
    this.#scroller.focus(loopIndex);
    if (isSilent) return;
    const { groups } = this.game.audio;
    groups.get('click')?.play();
    groups.get('slide')?.play();
    groups.get('assemble')?.play();
  }

  override update(): void {
    if (this.#session.state !== 'closed') this.#scroller.animate();
  }
}
