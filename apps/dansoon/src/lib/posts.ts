import { getCollection, type CollectionEntry } from 'astro:content';
import type { CategoryId, TagId } from '~/lib/taxonomy';

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

export function filterByCategory(posts: Post[], category: CategoryId) {
  return posts.filter((post) => post.data.category === category);
}

export function filterByTag(posts: Post[], tag: TagId) {
  return posts.filter((post) => post.data.tags.includes(tag));
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

/** 태그가 하나 이상 겹치는 글만 고른다. 점수가 같으면 최신 글이 앞선다(posts가 최신순). */
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
