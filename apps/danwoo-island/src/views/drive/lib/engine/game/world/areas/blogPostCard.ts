import type { LatestPost } from '@entities/blog';
import * as THREE from 'three/webgpu';
import { createElement } from '../../utilities/createElement';

export type BoardState =
  | { status: 'loading' }
  | { status: 'ready'; posts: readonly LatestPost[] }
  | { status: 'failed' };
export const CANVAS = { width: 1200, height: 800, padding: 70 } as const;
export const BOARD_SIZE = new THREE.Vector3(3.4, 3.4, 0.5);
export const PAPER_SEGMENTS = 24;
export const FLUTTER = { lift: 0.06, speed: 2.6, near: 6, far: 18, idle: 0.25, response: 3 } as const;
export const PAGE_TURN = { duration: 0.32, curl: 0.6 } as const;
export const UP = new THREE.Vector3(0, 1, 0);
export const COLORS = {
  paper: '#fbf3e4',
  rule: '#efdcb8',
  title: '#1f5f6e',
  ink: '#23434a',
  muted: '#6b7b7b',
} as const;
export const FONTS = {
  heading: '700 84px MaruBuri',
  label: '700 34px MaruBuri',
  date: '400 32px MaruBuri',
  post: '700 48px MaruBuri',
} as const;
export const ROW = { top: 250, height: 170, dateOffset: 0, titleOffset: 56 } as const;
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
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}
export function fitText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && context.measureText(`${text.slice(0, end)}…`).width > maxWidth) end -= 1;
  return `${text.slice(0, end)}…`;
}
export function postsOf(state: BoardState): readonly LatestPost[] {
  return state.status === 'ready' ? state.posts : [];
}
export function statusText(state: BoardState): string | null {
  if (state.status === 'loading') return STATUS_TEXT.loading;
  if (state.status === 'failed') return STATUS_TEXT.failed;
  return state.posts.length === 0 ? STATUS_TEXT.empty : null;
}
export function contentKey(state: BoardState): string {
  return state.status === 'ready' ? `ready:${state.posts.map(({ url }) => url).join('|')}` : state.status;
}
function postImage(url: string): HTMLElement {
  const image = createElement('img', 'blog-post-image');
  image.src = url;
  image.alt = '';
  image.loading = 'lazy';
  return createElement('span', 'blog-post-media', [image]);
}
export function postCard(post: LatestPost, order: number): HTMLElement {
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
