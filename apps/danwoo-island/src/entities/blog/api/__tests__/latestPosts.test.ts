import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseLatestPostsResponse } from '../../model/latestPost';
import { parseLatestPosts } from '../fetchLatestPosts';

const item = (slug: string, date: string, media = `https://danwoo.dev/_astro/${slug}.jpg`): string =>
  `<item><title><![CDATA[글 ${slug}]]></title><link>https://danwoo.dev/posts/${slug}/</link><description>요약 &amp; 설명</description><pubDate>${date}</pubDate><media:content url="${media}" medium="image"/></item>`;

test('RSS에서 최신 글 3편을 날짜 역순으로 고른다', () => {
  const rss = [
    item('a', 'Mon, 01 Jan 2026 00:00:00 GMT'),
    item('b', 'Wed, 01 Apr 2026 00:00:00 GMT'),
    item('c', 'Sun, 01 Mar 2026 00:00:00 GMT'),
    item('d', 'Thu, 01 Jan 2026 12:00:00 GMT'),
  ].join('');
  const posts = parseLatestPosts(`<rss><channel>${rss}</channel></rss>`);
  assert.deepEqual(
    posts.map((post) => post.url),
    ['https://danwoo.dev/posts/b/', 'https://danwoo.dev/posts/c/', 'https://danwoo.dev/posts/d/'],
  );
  assert.equal(posts[0]?.imageUrl, 'https://danwoo.dev/_astro/b.jpg');
  assert.equal(posts[0]?.description, '요약 & 설명');
});

test('블로그 밖 이미지는 이미지 없이 둔다', () => {
  const [post] = parseLatestPosts(item('a', 'Mon, 01 Jan 2026 00:00:00 GMT', 'https://evil.example/a.jpg'));
  assert.equal(post?.imageUrl, null);
});

test('블로그 밖 주소나 javascript: 링크는 버린다', () => {
  const rss = [
    '<item><title>x</title><link>javascript:alert(1)</link><pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate></item>',
    '<item><title>y</title><link>https://evil.example/posts/y/</link><pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate></item>',
  ].join('');
  assert.deepEqual(parseLatestPosts(rss), []);
});

test('API 응답은 형태와 이미지 주소까지 검증한다', () => {
  const valid = {
    title: 't',
    description: 'd',
    publishedAt: '2026-01-01T00:00:00.000Z',
    url: 'https://danwoo.dev/posts/a/',
    imageUrl: 'https://danwoo.dev/_astro/a.jpg',
  };
  const spoofed = { ...valid, imageUrl: 'https://evil.example/x.png' };
  assert.deepEqual(parseLatestPostsResponse({ posts: [valid, spoofed, 'x'] }), [valid]);
  assert.deepEqual(parseLatestPostsResponse(null), []);
});
