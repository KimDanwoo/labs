import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { postOgImagePath } from '~/lib/postImage';
import { getPublishedPosts, postPath } from '~/lib/posts';
import { CATEGORY_LABEL } from '~/lib/taxonomy';

const MEDIA_NAMESPACE = 'http://search.yahoo.com/mrss/';
const SITE = 'https://danwoo.dev';

const xmlAttribute = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export async function GET({ site }: APIContext) {
  const origin = site ?? SITE;
  const posts = await getPublishedPosts();
  const items = await Promise.all(
    posts.map(async (post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: postPath(post),
      categories: [CATEGORY_LABEL[post.data.category]],
      customData: `<media:content url="${xmlAttribute(new URL(await postOgImagePath(post), origin).href)}" medium="image" />`,
    })),
  );
  return rss({
    title: 'Dansoon',
    description: '프론트엔드 개발을 하며 배운 것과 회고, 읽은 책을 기록해요.',
    site: origin,
    xmlns: { media: MEDIA_NAMESPACE },
    items,
    customData: '<language>ko</language>',
  });
}
