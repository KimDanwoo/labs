import {
  BLOG_ORIGIN,
  isBlogAssetUrl,
  isBlogPostUrl,
  LATEST_POSTS_LIMIT,
  type LatestPost,
} from '@entities/blog/model/latestPost';

const RSS_URL = `${BLOG_ORIGIN}/rss.xml`;
const REVALIDATE_SECONDS = 3600;
const RSS_TIMEOUT_MS = 5000;
const MAX_RSS_LENGTH = 2_000_000;
const FEED_ROOT = /<rss[\s>]/;
const CDATA_OPEN = '<![CDATA[';
const CDATA_CLOSE = ']]>';
const MEDIA_TAG = '<media:content';
const URL_ATTRIBUTE = /\surl="([^"]*)"/;
const NAMED_ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const ENTITY = /&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi;
const HEX_RADIX = 16;
const DECIMAL_RADIX = 10;
const MAX_CODE_POINT = 0x10ffff;
const HEX_ENTITY = /^#x/i;

function codePoint(digits: string, radix: number): number | null {
  const value = Number.parseInt(digits, radix);
  const isValidCodePoint = Number.isInteger(value) && value >= 0 && value <= MAX_CODE_POINT;
  return isValidCodePoint ? value : null;
}

function numericEntity(name: string): number | null {
  if (HEX_ENTITY.test(name)) return codePoint(name.slice(2), HEX_RADIX);
  if (name.startsWith('#')) return codePoint(name.slice(1), DECIMAL_RADIX);
  return null;
}

function decodeEntity(entity: string, name: string): string {
  const numeric = numericEntity(name);
  if (numeric !== null) return String.fromCodePoint(numeric);
  return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
}

function decode(text: string): string {
  const trimmed = text.trim();
  const isCdata = trimmed.startsWith(CDATA_OPEN) && trimmed.endsWith(CDATA_CLOSE);
  if (isCdata) {
    return trimmed.slice(CDATA_OPEN.length, -CDATA_CLOSE.length);
  }
  return trimmed.replace(ENTITY, decodeEntity);
}

function between(source: string, open: string, close: string, from = 0): { text: string; end: number } | null {
  const start = source.indexOf(open, from);
  if (start === -1) return null;
  const end = source.indexOf(close, start + open.length);
  if (end === -1) return null;
  return { text: source.slice(start + open.length, end), end: end + close.length };
}

function items(rss: string): string[] {
  const found: string[] = [];
  let cursor = 0;
  for (let item = between(rss, '<item>', '</item>'); item; item = between(rss, '<item>', '</item>', cursor)) {
    found.push(item.text);
    cursor = item.end;
  }
  return found;
}

function tag(item: string, name: string): string | null {
  const content = between(item, `<${name}>`, `</${name}>`);
  return content === null ? null : decode(content.text);
}

function mediaImage(item: string): string | null {
  const media = between(item, MEDIA_TAG, '>');
  const raw = media === null ? undefined : URL_ATTRIBUTE.exec(media.text)?.[1];
  if (raw === undefined) return null;
  const url = decode(raw);
  return isBlogAssetUrl(url) ? url : null;
}

function toLatestPost(item: string): LatestPost | null {
  const title = tag(item, 'title');
  const url = tag(item, 'link');
  const pubDate = tag(item, 'pubDate');
  if (!title) return null;
  if (!url) return null;
  if (!pubDate) return null;
  if (!isBlogPostUrl(url)) return null;
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
  const isUnreadableFeed = rss.length > MAX_RSS_LENGTH || !FEED_ROOT.test(rss);
  if (isUnreadableFeed) throw new Error('Blog RSS is not a feed');
  return items(rss)
    .map(toLatestPost)
    .filter((post): post is LatestPost => post !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export async function fetchLatestPosts(): Promise<LatestPost[]> {
  const response = await fetch(RSS_URL, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Blog RSS responded ${response.status}`);
  return parseLatestPosts(await response.text());
}
