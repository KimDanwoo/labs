import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, postPath } from '~/lib/posts';
import { CATEGORY_LABEL } from '~/lib/taxonomy';

export async function GET({ site }: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Dansoon',
    description: '프론트엔드 엔지니어 김단우의 개발 노트, 회고, 독서 기록',
    site: site ?? 'https://log.danwoo.dev',
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
