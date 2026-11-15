import { color, Fn, texture, uniform, uv } from 'three/tsl';
import * as THREE from 'three/webgpu';

import content from '../../../data/danwoo';
import type { ProjectContent } from '../../../data/worldContent';
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial';
import type { Intersect } from '../../rayCursor';
import { removeAwardsTable } from '../islandReskins';
import { rebuildProjectsGate } from '../islandStructures';
import { rebuildVillageProps } from '../islandVillage';
import { Area } from './area';
import { type AttributeName, ImagePagination, ProjectAdjacents, ProjectAttributes } from './projectsPanels';
import { BlackBoard } from './showcaseBlackBoard';
import { ShowcaseImages } from './showcaseImages';
import { bindShowcaseInputs, ShowcaseSession, type ShowcaseState } from './showcaseSession';
import { TitleSign, UrlSign, urlSignIntersect } from './showcaseSigns';
import { createHoverMaterials, createShades, type Direction } from './showcaseVisuals';

type ImageLanding = 'first' | 'last';

const CINEMATIC_OFFSETS = { position: new THREE.Vector3(4.65, 4, 4.85), target: new THREE.Vector3(-3.0, 1.6, -4.6) };
const CHARCOAL_COLOR = 0x6f6a87;
const CHARCOAL_THRESHOLD = { base: 0.25, amplitude: 0.1, phase: 0.5, initial: 0.2 } as const;

function wrapIndex(index: number, count: number): number {
  if (index > count - 1) return 0;
  if (index < 0) return count - 1;
  return index;
}

function assignMaterial(object: THREE.Object3D, material: THREE.Material): void {
  if (object instanceof THREE.Mesh) object.material = material;
}

const FORGE_TOOLS = ['hammer', 'blade', 'grinder', 'blower'] as const;

function hideForgeTools(require: (name: string) => THREE.Object3D): void {
  for (const name of FORGE_TOOLS) {
    require(name).traverse((child) => {
      if (child instanceof THREE.Mesh) child.geometry = new THREE.BufferGeometry();
    });
  }
}

export class ProjectsArea extends Area {
  readonly #projects = content.projects;
  #index = 0;
  #current: ProjectContent | null = null;
  #imageIndex = 0;
  #imageDirection: Direction = 'next';
  readonly #shades = createShades();
  readonly #images: ShowcaseImages;
  readonly #pagination: ImagePagination;
  readonly #attributes: ProjectAttributes;
  readonly #adjacents: ProjectAdjacents;
  readonly #title: TitleSign;
  readonly #url: UrlSign;
  readonly #urlIntersect: Intersect;
  readonly #blackBoard: BlackBoard;
  readonly #session: ShowcaseSession;
  readonly #charcoalThreshold = uniform(CHARCOAL_THRESHOLD.initial);

  constructor(model: THREE.Object3D) {
    super(model);
    const require = (name: string): THREE.Object3D => this.requireReference(name);
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
      currentKey: () => this.#current?.images[this.#imageIndex] ?? '',
      siblingKey: () => this.#siblingImage(),
    });
    this.#pagination = new ImagePagination({
      require,
      dotReferences: this.references.items.get('intersectPagination') ?? [],
      hover,
      onSelect: (index) => this.#changeImage(index),
      onPrevious: () => this.previous(),
      onNext: () => this.next(),
    });
    this.#attributes = new ProjectAttributes(require('attributes'), this.#shades);
    this.#adjacents = new ProjectAdjacents({
      require,
      shades: this.#shades,
      hover,
      onPrevious: () => this.#previousProject('first'),
      onNext: () => this.#nextProject(),
    });
    this.#title = new TitleSign(require('title'), this.#shades, () => this.#current?.title ?? '');
    this.#url = new UrlSign({ group: require('url'), shades: this.#shades, getUrl: () => this.#current?.url ?? '' });
    this.#urlIntersect = urlSignIntersect(this.#url, require('intersectUrl'));
    this.#blackBoard = new BlackBoard(require, () => this.#session.isHidden);
    this.#fireCharcoal(require('charcoal'));
    hideForgeTools(require);
    this.#session = new ShowcaseSession({
      anchor: require('interactivePoint').position,
      offsets: CINEMATIC_OFFSETS,
      shades: this.#shades,
      blackBoard: this.#blackBoard,
      setIntersectsActive: (isActive) => {
        this.#pagination.setActive(isActive);
        this.#adjacents.setActive(isActive);
        this.#urlIntersect.active = isActive;
      },
    });

    this.#changeProject(0, { direction: 'next', isSilent: true });
  }

  override setObjects(): void {
    rebuildVillageProps(this.model);
    rebuildProjectsGate(this.model);
    removeAwardsTable(this.model);
    super.setObjects();
  }

  get state(): ShowcaseState {
    return this.#session.state;
  }

  get isShown(): boolean {
    return this.#session.isShown;
  }

  #createInteractivePoint(): void {
    const { interactiveButtons } = this.game.inputs;
    this.game.interactivePoints.create({
      position: this.requireReference('interactivePoint').position,
      text: '프로젝트',
      align: 'right',
      state: 'concealed',
      onInteract: () => this.open(),
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    });
  }

  #siblingImage(): string {
    const current = this.#current;
    if (!current) return '';
    let projectIndex = this.#index;
    let imageIndex = this.#imageIndex + (this.#imageDirection === 'previous' ? -1 : 1);
    if (imageIndex < 0) {
      projectIndex = wrapIndex(projectIndex - 1, this.#projects.length);
      imageIndex = (this.#projects[projectIndex]?.images.length ?? 1) - 1;
    } else if (imageIndex > current.images.length - 1) {
      projectIndex = wrapIndex(projectIndex + 1, this.#projects.length);
      imageIndex = 0;
    }
    return this.#projects[projectIndex]?.images[imageIndex] ?? '';
  }

  #adjacentTitles(): { previous: readonly string[]; next: readonly string[] } {
    const count = this.#projects.length;
    return {
      previous: this.#projects[wrapIndex(this.#index - 1, count)]?.titleSmall ?? [],
      next: this.#projects[(this.#index + 1) % count]?.titleSmall ?? [],
    };
  }

  #fireCharcoal(charcoal: THREE.Object3D): void {
    const { noises } = this.game;
    const threshold = this.#charcoalThreshold;
    const alphaNode = Fn(() => texture(noises.voronoi, uv()).g.sub(threshold))();
    assignMaterial(
      charcoal,
      new MeshDefaultMaterial({
        colorNode: color(CHARCOAL_COLOR).rgb,
        alphaNode,
        hasWater: false,
        hasLightBounce: false,
      }),
    );
  }

  open(): void {
    this.#session.open();
  }

  close(): void {
    this.#session.close();
  }

  previous(): void {
    if (this.#imageIndex > 0) this.#previousImage();
    else this.#previousProject('last');
  }

  next(): void {
    const imageCount = this.#current?.images.length ?? 0;
    if (this.#imageIndex < imageCount - 1) this.#nextImage();
    else this.#nextProject();
  }

  #previousImage(): void {
    if (this.#session.isHidden) return;
    this.#changeImage(this.#imageIndex - 1, { direction: 'previous' });
    this.#blackBoard.isActive = false;
  }

  #nextImage(): void {
    if (this.#session.isHidden) return;
    this.#changeImage(this.#imageIndex + 1, { direction: 'next' });
    this.#blackBoard.isActive = false;
  }

  #previousProject(landing: ImageLanding): void {
    if (this.#session.isHidden) return;
    this.#changeProject(this.#index - 1, { direction: 'previous', landing });
    this.#blackBoard.isActive = false;
  }

  #nextProject(): void {
    if (this.#session.isHidden) return;
    this.#changeProject(this.#index + 1, { direction: 'next' });
    this.#blackBoard.isActive = false;
  }

  #changeProject(
    index: number,
    {
      direction,
      landing = 'last',
      isSilent = false,
    }: { direction: Direction; landing?: ImageLanding; isSilent?: boolean },
  ): void {
    const count = this.#projects.length;
    this.#index = wrapIndex(index, count);
    const current = this.#projects[this.#index] ?? null;
    this.#current = current;

    this.#attributes.update(() => (this.#current?.attributes ?? {}) satisfies Partial<Record<AttributeName, string>>);
    this.#adjacents.update(() => this.#adjacentTitles());
    this.#title.update(direction);
    this.#url.update(direction);

    const isFirstImage = landing === 'first' || direction === 'next';
    const imageIndex = isFirstImage ? 0 : (current?.images.length ?? 1) - 1;
    if (!isSilent) {
      this.game.audio.groups.get('click')?.play();
      this.game.audio.groups.get('assemble')?.play();
    }
    this.#changeImage(imageIndex, { direction, isSilent });
  }

  #changeImage(
    imageIndex: number,
    { direction, isSilent = false }: { direction?: Direction; isSilent?: boolean } = {},
  ): void {
    const resolvedDirection = direction ?? (imageIndex > this.#imageIndex ? 'next' : 'previous');
    this.#imageIndex = imageIndex;
    this.#imageDirection = resolvedDirection;
    this.#images.update(resolvedDirection);
    this.#pagination.update({
      imageCount: this.#current?.images.length ?? 0,
      imageIndex,
      isShown: this.#session.isShown,
    });
    if (isSilent) return;
    this.game.audio.groups.get('click')?.play();
    this.game.audio.groups.get('slide')?.play();
  }

  override update(): void {
    const { elapsedScaled } = this.game.ticker;
    this.#charcoalThreshold.value =
      -Math.sin(elapsedScaled - CHARCOAL_THRESHOLD.phase) * CHARCOAL_THRESHOLD.amplitude + CHARCOAL_THRESHOLD.base;
  }
}
