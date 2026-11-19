import gsap from 'gsap';
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { LATEST_POSTS_ENDPOINT, parseLatestPostsResponse } from '@entities/blog';

import { createElement } from '../../utilities/createElement';
import { noticeBoard } from '../villageStructures';
import { paintBoard, paperPosition } from './blogBoardPaint';
import {
  BOARD_SIZE,
  CANVAS,
  FLUTTER,
  FONTS,
  PAGE_TURN,
  PAPER_SEGMENTS,
  UP,
  contentKey,
  postCard,
  postsOf,
  statusText,
  type BoardState,
} from './blogPostCard';

export class BlogBoard {
  readonly group: THREE.Group;
  readonly #context: CanvasRenderingContext2D;
  readonly #texture: THREE.CanvasTexture;
  readonly #listElement: HTMLElement;
  readonly #center: THREE.Vector3;
  readonly #time = uniform(0);
  readonly #flutter = uniform(FLUTTER.idle);
  readonly #turn = uniform(0);
  #state: BoardState = { status: 'loading' };
  #pending: Promise<void> | null = null;
  #paintedKey: string | null = null;
  #isTurning = false;

  constructor({
    position,
    rotation,
    listElement,
  }: {
    position: THREE.Vector3;
    rotation: number;
    listElement: HTMLElement;
  }) {
    const canvas = createElement('canvas');
    canvas.width = CANVAS.width;
    canvas.height = CANVAS.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas is not supported');
    this.#context = context;
    this.#texture = new THREE.CanvasTexture(canvas);
    this.#texture.colorSpace = THREE.SRGBColorSpace;
    this.#listElement = listElement;

    const center = position.clone().setY(position.y + BOARD_SIZE.y / 2);
    const matrix = new THREE.Matrix4().compose(
      center,
      new THREE.Quaternion().setFromAxisAngle(UP, rotation),
      new THREE.Vector3(1, 1, 1),
    );
    this.#center = center;
    const { group, screen } = noticeBoard({ size: BOARD_SIZE, matrix }, this.#texture, { segments: PAPER_SEGMENTS });
    this.group = group;
    screen.geometry.computeBoundingBox();
    const top = screen.geometry.boundingBox?.max.y ?? 0;
    screen.material.positionNode = paperPosition(
      { time: this.#time, flutter: this.#flutter, turn: this.#turn },
      top,
      top * 2,
    );
    screen.frustumCulled = false;
    this.#render();
  }

  get isReady(): boolean {
    return this.#state.status === 'ready';
  }

  update({ delta, viewer }: { delta: number; viewer: THREE.Vector3 }): void {
    const distance = Math.hypot(viewer.x - this.#center.x, viewer.z - this.#center.z);
    const closeness = THREE.MathUtils.clamp((FLUTTER.far - distance) / (FLUTTER.far - FLUTTER.near), 0, 1);
    const target = THREE.MathUtils.lerp(FLUTTER.idle, 1, closeness);
    this.#flutter.value = THREE.MathUtils.damp(this.#flutter.value, target, FLUTTER.response, delta);
    this.#time.value += delta;
  }

  load(): Promise<void> {
    this.#pending ??= this.#fetchPosts().finally(() => {
      this.#pending = null;
    });
    return this.#pending;
  }

  async #fetchPosts(): Promise<void> {
    this.#setState({ status: 'loading' });
    try {
      const response = await fetch(LATEST_POSTS_ENDPOINT);
      const posts = parseLatestPostsResponse(await response.json());
      this.#setState(response.ok ? { status: 'ready', posts } : { status: 'failed' });
    } catch {
      this.#setState({ status: 'failed' });
    }
  }

  #setState(state: BoardState): void {
    this.#state = state;
    this.#render();
  }

  #render(): void {
    const text = postsOf(this.#state)
      .map(({ title }) => title)
      .join('');
    const faces = [FONTS.heading, FONTS.post, FONTS.date].map((font) => document.fonts.load(font, `${text}최신 글0`));
    void Promise.allSettled(faces).finally(() => this.#requestDraw());
    this.#renderPanel();
  }

  #requestDraw(): void {
    if (this.#isTurning || contentKey(this.#state) === this.#paintedKey) return;
    if (this.#paintedKey === null) {
      this.#drawBoard();
      return;
    }
    this.#isTurning = true;
    gsap.to(this.#turn, {
      value: 1,
      duration: PAGE_TURN.duration,
      ease: 'power2.in',
      onComplete: () => {
        this.#drawBoard();
        gsap.to(this.#turn, {
          value: 0,
          duration: PAGE_TURN.duration * 1.4,
          ease: 'back.out(1.6)',
          onComplete: () => {
            this.#isTurning = false;
            this.#requestDraw();
          },
        });
      },
    });
  }

  #drawBoard(): void {
    this.#paintedKey = contentKey(this.#state);
    paintBoard(this.#context, this.#state);
    this.#texture.needsUpdate = true;
  }

  #renderPanel(): void {
    const message = statusText(this.#state);
    if (message) {
      this.#listElement.replaceChildren(createElement('li', 'blog-status', [message]));
      return;
    }
    this.#listElement.replaceChildren(...postsOf(this.#state).map((post, order) => postCard(post, order)));
  }
}
