import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const techPosts = await getCollection('tech');
  const bookPosts = await getCollection('book');
  const items = [...techPosts, ...bookPosts]
    .filter((post) => !post.data.isHidden && post.data.title !== '🧑🏻‍💻 frontend 김단우')
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((post) => {
      const slug = post.id.replace(/\/index\.md$/, '').replace(/\.md$/, '');
      const prefix = post.collection === 'book' ? 'book' : 'tech';
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/${prefix}/${slug}/`,
      };
    });

  return rss({
    title: 'blog.danwoo RSS Feed',
    description: '기록하고 공유합니다',
    site: context.site!,
    items,
  });
}
