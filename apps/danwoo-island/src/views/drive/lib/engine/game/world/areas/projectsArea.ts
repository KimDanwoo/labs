import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import content from '../../../data/danwoo';
import type { ProjectContent } from '../../../data/worldContent';
import type { Intersect } from '../../rayCursor';
import { removeAwardsTable } from '../islandReskins';
import { rebuildVillageProps } from '../islandVillage';
import { rebuildProjectsGate } from '../villageStructures';
import { Area } from './area';
import { createAreaPoint, playGroups } from './areaPoint';
import { ImagePagination } from './imagePagination';
import { ProjectAttributes, type AttributeName } from './projectAttributes';
import {
  adjacentTitles,
  CHARCOAL_THRESHOLD,
  charcoalThresholdAt,
  CINEMATIC_OFFSETS,
  fireCharcoal,
  hideForgeTools,
  landingImageIndex,
  siblingImage,
  wrapIndex,
  type ImageLanding,
} from './projectsAreaConfig';
import { ProjectAdjacents } from './projectsPanels';
import { BlackBoard } from './showcaseBlackBoard';
import { ShowcaseImages } from './showcaseImages';
import { bindShowcaseInputs, ShowcaseSession, type ShowcaseState } from './showcaseSession';
import { TitleSign, UrlSign, urlSignIntersect } from './showcaseSigns';
import { createHoverMaterials, createShades, type Direction } from './showcaseVisuals';

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
    createAreaPoint(this, { text: '프로젝트', align: 'right', onInteract: () => this.open() });
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
      siblingKey: () =>
        siblingImage(this.#projects, {
          index: this.#index,
          imageIndex: this.#imageIndex,
          direction: this.#imageDirection,
        }),
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
      onPrevious: () => this.#shiftProject(-1, 'first'),
      onNext: () => this.#shiftProject(1),
    });
    this.#title = new TitleSign(require('title'), this.#shades, () => this.#current?.title ?? '');
    this.#url = new UrlSign({ group: require('url'), shades: this.#shades, getUrl: () => this.#current?.url ?? '' });
    this.#urlIntersect = urlSignIntersect(this.#url, require('intersectUrl'));
    this.#blackBoard = new BlackBoard(require, () => this.#session.isHidden);
    fireCharcoal(this.game, require('charcoal'), this.#charcoalThreshold);
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

  open(): void {
    this.#session.open();
  }

  close(): void {
    this.#session.close();
  }

  previous(): void {
    if (this.#imageIndex > 0) this.#step(() => this.#changeImage(this.#imageIndex - 1, { direction: 'previous' }));
    else this.#shiftProject(-1);
  }

  next(): void {
    const imageCount = this.#current?.images.length ?? 0;
    if (this.#imageIndex < imageCount - 1)
      this.#step(() => this.#changeImage(this.#imageIndex + 1, { direction: 'next' }));
    else this.#shiftProject(1);
  }

  #shiftProject(offset: 1 | -1, landing: ImageLanding = 'last'): void {
    const direction = offset < 0 ? 'previous' : 'next';
    this.#step(() => this.#changeProject(this.#index + offset, { direction, landing }));
  }

  #step(change: () => void): void {
    if (this.#session.isHidden) return;
    change();
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
    this.#adjacents.update(() => adjacentTitles(this.#projects, this.#index));
    this.#title.update(direction);
    this.#url.update(direction);

    if (!isSilent) playGroups(this, ['click', 'assemble']);
    this.#changeImage(landingImageIndex(current, landing, direction), { direction, isSilent });
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
    if (!isSilent) playGroups(this, ['click', 'slide']);
  }

  override update(): void {
    this.#charcoalThreshold.value = charcoalThresholdAt(this.game.ticker.elapsedScaled);
  }
}
