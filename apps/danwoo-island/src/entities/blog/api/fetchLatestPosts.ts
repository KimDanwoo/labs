import { BLOG_ORIGIN, isBlogAssetUrl, isBlogPostUrl, LATEST_POSTS_LIMIT, type LatestPost } from '../model/latestPost';

const RSS_URL = `${BLOG_ORIGIN}/rss.xml`;
const REVALIDATE_SECONDS = 3600;
const ITEM = /<item>([\s\S]*?)<\/item>/g;
const CDATA = /^<!\[CDATA\[([\s\S]*)\]\]>$/;
const MEDIA_URL = /<media:content[^>]*\surl="([^"]+)"/;
const ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

function decode(text: string): string {
  const raw = CDATA.exec(text.trim())?.[1] ?? text.trim();
  return raw.replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (entity) => ENTITIES[entity] ?? entity);
}

function tag(item: string, name: string): string | null {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(item);
  return match?.[1] === undefined ? null : decode(match[1]);
}

function mediaImage(item: string): string | null {
  const raw = MEDIA_URL.exec(item)?.[1];
  if (raw === undefined) return null;
  const url = decode(raw);
  return isBlogAssetUrl(url) ? url : null;
}

function toLatestPost(item: string): LatestPost | null {
  const title = tag(item, 'title');
  const url = tag(item, 'link');
  const pubDate = tag(item, 'pubDate');
  if (!title || !url || !pubDate || !isBlogPostUrl(url)) return null;
  const publishedAt = new Date(pubDate);
  if (Number.isNaN(publishedAt.getTime())) return null;
  return {
    title,
    description: tag(item, 'description') ?? '',
    publishedAt: publishedAt.toISOString(),
    url,
    imageUrl: mediaImage(item),
  };
}

export function parseLatestPosts(rss: string, limit = LATEST_POSTS_LIMIT): LatestPost[] {
  return [...rss.matchAll(ITEM)]
    .map(([, item]) => (item === undefined ? null : toLatestPost(item)))
    .filter((post): post is LatestPost => post !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export async function fetchLatestPosts(): Promise<LatestPost[]> {
  const response = await fetch(RSS_URL, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) throw new Error(`Blog RSS responded ${response.status}`);
  return parseLatestPosts(await response.text());
}
