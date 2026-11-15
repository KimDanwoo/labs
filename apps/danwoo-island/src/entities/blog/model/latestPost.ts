export interface LatestPost {
  readonly title: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly url: string;
  readonly imageUrl: string | null;
}

export const BLOG_ORIGIN = 'https://danwoo.dev';
export const LATEST_POSTS_ENDPOINT = '/api/latest-posts';
export const LATEST_POSTS_LIMIT = 3;

const POST_PATH = /^\/posts\/([^/]+)\/?$/;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isRecord(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function blogPostSlug(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== BLOG_ORIGIN) return null;
    return POST_PATH.exec(parsed.pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isBlogPostUrl(url: string): boolean {
  return blogPostSlug(url) !== null;
}

export function isBlogAssetUrl(url: string): boolean {
  try {
    return new URL(url).origin === BLOG_ORIGIN;
  } catch {
    return false;
  }
}

export function isLatestPost(value: unknown): value is LatestPost {
  if (!isRecord(value)) return false;
  const [title, description, publishedAt, url, imageUrl]: unknown[] = [
    'title',
    'description',
    'publishedAt',
    'url',
    'imageUrl',
  ].map((key) => Reflect.get(value, key));
  return (
    isString(title) &&
    isString(description) &&
    isString(publishedAt) &&
    isString(url) &&
    isBlogPostUrl(url) &&
    (imageUrl === null || (isString(imageUrl) && isBlogAssetUrl(imageUrl)))
  );
}

export function parseLatestPostsResponse(body: unknown): LatestPost[] {
  if (!isRecord(body)) return [];
  const posts: unknown = Reflect.get(body, 'posts');
  return Array.isArray(posts) ? posts.filter(isLatestPost).slice(0, LATEST_POSTS_LIMIT) : [];
}
