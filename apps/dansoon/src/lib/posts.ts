import { getCollection, type CollectionEntry } from 'astro:content';
import type { CategoryId, SeriesId, TagId } from '~/lib/taxonomy';

export type Post = CollectionEntry<'posts'>;

const RELATED_POSTS_LIMIT = 3;
const SAME_CATEGORY_SCORE = 1;
const SHARED_TAG_SCORE = 2;

const isPublished = (post: Post) => !post.data.draft;
const byNewest = (a: Post, b: Post) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf();

function assertUniqueSeriesOrder(posts: Post[]) {
  const seen = new Set<string>();
  for (const { id, data } of posts) {
    if (!data.series) continue;
    const key = `${data.series}#${data.seriesOrder}`;
    if (seen.has(key)) throw new Error(`연재 순서가 겹친다: ${key} (${id})`);
    seen.add(key);
  }
}

/** 상세·목록·RSS·검색·태그·연재가 모두 이 집합만 쓴다 — draft는 어디에도 노출되지 않는다. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', isPublished);
  assertUniqueSeriesOrder(posts);
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

export function getSeriesPosts(posts: Post[], series: SeriesId) {
  return posts
    .filter((post) => post.data.series === series)
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
}

/** posts는 최신순이다 — 앞이 더 새 글이다. */
export function getAdjacentPosts(posts: Post[], current: Post) {
  const index = posts.findIndex((post) => post.id === current.id);
  return { newer: posts[index - 1], older: posts[index + 1] };
}

function relatedScore(base: Post, candidate: Post) {
  const sharedTags = candidate.data.tags.filter((tag) => base.data.tags.includes(tag)).length;
  const sameCategory = candidate.data.category === base.data.category ? SAME_CATEGORY_SCORE : 0;
  return sharedTags * SHARED_TAG_SCORE + sameCategory;
}

/** 같은 연재 글은 연재 목록에 이미 보이므로 제외한다. 점수가 같으면 최신 글이 앞선다(posts가 최신순). */
export function getRelatedPosts(posts: Post[], current: Post) {
  const isSameSeries = (post: Post) => Boolean(current.data.series) && post.data.series === current.data.series;
  return posts
    .filter((post) => post.id !== current.id && !isSameSeries(post))
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
