import gsap from 'gsap';
import { Fn, positionGeometry, sin, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { type LatestPost, LATEST_POSTS_ENDPOINT, parseLatestPostsResponse } from '@entities/blog';

import { createElement } from '../../utilities/createElement';
import { noticeBoard } from '../islandStructures';

type BoardState = { status: 'loading' } | { status: 'ready'; posts: readonly LatestPost[] } | { status: 'failed' };

const CANVAS = { width: 1200, height: 800, padding: 70 } as const;
const BOARD_SIZE = new THREE.Vector3(3.4, 3.4, 0.5);
const PAPER_SEGMENTS = 24;
const FLUTTER = { lift: 0.06, speed: 2.6, near: 6, far: 18, idle: 0.25, response: 3 } as const;
const PAGE_TURN = { duration: 0.32, curl: 0.6 } as const;
const UP = new THREE.Vector3(0, 1, 0);
const COLORS = { paper: '#fbf3e4', rule: '#efdcb8', title: '#1f5f6e', ink: '#23434a', muted: '#6b7b7b' } as const;
const FONTS = {
  heading: '700 84px MaruBuri',
  label: '700 34px MaruBuri',
  date: '400 32px MaruBuri',
  post: '700 48px MaruBuri',
} as const;
const ROW = { top: 250, height: 170, dateOffset: 0, titleOffset: 56 } as const;
const STATUS_TEXT = {
  loading: '최신 글을 불러오는 중이에요',
  failed: '글을 불러오지 못했어요. 잠시 후 다시 열어 주세요.',
  empty: '아직 올라온 글이 없어요',
} as const;

const DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Seoul',
});

function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

function fitText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && context.measureText(`${text.slice(0, end)}…`).width > maxWidth) end -= 1;
  return `${text.slice(0, end)}…`;
}

function postsOf(state: BoardState): readonly LatestPost[] {
  return state.status === 'ready' ? state.posts : [];
}

function statusText(state: BoardState): string | null {
  if (state.status === 'loading') return STATUS_TEXT.loading;
  if (state.status === 'failed') return STATUS_TEXT.failed;
  return state.posts.length === 0 ? STATUS_TEXT.empty : null;
}

function contentKey(state: BoardState): string {
  return state.status === 'ready' ? `ready:${state.posts.map(({ url }) => url).join('|')}` : state.status;
}

function postImage(url: string): HTMLElement {
  const image = createElement('img', 'blog-post-image');
  image.src = url;
  image.alt = '';
  image.loading = 'lazy';
  return createElement('span', 'blog-post-media', [image]);
}

function postCard(post: LatestPost, order: number): HTMLElement {
  const link = createElement('a', 'blog-post');
  link.href = post.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (post.imageUrl) link.append(postImage(post.imageUrl));
  link.append(
    createElement('div', 'blog-post-body', [
      createElement('span', 'blog-post-date', [formatDate(post.publishedAt)]),
      createElement('strong', 'blog-post-title', [post.title]),
      createElement('p', 'blog-post-description', [post.description]),
    ]),
  );
  const item = createElement('li', '', [link]);
  item.style.setProperty('--order', String(order));
  return item;
}

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
    screen.material.positionNode = this.#paperPosition(top, top * 2);
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

  #paperPosition(top: number, height: number): THREE.Node {
    const time = this.#time;
    const flutter = this.#flutter;
    const turn = this.#turn;
    return Fn(() => {
      const position = positionGeometry.toVar();
      const hang = position.y.negate().add(top);
      const hangRatio = hang.div(height);
      const wave = sin(time.mul(FLUTTER.speed).add(position.x.mul(2.2)).add(position.y.mul(1.4)))
        .mul(sin(time.mul(FLUTTER.speed * 0.43).add(position.x.mul(0.9))))
        .add(1)
        .mul(0.5);
      const lift = wave.mul(flutter).mul(hangRatio.pow(1.6)).mul(FLUTTER.lift);
      const angle = turn.mul(Math.PI / 2).mul(hangRatio.mul(PAGE_TURN.curl).add(1 - PAGE_TURN.curl / 2));
      position.y.assign(hang.mul(angle.cos()).negate().add(top));
      position.z.assign(hang.mul(angle.sin()).add(lift));
      return position;
    })();
  }

  #render(): void {
    void document.fonts.load(FONTS.post).finally(() => this.#requestDraw());
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
    const context = this.#context;
    const { width, height, padding } = CANVAS;
    context.fillStyle = COLORS.paper;
    context.fillRect(0, 0, width, height);
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    context.fillStyle = COLORS.title;
    context.font = FONTS.heading;
    context.fillText('최신 글', padding, 150);
    context.font = FONTS.label;
    context.fillStyle = COLORS.muted;
    context.textAlign = 'right';
    context.fillText('Dansoon 블로그', width - padding, 150);
    context.textAlign = 'left';
    context.fillStyle = COLORS.rule;
    context.fillRect(padding, 190, width - padding * 2, 6);

    const message = statusText(this.#state);
    if (message) {
      context.font = FONTS.label;
      context.fillStyle = COLORS.muted;
      context.fillText(message, padding, ROW.top + 60);
    } else {
      for (const [index, post] of postsOf(this.#state).entries()) {
        const top = ROW.top + index * ROW.height;
        context.font = FONTS.date;
        context.fillStyle = COLORS.muted;
        context.fillText(formatDate(post.publishedAt), padding, top + ROW.dateOffset + 30);
        context.font = FONTS.post;
        context.fillStyle = COLORS.ink;
        context.fillText(fitText(context, post.title, width - padding * 2), padding, top + ROW.titleOffset + 40);
      }
    }
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
