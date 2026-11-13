import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, postPath } from '~/lib/posts';
import { CATEGORY_LABEL } from '~/lib/taxonomy';

export async function GET({ site }: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Dansoon',
    description: '프론트엔드 개발을 하며 배운 것과 회고, 읽은 책을 기록해요.',
    site: site ?? 'https://danwoo.dev',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: postPath(post),
      categories: [CATEGORY_LABEL[post.data.category]],
    })),
    customData: '<language>ko</language>',
  });
}
