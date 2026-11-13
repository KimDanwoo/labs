import { getCollection, type CollectionEntry } from 'astro:content';
import type { CategoryId, SeriesId, TagId } from '~/lib/taxonomy';

export type Post = CollectionEntry<'posts'>;

const RELATED_POSTS_LIMIT = 3;
const SAME_CATEGORY_SCORE = 1;
const SHARED_TAG_SCORE = 2;

const isPublished = (post: Post) => import.meta.env.DEV || !post.data.draft;
const byNewest = (a: Post, b: Post) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf();

/** 상세·목록·RSS·검색·태그가 모두 이 집합만 쓴다 — draft는 dev 서버에서만 보인다(미리보기용). */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', isPublished);
  return posts.sort(byNewest);
}

export const postPath = (post: Post) => `/posts/${post.id}/`;

export const categoryPath = (category: CategoryId) => `/categories/${category}/`;
export const tagPath = (tag: TagId) => `/tags/${tag}/`;
export const seriesPath = (series: SeriesId) => `/series/${series}/`;

export function filterByCategory(posts: Post[], category: CategoryId) {
  return posts.filter((post) => post.data.category === category);
}

export function filterByTag(posts: Post[], tag: TagId) {
  return posts.filter((post) => post.data.tags.includes(tag));
}

const bySeriesOrder = (a: Post, b: Post) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0);

// order가 겹치면 순서가 입력 순서에 따라 바뀌므로 빌드를 멈춰 바로잡게 한다
function assertUniqueSeriesOrder(series: SeriesId, posts: Post[]): void {
  const orders = posts.map((post) => post.data.series?.order);
  if (new Set(orders).size === orders.length) return;
  throw new Error(`연재 '${series}'에 order가 겹치는 글이 있습니다: ${posts.map((post) => post.id).join(', ')}`);
}

export function filterBySeries(posts: Post[], series: SeriesId): Post[] {
  const seriesPosts = posts.filter((post) => post.data.series?.id === series);
  assertUniqueSeriesOrder(series, seriesPosts);
  return seriesPosts.sort(bySeriesOrder);
}

export function getAdjacentPosts(posts: Post[], current: Post) {
  const index = posts.findIndex((post) => post.id === current.id);
  return { newer: posts[index - 1], older: posts[index + 1] };
}

function relatedScore(base: Post, candidate: Post) {
  const sharedTags = candidate.data.tags.filter((tag) => base.data.tags.includes(tag)).length;
  const sameCategory = candidate.data.category === base.data.category ? SAME_CATEGORY_SCORE : 0;
  return sharedTags * SHARED_TAG_SCORE + sameCategory;
}

export function getRelatedPosts(posts: Post[], current: Post) {
  return posts
    .filter((post) => post.id !== current.id)
    .map((post) => ({ post, score: relatedScore(current, post) }))
    .filter(({ score }) => score > SAME_CATEGORY_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, RELATED_POSTS_LIMIT)
    .map(({ post }) => post);
}

export function countBy<Key extends string>(posts: Post[], keysOf: (post: Post) => readonly Key[]) {
  const counts = new Map<Key, number>();
  for (const post of posts) {
    for (const key of keysOf(post)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
